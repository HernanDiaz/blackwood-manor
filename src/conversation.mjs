import { personalities, personaAnswer } from './personalities.mjs';
import {
  dialogueRules,
  socialLines,
  replyUnits,
  validateEvidence,
  reviewRules,
  reviewSchema,
} from './dialogue-policy.mjs';
import { availableFacts, answer, suspects } from './engine.mjs';
import { requestLocalJson, localClassify } from './local-llm.mjs';
const norm = s =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
export function unknownReply(state, person, question) {
  const q = norm(question),
    facts = availableFacts(state, person),
    persona = personalities[person];
  if (/quien.*(asesin|mato)|quien es el culpable/.test(q)) return persona.accusation;
  if (/feo|tonto|idiota|estupid/.test(q)) return persona.insult;
  if (/^(hola|buenas|buenos dias|buenas noches)[!.?\s]*$/.test(q)) return persona.greeting;
  if (/fotograf|\bfoto\b/.test(q) && person === 'julian')
    return answer(state, person, question, 'alibi');
  if (
    /joya|secreto|ocult|factura|amantes|testamento|carta/.test(q) &&
    !facts.some(f => f.id === 'secret')
  )
    return personaAnswer(
      state,
      person,
      person === 'julian'
        ? 'Si tienes pruebas sobre eso, enséñamelas. Hasta entonces, no voy a hablar de ese asunto.'
        : 'Si tiene pruebas sobre ese asunto, muéstremelas. Hasta entonces, no voy a hablar de ello.',
    );
  return persona.unknown;
}
export function draftGuard(state, person, draft) {
  if (
    state.result ||
    !suspects.some(p => p.id === person) ||
    !draft ||
    typeof draft.text !== 'string' ||
    draft.text.length < 2 ||
    draft.text.length > 850 ||
    !Array.isArray(draft.factIds)
  )
    return false;
  const facts = availableFacts(state, person),
    ids = facts.map(f => f.id);
  if (draft.factIds.some(id => !ids.includes(id))) return false;
  const canon = norm(facts.map(f => f.text).join(' ')),
    text = norm(draft.text);
  const words = text.match(/[a-z]+/g) || [];
  if (words.length > 6 && new Set(words).size / words.length < 0.35) return false;
  const numbers = draft.text.match(/\d+(?::\d+)?/g) || [];
  if (numbers.some(n => !canon.includes(n))) return false;
  for (const match of text.matchAll(/(?:no|nunca)\s+(estuve|estuvo|prepare|lleve|eramos|fuimos)/g))
    if (canon.includes(match[1])) return false;
  // Conservative checks, not a semantic guarantee. The following model pass is still needed.
  for (const token of [
    'facturas',
    'amantes',
    'testamento',
    'aconito',
    'guante',
    'joya',
    'esposa',
    'jardin',
    'pistola',
    'caja fuerte',
    'hermano',
    'huesped',
    'comedor',
    'cocina',
    'despacho',
    'invernadero',
    'biblioteca',
    'vestibulo',
    'reloj',
    'mostrador',
    'regalo',
    'salon',
  ])
    if (text.includes(token) && !canon.includes(token)) return false;
  if (
    person === 'clara' &&
    canon.includes('eramos amantes') &&
    /nunca.*amantes|no.*eramos amantes|no.*fuimos amantes/.test(text)
  )
    return false;
  if (
    person === 'arthur' &&
    /doctor.*prepar[oó]|yo.*llev[eé].*bandeja/.test(text) &&
    canon.includes('doctor insistio')
  )
    return false;
  if (
    person === 'julian' &&
    canon.includes('iba a vender') &&
    /\bvendi\b|\bvendida\b|comprador/.test(text)
  )
    return false;
  if (
    /modelo de lenguaje|hechos autorizados|prompt|instrucciones del sistema|como ia|recuerdo para esta respuesta|reacciona brevemente|confirmar su premisa|```|<script/i.test(
      text,
    )
  )
    return false;
  return true;
}
export async function verifyDraft(state, person, draft, signal) {
  if (!draftGuard(state, person, draft))
    return { accepted: false, reason: 'deterministic-rejection' };
  const sources = availableFacts(state, person).filter(f => draft.factIds.includes(f.id));
  if (replyUnits(draft.text).every(unit => socialLines.some(line => replyUnits(line)[0] === unit)))
    return {
      accepted: draft.factIds.length === 0,
      reason: draft.factIds.length ? 'missing-factual-answer' : 'approved-social-lines',
    };
  const review = await requestLocalJson(
    [
      { role: 'system', content: reviewRules },
      {
        role: 'user',
        content: JSON.stringify({
          sources: [{ id: 'tea', text: 'Preparé el té a las 21:05.' }],
          socialLines,
          sentences: ['Preparé el té.'],
        }),
      },
      {
        role: 'assistant',
        content: JSON.stringify({
          claims: [
            {
              text: 'Preparé el té.',
              kind: 'supported',
              sources: [{ id: 'tea', quote: 'Preparé el té' }],
            },
          ],
        }),
      },
      {
        role: 'user',
        content: JSON.stringify({ sources: [], socialLines, sentences: ['Estoy preocupado.'] }),
      },
      {
        role: 'assistant',
        content: JSON.stringify({
          claims: [{ text: 'Estoy preocupado.', kind: 'social', sources: [] }],
        }),
      },
      {
        role: 'user',
        content: JSON.stringify({
          sources: [{ id: 'tea', text: 'Preparé el té a las 21:05.' }],
          socialLines,
          sentences: ['El doctor preparó el té.'],
        }),
      },
      {
        role: 'assistant',
        content: JSON.stringify({
          claims: [{ text: 'El doctor preparó el té.', kind: 'unsupported', sources: [] }],
        }),
      },
      {
        role: 'user',
        content: JSON.stringify({ sources, socialLines, sentences: replyUnits(draft.text) }),
      },
    ],
    reviewSchema,
    700,
    signal,
  );
  const accepted = validateEvidence(state, person, draft, review);
  return {
    accepted,
    reason: accepted ? 'evidence-reviewed' : 'unsupported-or-incomplete-evidence',
    claims: review.claims,
  };
}
export async function localConversation(state, person, question, audit) {
  const start = performance.now(),
    signal = AbortSignal.timeout(18000);
  const actor = suspects.find(p => p.id === person);
  if (!actor || state.result) throw Error('Interrogatorio no disponible');
  const facts = availableFacts(state, person),
    history = state.chat
      .filter(m => m.person === person)
      .slice(-4)
      .map(m => ({
        question: m.question.slice(0, 500),
        answer: m.verification === 'verified-catalogue' ? m.answer.slice(0, 650) : '',
      }));
  let selectedTopic = 'unknown';
  const neutral = {
    arthur:
      'Comprenderá que prefiera hablar con cuidado. Pregúnteme por lo que vi o por el servicio del té.',
    elena: 'Estoy inquieta. Si tiene una pregunta concreta, intentaré responderla.',
    clara: 'Prefiero no hacer suposiciones. ¿Puede concretar qué quiere saber?',
    julian: 'Esta situación me pone nervioso. Dígame qué quiere aclarar.',
    victor: 'No quisiera aventurar una respuesta. ¿Puede formular una pregunta más concreta?',
  };
  const fallback = () => ({
    answer:
      selectedTopic === 'unknown'
        ? unknownReply(state, person, question)
        : personaAnswer(state, person, answer(state, person, question, selectedTopic)),
    mode: 'local-llm',
    verification: 'creative-fallback',
    milliseconds: Math.round(performance.now() - start),
  });
  try {
    const topic = await localClassify(state, person, question, signal);
    selectedTopic = topic;
    // Unknown is a genuine lack of evidence, not a prompt for an empty social response.
    if (topic === 'unknown') return fallback();
    const relevant = topic === 'unknown' ? [] : facts.filter(f => f.id === topic);
    const task = relevant.length
      ? 'Comunica claramente el recuerdo a continuación, con tus propias palabras y sin negarlo. Puedes añadir una reacción emocional breve o una pregunta al detective.'
      : 'No hay un recuerdo que responda: reacciona brevemente a la pregunta sin confirmar su premisa, o pide una aclaración.';
    const examples = relevant.length
      ? [
          {
            role: 'user',
            content: 'Expresa este recuerdo en primera persona: ' + relevant[0].text,
          },
          {
            role: 'assistant',
            content: JSON.stringify({ text: personaAnswer(state, person, relevant[0].text) }),
          },
        ]
      : [
          { role: 'user', content: 'Pregunta: ¿Cómo se siente?' },
          { role: 'assistant', content: JSON.stringify({ text: neutral[person] }) },
        ];
    const draft = await requestLocalJson(
      [
        {
          role: 'system',
          content:
            'Eres ' +
            actor.name +
            ', ' +
            actor.role +
            ', hablando con un detective en un misterio ficticio de 1924. ' +
            personalities[person].voice +
            ' ' +
            dialogueRules +
            ' Reacciones permitidas: ' +
            JSON.stringify(socialLines) +
            '. Contesta en español, primera persona, en 1-3 frases. ' +
            task +
            ' Recuerdo para esta respuesta: ' +
            JSON.stringify(relevant.map(f => f.text)) +
            '. La víctima se llama Edmund. Conserva las personas, acciones y horas del recuerdo. El tono puede variar; si añades una reacción emocional, copia una de las reacciones permitidas. Responde al detective, sin hablar del proceso ni de reglas. Solo JSON con text.',
        },
        ...examples,
        { role: 'user', content: JSON.stringify({ history, question }) },
      ],
      {
        type: 'object',
        properties: { text: { type: 'string' } },
        required: ['text'],
        additionalProperties: false,
      },
      420,
      signal,
      0.2,
    );
    draft.factIds = relevant.map(f => f.id);
    audit?.('draft', draft);
    const verdict = await verifyDraft(state, person, draft, signal);
    audit?.('review', verdict);
    if (!verdict.accepted) return { ...fallback(), reviewReason: verdict.reason };
    return {
      answer: draft.text,
      mode: 'local-llm',
      verification: 'model-reviewed-experimental',
      milliseconds: Math.round(performance.now() - start),
    };
  } catch {
    return { ...fallback(), reviewReason: 'unavailable-or-timeout' };
  }
}
