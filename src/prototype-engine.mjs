// Generated worlds: each investigation is a case file (see case-file.mjs) stored in the save.
import { methodCatalog } from './method-catalog.mjs';
import {
  emptyProgress,
  restoreProgress,
  unlockedFacts,
  discoverClue,
  judgeAccusation,
} from './investigation.mjs';
import {
  CASE_FORMAT,
  CASE_REVISION,
  normalizeCaseFile,
  hydrateCase,
  worldFromCase,
} from './case-file.mjs';
import { generateCaseFile } from './case-generator.mjs';
import { createLegacyCase, legacyCaseFile } from './legacy-prototype-case.mjs';
import { clock } from './random.mjs';
export { prototypeRooms, prototypeMethods } from './prototype-worlds.mjs';
export { clock, worldFromCase, CASE_FORMAT };

function selection(options) {
  return {
    seed:
      options.seed ||
      Array.from(globalThis.crypto.getRandomValues(new Uint32Array(2)), n =>
        n.toString(16).padStart(8, '0'),
      ).join(''),
    previousMethodId: options.previousMethodId || '',
    previousPersonId: options.previousPersonId || '',
    forcedMethodId: options.forcedMethodId || '',
  };
}
// The playable case of a save, or a newly generated one when there is no case file yet.
export function createPrototypeCase(data, state) {
  if (state?.case) {
    const c = hydrateCase(normalizeCaseFile(state.case));
    if (state.caseId && state.caseId !== c.id)
      throw Error('La definición del caso no coincide con el guardado');
    return c;
  }
  return hydrateCase(generateCaseFile(data, state));
}
function worldId(data) {
  return data && !data.custom ? data.setting || 'scifi' : 'custom';
}
// options.caseFile starts the investigation from an imported or edited case file.
export function newPrototype(data, options = {}) {
  const chosen = selection(options),
    file = options.caseFile ? normalizeCaseFile(options.caseFile) : generateCaseFile(data, chosen),
    c = hydrateCase(file);
  return {
    version: 2,
    worldId: options.worldId || worldId(data),
    revision: CASE_REVISION,
    ...chosen,
    caseId: c.id,
    case: file,
    openingSeen: false,
    ...emptyProgress(c.scene.id),
  };
}
// Saves before case files (version 1) rebuild their case with the legacy generator and
// become version 2; data must be the world they were created with.
export function restorePrototype(data, raw) {
  const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!s || ![1, 2].includes(s.version) || !Array.isArray(s.found) || !Array.isArray(s.chat))
    throw Error('Guardado incompatible');
  let file, legacyId;
  if (s.version === 1) {
    if (s.revision !== data?.revision) throw Error('Guardado orbital incompatible');
    const old = createLegacyCase(data, s);
    if (old.id !== s.caseId) throw Error('La definición del caso no coincide con el guardado');
    file = normalizeCaseFile(legacyCaseFile(data, old));
    legacyId = old.id;
  } else file = normalizeCaseFile(s.case);
  const c = hydrateCase(file);
  if (s.version === 2 && s.caseId !== c.id)
    throw Error('La definición del caso no coincide con el guardado');
  const knownIds = [c.id, legacyId].filter(Boolean);
  return {
    version: 2,
    worldId: typeof s.worldId === 'string' ? s.worldId.slice(0, 20) : worldId(data),
    revision: CASE_REVISION,
    ...selection({ ...s, seed: /^[a-zA-Z0-9-]{1,64}$/.test(s.seed) ? s.seed : undefined }),
    caseId: c.id,
    case: file,
    openingSeen: s.openingSeen === true,
    ...(knownIds.includes(s.opening?.caseId) &&
    ['arrival', 'tension'].every(
      k => typeof s.opening[k] === 'string' && s.opening[k].length <= 650,
    )
      ? {
          opening: {
            caseId: c.id,
            arrival: s.opening.arrival,
            tension: s.opening.tension,
            source: s.opening.source === 'local-llm' ? 'local-llm' : 'engine',
          },
        }
      : {}),
    ...(knownIds.includes(s.imageSet) ? { imageSet: s.imageSet } : {}),
    ...restoreProgress(caseView(c), s),
  };
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
const messages = {
  closed: 'La investigación está cerrada',
  closedAccusation: 'La investigación está cerrada',
  outOfReach: 'Pista fuera de esta habitación',
  incomplete: 'Completa persona, método y lugar',
  evidence: 'Adjunta al menos tres pruebas descubiertas',
};
// Case files adapted to the shared investigation rules (see investigation.mjs).
function caseView(c) {
  return {
    people: c.people,
    rooms: c.rooms,
    startRoom: c.scene.id,
    methods: methodCatalog.map(m => m.id),
    clues: c.clues,
    facts: c.facts,
    solution: { person: c.culprit.id, method: c.method.id, room: c.scene.id, proof: c.proof },
    messages,
  };
}
const delivery = {
  p1: ['Lo explicaré con calma. ', 'Escucha este detalle. '],
  p2: ['Vamos por partes. ', 'Hay un detalle importante. '],
  p3: ['Seamos precisos. ', 'Conviene distinguir los hechos. '],
  p4: ['Escucha. ', 'Te lo digo sin rodeos. '],
  p5: ['Lo diré con claridad. ', 'Sin rodeos. '],
};
export function prototypeOptions(c, state, person, topic) {
  if (voiceTopics.includes(topic)) return prototypeVoice(c, person, topic);
  const fact = prototypeFacts(c, state, person).find(f => f.id === topic);
  if (!fact) return [];
  // Case files carry several wordings; older ones fall back to the voice lead-ins.
  return fact.variants?.length ? fact.variants : delivery[person].map(lead => lead + fact.text);
}
// Rotates the wordings, so asking twice about the same thing does not repeat the answer.
export function prototypeReply(c, state, person, topic) {
  const options = prototypeOptions(c, state, person, topic),
    asked = state.chat.filter(m => m.person === person && m.topic === topic).length;
  if (options.length) return options[asked % options.length];
  const evasive = prototypeVoice(c, person, 'unknown');
  if (evasive.length)
    return evasive[state.chat.filter(m => m.person === person).length % evasive.length];
  return person === 'p4'
    ? 'No voy a inventar una respuesta. Pregúntame por mi coartada o muéstrame una prueba.'
    : 'No tengo información para afirmar eso. Puedo responder sobre mi coartada o sobre una prueba que haya encontrado.';
}
const plain = text => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Offline question routing: ordered rules, first match wins. Questions it cannot place
// return null and go to the local model when it is available.
const topicRules = [
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
export function inferPrototypeTopic(question, c = null) {
  const q = plain(question);
  const objectWords = c?.method?.object
    ? plain(c.method.object)
        .split(/\s+/)
        .filter(w => w.length >= 5)
    : [];
  for (const [topic, rule] of topicRules) {
    if (rule.test(q)) return topic;
    // The weapon of this case counts as a link question even if it is not in the list.
    if (topic === 'link' && objectWords.some(w => q.includes(w))) return 'link';
  }
  return null;
}
export function accusePrototype(c, state, { person, method, room, evidence }) {
  assertCase(c, state);
  return judgeAccusation(caseView(c), state, { person, method, room, evidence });
}
export function prototypeResolution(c, state) {
  const title = id => '“' + c.clues.find(x => x.id === id).title + '”';
  return state.result === 'won'
    ? `${c.culprit.name} causó la muerte de ${c.victim.name} mediante «${c.method.name}» en «${c.scene.name}» a las ${clock(c.timing.crimeMinute)}. ${c.motive} Lo demuestran el móvil (${title(c.proof[0][0])}), el acceso al arma (${title(c.proof[1][0])}) y la coartada desmentida (${title(c.proof[2][0])}).`
    : 'La acusación no se sostiene. Necesitas a la persona que reúne móvil, acceso al arma y una coartada desmentida, con una prueba de cada cosa. Puedes reabrir la investigación conservando tus hallazgos.';
}
