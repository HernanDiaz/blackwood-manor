import { cases, caseById, selectCase, LEGACY_CASE_ID } from './cases.mjs';
import { VISUAL_SET } from './visuals.mjs';
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
  return (currentCase(state).facts[person] || [])
    .filter(f => !f[2] || state.found.includes(f[2]))
    .map(([id, text]) => ({ id, text }));
}
export function newGame({ caseId, previousCaseId } = {}) {
  const c = caseById(caseId || selectCase(previousCaseId));
  return {
    version: 1,
    caseId: c.id,
    caseRevision: c.revision,
    visualSet: VISUAL_SET,
    dialogueMode: 'precise',
    room: c.startRoom,
    found: [],
    pinned: [],
    notes: '',
    chat: [],
    result: null,
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
  const base = newGame({ caseId: c.id });
  base.dialogueMode = s.dialogueMode === 'creative' ? 'creative' : 'precise';
  base.room = rooms.some(r => r.id === s.room) ? s.room : c.startRoom;
  base.found = [...new Set(s.found.filter(id => caseClues(base).some(c => c.id === id)))];
  base.pinned = Array.isArray(s.pinned) ? s.pinned.filter(id => base.found.includes(id)) : [];
  base.notes = typeof s.notes === 'string' ? s.notes.slice(0, 10000) : '';
  base.chat = s.chat
    .filter(
      m =>
        suspects.some(p => p.id === m.person) &&
        typeof m.question === 'string' &&
        typeof m.answer === 'string',
    )
    .slice(-200);
  base.result = ['won', 'lost'].includes(s.result) ? s.result : null;
  return base;
}
export function discover(state, id) {
  if (state.result) throw Error('El caso está cerrado');
  const c = caseClues(state).find(c => c.id === id && c.room === state.room);
  if (!c) throw Error('Pista fuera de alcance');
  if (!state.found.includes(id)) state.found.push(id);
  return c;
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
  if (state.result) throw Error('El caso ya está cerrado');
  if (
    !suspects.some(p => p.id === person) ||
    !weapons.some(w => w.id === weapon) ||
    !rooms.some(r => r.id === room)
  )
    throw Error('Completa la acusación');
  if (
    !Array.isArray(evidence) ||
    new Set(evidence).size < 3 ||
    evidence.some(id => !state.found.includes(id))
  )
    throw Error('Selecciona al menos tres pistas descubiertas');
  const solution = currentCase(state).solution;
  const valid = person === solution.person && weapon === solution.weapon && room === solution.room;
  const supported = solution.groups.every(group => group.some(id => evidence.includes(id)));
  state.result = valid && supported ? 'won' : 'lost';
  return state.result;
}
export function resolution(state) {
  return state.result === 'won'
    ? 'Caso resuelto. ' + currentCase(state).ending
    : 'La acusación no se sostiene. Necesitas identificar culpable, método y habitación, y aportar pruebas del móvil, vínculo con la bebida envenenada y oportunidad. Reabre el caso para seguir investigando.';
}
