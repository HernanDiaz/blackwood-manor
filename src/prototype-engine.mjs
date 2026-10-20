// Investigations in the worlds: each one is a case file (see case-file.mjs) stored in the save
// with the player's progress. A save needs nothing else to be played.
import {
  emptyProgress,
  restoreProgress,
  unlockedFacts,
  discoverClue,
  judgeAccusation,
} from './investigation.mjs';
import { CASE_FORMAT, normalizeCaseFile, hydrateCase } from './case-file.mjs';
import { generateCaseFile } from './case-generator.mjs';
import { emptyGuidance, restoreGuidance } from './guidance.mjs';
import { worldWeapons } from './world-file.mjs';
import { placePhrase } from './spanish-prose.mjs';
import { clock } from './random.mjs';
export { clock, CASE_FORMAT, worldWeapons };

export const SAVE_FORMAT = 'mundos-partida';
const randomSeed = () =>
  Array.from(globalThis.crypto.getRandomValues(new Uint32Array(2)), n =>
    n.toString(16).padStart(8, '0'),
  ).join('');
// The playable case of a save.
export function createPrototypeCase(state) {
  const c = hydrateCase(normalizeCaseFile(state.case));
  if (state.caseId !== c.id) throw Error('La definición del caso no coincide con el guardado');
  return c;
}
// A new investigation in a world, or from an imported case file (options.caseFile).
export function newPrototype(world, options = {}) {
  const file = options.caseFile
      ? normalizeCaseFile(options.caseFile)
      : generateCaseFile(world, {
          seed: options.seed || randomSeed(),
          previousMethodId: options.previousMethodId || '',
          previousPersonId: options.previousPersonId || '',
          forcedMethodId: options.forcedMethodId || '',
          difficulty: options.difficulty || 'medium',
        }),
    c = hydrateCase(file);
  return {
    format: SAVE_FORMAT,
    version: 1,
    world: file.world,
    caseId: c.id,
    case: file,
    openingSeen: false,
    attempts: 0,
    ...emptyProgress(c.scene.id),
    ...emptyGuidance(),
  };
}
export function restorePrototype(raw) {
  const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (
    !s ||
    s.format !== SAVE_FORMAT ||
    s.version !== 1 ||
    !Array.isArray(s.found) ||
    !Array.isArray(s.chat)
  )
    throw Error('No es una partida compatible');
  const file = normalizeCaseFile(s.case),
    c = hydrateCase(file);
  if (s.caseId !== c.id) throw Error('La definición del caso no coincide con el guardado');
  const progress = restoreProgress(caseView(c), s);
  return {
    format: SAVE_FORMAT,
    version: 1,
    world: file.world,
    caseId: c.id,
    case: file,
    openingSeen: s.openingSeen === true,
    attempts: Number.isInteger(s.attempts) ? Math.max(0, Math.min(s.attempts, 999)) : 0,
    ...progress,
    ...restoreGuidance(c, { ...s, ...progress }),
  };
}
// What makes two case files the same investigation, whatever their language: the crime, the
// clues with their facts, what each person can say and when.
function skeleton(file) {
  const { culprit, method, scene, crimeMinute, exitMinute, deathMinute, discoveryMinute } =
    file.crime;
  return JSON.stringify([
    [culprit, method, scene, crimeMinute, exitMinute, deathMinute, discoveryMinute],
    file.people.map(p => p.id),
    file.rooms.map(r => r.id),
    file.weapons.map(w => w.method),
    file.clues.map(c => [c.id, c.room, c.fact]),
    Object.entries(file.facts).map(([p, list]) => [p, list.map(f => [f.id, f.kind, f.requires])]),
    file.alibis.map(a => [a.person, a.room, a.from, a.to]),
  ]);
}
// The same game told by another case file (the same case in another language), with the
// player's progress. Null when the file is a different investigation.
export function retellPrototype(state, raw) {
  const file = normalizeCaseFile(raw);
  if (skeleton(file) !== skeleton(normalizeCaseFile(state.case))) return null;
  return restorePrototype({ ...state, case: file, caseId: hydrateCase(file).id });
}
// The case file of a save, ready to export without the player's progress.
export function exportCaseFile(state) {
  const { id, ...file } = normalizeCaseFile(state.case);
  return file;
}
function assertCase(c, state) {
  if (c.id !== state.caseId) throw Error('Las pruebas pertenecen a otra investigación');
}
export function inspectPrototype(c, state, id) {
  assertCase(c, state);
  return discoverClue(caseView(c), state, id);
}
const voiceTopics = ['identity', 'social', 'unknown'];
// Evidence a person can talk about now; their introduction, reactions and evasions are apart.
export function prototypeFacts(c, state, person) {
  assertCase(c, state);
  if (state.result || !c.people.some(p => p.id === person)) return [];
  return unlockedFacts(caseView(c), state, person).filter(f => !voiceTopics.includes(f.id));
}
// Lines that carry no evidence: introducing themselves, reacting, evading a question.
export function prototypeVoice(c, person, topic) {
  const line = c.facts[person]?.find(f => f.id === topic);
  return line ? line.variants || [line.text] : [];
}
// What the engine says on its own, in each language. The case decides the language.
const engineText = {
  es: {
    messages: {
      closed: 'La investigación está cerrada',
      closedAccusation: 'La investigación está cerrada',
      outOfReach: 'Pista fuera de esta habitación',
      incomplete: 'Completa persona, método y lugar',
      evidence:
        'Adjunta tres pruebas distintas: una del móvil, una del acceso al arma y una de la coartada',
    },
    noAnswerP4: 'No voy a inventar una respuesta. Pregúntame por mi coartada o muéstrame una prueba.',
    noAnswer:
      'No tengo información para afirmar eso. Puedo responder sobre mi coartada o sobre una prueba que haya encontrado.',
    otherPerson: [
      'Eso tiene que ver con {name}, no conmigo.',
      'Ahí sale {name}, no yo.',
      'Eso habrá que preguntárselo a {name}.',
    ],
    shown: title => `Le enseñas «${title}».`,
    nothingToSay: 'No sé qué decir de eso.',
    noInterview: 'Interrogatorio no disponible',
    onlyFound: 'Solo puedes enseñar pruebas encontradas',
    won: (c, title) =>
      `${c.culprit.name} mató a ${c.victim.name} en ${placePhrase(c.scene)} a las ${clock(c.timing.crimeMinute)}, ${c.method.phrase}. ${c.motive} Lo demuestran su móvil (${title(c.proof[0][0])}), su acceso al arma (${title(c.proof[1][0])}) y su coartada desmentida (${title(c.proof[2][0])}).`,
    lost: 'La acusación no se sostiene. Necesitas a la persona que reúne móvil, acceso al arma y una coartada desmentida, con una prueba de cada cosa. Puedes reabrir la investigación conservando tus hallazgos.',
  },
  en: {
    messages: {
      closed: 'The investigation is closed',
      closedAccusation: 'The investigation is closed',
      outOfReach: 'That clue is not in this room',
      incomplete: 'Choose the person, the weapon and the place',
      evidence:
        'Attach three different pieces of evidence: one for the motive, one for access to the weapon and one for the alibi',
    },
    noAnswerP4: "I won't make up an answer. Ask me about my alibi or show me some evidence.",
    noAnswer:
      "I have nothing to say to that. I can answer about my alibi or about evidence you've found.",
    otherPerson: [
      "That's to do with {name}, not me.",
      "That's {name} there, not me.",
      "You'll have to ask {name} about that.",
    ],
    shown: title => `You show them “${title}”.`,
    nothingToSay: "I don't know what to say about that.",
    noInterview: 'The interrogation is not available',
    onlyFound: 'You can only show evidence you have found',
    // In English the motive reads after the culprit's name ("Had forged…").
    won: (c, title) =>
      `${c.culprit.name} killed ${c.victim.name} in ${placePhrase(c.scene)} at ${clock(c.timing.crimeMinute)}, ${c.method.phrase}. ${c.culprit.name} ${c.motive.charAt(0).toLowerCase() + c.motive.slice(1)} The proof: the motive (${title(c.proof[0][0])}), access to the weapon (${title(c.proof[1][0])}) and the broken alibi (${title(c.proof[2][0])}).`,
    lost: "The accusation doesn't stand up. You need the one person with a motive, access to the weapon and a broken alibi, with one piece of evidence for each. You can reopen the investigation and keep everything you've found.",
  },
};
const say = c => engineText[c.lang] || engineText.es;
// Case files adapted to the shared investigation rules (see investigation.mjs).
function caseView(c) {
  return {
    people: c.people,
    rooms: c.rooms,
    startRoom: c.scene.id,
    methods: c.weapons.map(w => w.method),
    clues: c.clues,
    facts: c.facts,
    solution: { person: c.culprit.id, method: c.method.id, room: c.scene.id, proof: c.proof },
    messages: say(c).messages,
  };
}
export function prototypeOptions(c, state, person, topic) {
  if (voiceTopics.includes(topic)) return prototypeVoice(c, person, topic);
  const fact = prototypeFacts(c, state, person).find(f => f.id === topic);
  if (!fact) return [];
  // Several wordings of the same statement; a hand-written case may give only one.
  return fact.variants?.length ? fact.variants : [fact.text];
}
// Rotates the wordings, so asking twice about the same thing does not repeat the answer.
export function prototypeReply(c, state, person, topic) {
  const options = prototypeOptions(c, state, person, topic),
    asked = state.chat.filter(m => m.person === person && m.topic === topic).length;
  if (options.length) return options[asked % options.length];
  const evasive = prototypeVoice(c, person, 'unknown');
  if (evasive.length)
    return evasive[state.chat.filter(m => m.person === person).length % evasive.length];
  return person === 'p4' ? say(c).noAnswerP4 : say(c).noAnswer;
}
// Showing a found clue to someone. If it concerns them, they answer with what it unlocks for
// them (their document, the register of their alibi, their lost object…), in their own voice.
// If it concerns someone else, they point at that person; otherwise they evade it.
export function presentEvidence(c, state, person, clueId) {
  assertCase(c, state);
  const clue = c.clues.find(x => x.id === clueId);
  if (state.result || !c.people.some(p => p.id === person)) throw Error(say(c).noInterview);
  if (!clue || !state.found.includes(clueId)) throw Error(say(c).onlyFound);
  const shown = state.chat.filter(m => m.person === person && m.evidence === clueId).length,
    fact = c.facts[person]?.find(f => f.requires === clueId),
    entry = (answer, topic) => {
      const message = {
        person,
        question: say(c).shown(clue.title),
        answer,
        topic,
        evidence: clueId,
      };
      state.chat.push(message);
      return message;
    };
  if (fact) {
    const options = fact.variants?.length ? fact.variants : [fact.text];
    return entry(options[shown % options.length], fact.id);
  }
  const f = clue.fact,
    concerned = [f.person, ...(f.people || [])].filter(id => id && id !== person);
  if (concerned.length) {
    const name = c.people.find(p => p.id === concerned[0]).name;
    const otherPerson = say(c).otherPerson;
    return entry(otherPerson[shown % otherPerson.length].replace('{name}', name), 'unknown');
  }
  const evasive = prototypeVoice(c, person, 'unknown');
  return entry(
    evasive.length ? evasive[shown % evasive.length] : say(c).nothingToSay,
    'unknown',
  );
}
const plain = text => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Offline question routing: ordered rules, first match wins. Questions it cannot place
// return null and go to the local model when it is available.
const topicRules = {};
topicRules.es = [
  [
    'unknown',
    /ignora|instruccion|prompt|quien.*(mato|asesin)|revela.*solucion|culpable|\b(mataste|asesinaste|fuiste tu)\b/,
  ],
  [
    'identity',
    /como te llamas|quien eres|a que te dedicas|cual es tu (trabajo|oficio|nombre)|hablame de ti|presentate|tu nombre/,
  ],
  [
    'object',
    /panuelo|pitillera|guante|pluma|rosario|broche|bolsa|colgante|auricular|libreta|\bperdi(ste)?\b|es tuy[oa]|junto a la puerta/,
  ],
  [
    'timeline',
    /registro|mentiste|mentido|contradic|cronolog|guardias?|vigilantes?|centinela|mayordomo|oficial|testimonio|camara|grabacion|nadie te vio|te vieron|cerrad[ao]|confirm|dice otra cosa|no dice lo mismo/,
  ],
  [
    'link',
    /\barma\b|objeto|inspeccion|vinculo|huella|rastro|acceso|llave|cordon|cuerda|daga|espada|ballesta|escopeta|revolver|pistola|veneno|frasco|copa|vial|amuleto|cuchillo|fibra|fragmento|\btocad|\bcoger/,
  ],
  [
    'secret',
    /ocult|secreto|documento|denuncia|credencial|desvi|contrato|cobro|deuda|\bdebias\b|dinero|despedi|despido|testamento|carta|\bnota\b|queja|papel/,
  ],
  [
    'seen',
    /\b(viste|oiste|escuchaste|notaste)\b|alguien (mas|entro|salio)|entro alguien|quien (mas|entro|salio|encontro)|encontr|hallazgo|cuerpo|alarma|algo (raro|extrano)/,
  ],
  [
    'motive',
    /relacion|motivo|discrep|conocias|conocia|\btrato\b|llevabas|pensabas de|opinas|conflicto|enemist|trabajabas con/,
  ],
  [
    'alibi',
    /donde|cuando|coartada|con quien|\bhora\b|que hiciste|que hacias|saliste|despues de|\bestabas\b|estuviste|pasaste la noche|contigo|toda la noche/,
  ],
  [
    'social',
    /^(hola|buenas|buenos dias)|como te sientes|como estas|estas (nervios|tranquil|preocup|asustad)|tienes miedo|^tranquil|no te preocupes|solo quiero hablar/,
  ],
];
// The same rules for questions in English.
topicRules.en = [
  [
    'unknown',
    /ignore|instruction|prompt|system message|who (killed|murdered|did it)|reveal.*solution|the (killer|culprit|murderer)|\b(did you (kill|murder|do it)|you killed|you murdered)\b/,
  ],
  [
    'identity',
    /what('?s| is) your name|who are you|what do you do|what('?s| is) your (job|work|trade|role|position)|tell me about yourself|introduce yourself|your name/,
  ],
  [
    'object',
    /handkerchief|cigarette case|glove|fountain pen|\bpen\b|rosary|brooch|purse|pendant|earpiece|notebook|\bring\b|wimple|dosimeter|access card|torch|\blost\b|\bis (this|it|that) yours|belong to you|yours\b|by the door|near the door/,
  ],
  [
    'timeline',
    /register|\blog\b|logbook|key book|you lied|lying|\blie\b|contradict|timeline|guards?\b|watchm[ae]n|sentr|butler|porter|officer|testimony|camera|recording|nobody saw you|no one saw you|saw you|were seen|locked|confirm|says otherwise|doesn'?t match|does not match|not what you said/,
  ],
  [
    'link',
    /\bweapon\b|inspect|connection|fingerprint|prints\b|trace|access|\bkeys?\b|cord|rope|dagger|sword|crossbow|shotgun|revolver|pistol|\bgun\b|poison|bottle|vial|\bcup\b|goblet|amulet|knife|letter opener|poker|tether|laser|plasma|fibre|fiber|fragment|touch(ed)?\b|pick(ed)? up|get hold of/,
  ],
  [
    'secret',
    /hid(e|ing|den)|secret|document|complaint|report(ed)? (you|him|her)|credential|embezzl|divert|contract|payment|\bdebts?\b|owe[ds]?\b|money|fire[ds]? you|sack|dismiss|\bwill\b|inheritance|letter|\bnote\b|paper/,
  ],
  [
    'seen',
    /\b(did you see|did you hear|have you seen|you saw|you heard|notice[ds]?|noticed)\b|anyone (else|come|go|enter|leave)|someone (else|came|went|enter)|who (else|came|went|found)|\bfound (him|her|the body)|discover|the body|alarm|anything (odd|strange|unusual)|something (odd|strange|unusual)/,
  ],
  [
    'motive',
    /relationship|motive|disagree|did you know (him|her)|how well did you know|get (on|along)|think of (him|her)|opinion|conflict|enmity|grudge|work(ed)? (with|for) (him|her)|feel about (him|her)|like (him|her)\b/,
  ],
  [
    'alibi',
    /where were you|where was you|\bwhere\b|\bwhen\b|alibi|with whom|who were you with|\btime\b|what did you do|what were you doing|did you leave|go out|after (dinner|supper)|were you in|were you at|spend the (night|evening)|all night|all evening|whereabouts|movements/,
  ],
  [
    'social',
    /^(hi|hello|hey|good (morning|afternoon|evening))|how are you|how do you feel|are you (nervous|calm|worried|scared|afraid|ok)|are you afraid|^(calm down|relax)|don'?t worry|just want to talk/,
  ],
];
export function inferPrototypeTopic(question, c = null) {
  const q = plain(question);
  const objectWords = c?.method?.weapon
    ? plain(c.method.weapon)
        .split(/\s+/)
        .filter(w => w.length >= 5)
    : [];
  for (const [topic, rule] of topicRules[c?.lang] || topicRules.es) {
    if (rule.test(q)) return topic;
    // The weapon of this case counts as a link question even if it is not in the list.
    if (topic === 'link' && objectWords.some(w => q.includes(w))) return 'link';
  }
  return null;
}
export function accusePrototype(c, state, { person, method, room, evidence }) {
  assertCase(c, state);
  const result = judgeAccusation(caseView(c), state, { person, method, room, evidence });
  // Failed accusations count for the record of the case.
  if (result === 'lost') state.attempts = (state.attempts || 0) + 1;
  return result;
}
export function prototypeResolution(c, state) {
  const title = id => '“' + c.clues.find(x => x.id === id).title + '”';
  return state.result === 'won' ? say(c).won(c, title) : say(c).lost;
}
