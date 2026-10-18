// Shared investigation rules for every case, authored (Blackwood) or generated (prototype worlds).
//
// Each engine adapts its own case data to a view with this shape:
//   people, rooms:  [{ id, ... }]
//   startRoom:      room id used when a save points to an unknown room
//   methods:        method/weapon ids accepted in an accusation
//   clues:          [{ id, room, ... }]
//   facts:          { [personId]: [{ id, text, requires? }] }, requires = clue id that unlocks it
//   solution:       { person, method, room, proof: [[clueId, ...], ...] }, one clue per group
//   messages:       { closed, closedAccusation, outOfReach, incomplete, evidence }
// The state holds only the player's progress: room, found, pinned, notes, chat and result.

export function emptyProgress(room) {
  return { room, found: [], pinned: [], notes: '', chat: [], result: null };
}

export function restoreProgress(view, saved) {
  const found = [...new Set(saved.found.filter(id => view.clues.some(c => c.id === id)))];
  return {
    room: view.rooms.some(r => r.id === saved.room) ? saved.room : view.startRoom,
    found,
    pinned: Array.isArray(saved.pinned)
      ? [...new Set(saved.pinned.filter(id => found.includes(id)))]
      : [],
    notes: typeof saved.notes === 'string' ? saved.notes.slice(0, 10000) : '',
    chat: saved.chat
      .filter(
        m =>
          view.people.some(p => p.id === m.person) &&
          typeof m.question === 'string' &&
          typeof m.answer === 'string',
      )
      .slice(-200),
    result: ['won', 'lost'].includes(saved.result) ? saved.result : null,
  };
}

export function unlockedFacts(view, state, person) {
  return (view.facts[person] || [])
    .filter(f => !f.requires || state.found.includes(f.requires))
    .map(({ id, text, variants }) => (variants ? { id, text, variants } : { id, text }));
}

export function discoverClue(view, state, id) {
  if (state.result) throw Error(view.messages.closed);
  const clue = view.clues.find(c => c.id === id && c.room === state.room);
  if (!clue) throw Error(view.messages.outOfReach);
  if (!state.found.includes(id)) state.found.push(id);
  return clue;
}

export function judgeAccusation(view, state, { person, method, room, evidence }) {
  if (state.result) throw Error(view.messages.closedAccusation);
  if (
    !view.people.some(p => p.id === person) ||
    !view.methods.includes(method) ||
    !view.rooms.some(r => r.id === room)
  )
    throw Error(view.messages.incomplete);
  if (
    !Array.isArray(evidence) ||
    new Set(evidence).size < 3 ||
    evidence.some(id => !state.found.includes(id))
  )
    throw Error(view.messages.evidence);
  const { solution } = view;
  const correct =
    person === solution.person && method === solution.method && room === solution.room;
  const proven = solution.proof.every(group => group.some(id => evidence.includes(id)));
  state.result = correct && proven ? 'won' : 'lost';
  return state.result;
}
