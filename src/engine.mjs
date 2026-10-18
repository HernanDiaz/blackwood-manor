import { cases, caseById, selectCase, LEGACY_CASE_ID } from './cases.mjs';
import { VISUAL_SET } from './visuals.mjs';
import {
  emptyProgress,
  restoreProgress,
  unlockedFacts,
  discoverClue,
  judgeAccusation,
} from './investigation.mjs';
export const rooms = [
  {
    id: 'study',
    name: 'Despacho',
    icon: '✒',
    description: 'Sir Edmund yace junto a la mesa. La lluvia golpea las ventanas cerradas.',
  },
  {
    id: 'library',
    name: 'Biblioteca',
    icon: '▤',
    description: 'Libros de medicina, cuentas y una carta que nunca llegó a enviarse.',
  },
  {
    id: 'dining',
    name: 'Comedor',
    icon: '♜',
    description: 'La cena terminó a las 21:00. Cinco copas siguen sobre el mantel.',
  },
  {
    id: 'kitchen',
    name: 'Cocina',
    icon: '♨',
    description: 'El servicio se retiró temprano. Todavía huele a té negro.',
  },
  {
    id: 'greenhouse',
    name: 'Invernadero',
    icon: '❧',
    description: 'Entre los cristales empañados crecen plantas de belleza peligrosa.',
  },
  {
    id: 'hall',
    name: 'Vestíbulo',
    icon: '◷',
    description: 'El reloj de la entrada marcó las 21:30 cuando se oyó el grito.',
  },
];
export const suspects = [
  { id: 'elena', name: 'Elena Blackwood', role: 'La heredera', initials: 'EB', color: '#bfa16b' },
  { id: 'victor', name: 'Dr. Víctor Hale', role: 'El médico', initials: 'VH', color: '#91ada7' },
  { id: 'clara', name: 'Clara Reed', role: 'La secretaria', initials: 'CR', color: '#b69bb5' },
  { id: 'arthur', name: 'Arthur Finch', role: 'El mayordomo', initials: 'AF', color: '#9ba9bc' },
  { id: 'julian', name: 'Julián Blackwood', role: 'El sobrino', initials: 'JB', color: '#bd947f' },
];
// Legacy exports remain for import compatibility; active play uses caseClues(state).
export const clues = caseById(LEGACY_CASE_ID).clues;
export function currentCase(state) {
  return caseById(state.caseId || LEGACY_CASE_ID);
}
export function caseClues(state) {
  return currentCase(state).clues;
}
export function caseInfo(state) {
  const c = currentCase(state);
  return { id: c.id, title: c.title, brief: c.brief, startRoom: c.startRoom, total: cases.length };
}
export function caseRooms(state) {
  return rooms.map(r => ({
    ...r,
    description:
      state.caseId && state.caseId !== LEGACY_CASE_ID
        ? r.id === currentCase(state).startRoom
          ? currentCase(state).brief +
            ' El informe y los objetos de la estancia pueden aclarar lo ocurrido.'
          : 'Registra esta habitación y contrasta sus documentos con los testimonios.'
        : r.description,
  }));
}
export const topics = {
  alibi: 'Dónde estabas a las 21:15',
  motive: 'Tu relación con Edmund',
  tea: 'Quién llevó el té',
  secret: 'Qué estás ocultando',
  poison: 'El frasco con tu nombre',
  glove: 'Tu guante en el invernadero',
  evidence: 'Tu vínculo con la bebida',
  timeline: 'El registro contradice tu coartada',
};
export function availableFacts(state, person) {
  return unlockedFacts(caseView(state), state, person);
}
export function newGame({ caseId, previousCaseId } = {}) {
  const c = caseById(caseId || selectCase(previousCaseId));
  return {
    version: 1,
    caseId: c.id,
    caseRevision: c.revision,
    visualSet: VISUAL_SET,
    dialogueMode: 'precise',
    ...emptyProgress(c.startRoom),
  };
}
export function restore(raw) {
  const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!s || s.version !== 1 || !Array.isArray(s.found) || !Array.isArray(s.chat))
    throw Error('Guardado incompatible');
  if (s.visualSet && s.visualSet !== VISUAL_SET) throw Error('Conjunto visual no disponible');
  const c = caseById(s.caseId === undefined ? LEGACY_CASE_ID : s.caseId);
  if (s.caseRevision !== undefined && s.caseRevision !== c.revision)
    throw Error('Versión del caso incompatible');
  return {
    ...newGame({ caseId: c.id }),
    dialogueMode: s.dialogueMode === 'creative' ? 'creative' : 'precise',
    ...restoreProgress(caseView({ caseId: c.id }), s),
  };
}
export function discover(state, id) {
  return discoverClue(caseView(state), state, id);
}
export function inferTopic(question) {
  const q = question
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (/registro|contradic|mentiste|mentido/.test(q)) return 'timeline';
  if (/vinculo|huella/.test(q)) return 'evidence';
  if (/guante|invernadero/.test(q)) return 'glove';
  if (/veneno|aconito|frasco/.test(q)) return 'poison';
  if (
    /ocult|secret|carta|testamento|factura|cuentas|contrato|garantia|despido|jubilac|desvio/.test(q)
  )
    return 'secret';
  if (/te\b|bandeja|taza|vino/.test(q)) return 'tea';
  if (/relacion|dinero|motivo|deuda|edmund/.test(q)) return 'motive';
  return 'alibi';
}
export function answer(state, person, question, selected) {
  if (state.result) throw Error('El caso está cerrado');
  if (!suspects.some(p => p.id === person)) throw Error('Sospechoso desconocido');
  const allowed = availableFacts(state, person);
  const topic = selected || inferTopic(question);
  return (
    allowed.find(f => f.id === topic)?.text ||
    'No voy a hablar de eso. Si tiene pruebas, enséñemelas. Puede preguntarme por mi coartada o mi relación con Edmund.'
  );
}
export const weapons = [
  { id: 'aconite', name: 'Acónito en el té' },
  { id: 'knife', name: 'Abrecartas' },
  { id: 'wine', name: 'Veneno en el vino' },
];
export function accuse(state, { person, weapon, room, evidence }) {
  return judgeAccusation(caseView(state), state, { person, method: weapon, room, evidence });
}
export function resolution(state) {
  return state.result === 'won'
    ? 'Caso resuelto. ' + currentCase(state).ending
    : 'La acusación no se sostiene. Necesitas identificar culpable, método y habitación, y aportar pruebas del móvil, vínculo con la bebida envenenada y oportunidad. Reabre el caso para seguir investigando.';
}
// Authored cases adapted to the shared investigation rules (see investigation.mjs).
const messages = {
  closed: 'El caso está cerrado',
  closedAccusation: 'El caso ya está cerrado',
  outOfReach: 'Pista fuera de alcance',
  incomplete: 'Completa la acusación',
  evidence: 'Selecciona al menos tres pistas descubiertas',
};
function caseView(state) {
  const c = currentCase(state);
  return {
    people: suspects,
    rooms,
    startRoom: c.startRoom,
    methods: weapons.map(w => w.id),
    clues: c.clues,
    facts: Object.fromEntries(
      Object.entries(c.facts).map(([person, facts]) => [
        person,
        facts.map(([id, text, requires]) => ({ id, text, requires })),
      ]),
    ),
    solution: {
      person: c.solution.person,
      method: c.solution.weapon,
      room: c.solution.room,
      proof: c.solution.groups,
    },
    messages,
  };
}
