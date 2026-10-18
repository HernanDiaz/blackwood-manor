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
        }),
    c = hydrateCase(file);
  return {
    format: SAVE_FORMAT,
    version: 1,
    world: file.world,
    caseId: c.id,
    case: file,
    openingSeen: false,
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
    ...progress,
    ...restoreGuidance(c, { ...s, ...progress }),
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
    methods: c.weapons.map(w => w.method),
    clues: c.clues,
    facts: c.facts,
    solution: { person: c.culprit.id, method: c.method.id, room: c.scene.id, proof: c.proof },
    messages,
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
  const objectWords = c?.method?.weapon
    ? plain(c.method.weapon)
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
    ? `${c.culprit.name} mató a ${c.victim.name} en ${placePhrase(c.scene)} a las ${clock(c.timing.crimeMinute)}, ${c.method.phrase}. ${c.motive} Lo demuestran su móvil (${title(c.proof[0][0])}), su acceso al arma (${title(c.proof[1][0])}) y su coartada desmentida (${title(c.proof[2][0])}).`
    : 'La acusación no se sostiene. Necesitas a la persona que reúne móvil, acceso al arma y una coartada desmentida, con una prueba de cada cosa. Puedes reabrir la investigación conservando tus hallazgos.';
}
