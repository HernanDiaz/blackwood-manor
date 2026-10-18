// Mechanics of each way of killing: the family (so consecutive cases differ), the minutes
// between the act and the death, and the room tags the scene needs (a fall needs height).
// Names and texts belong to each world (see world-file.mjs); this is fiction, not guidance.
const method = (id, family, { delay = 0, roomTags = [] } = {}) => ({
  id,
  family,
  delayMinutes: delay,
  roomTags,
});
export const methodCatalog = [
  method('knife', 'blade'),
  method('blunt', 'impact'),
  method('rope', 'asphyxia'),
  method('drink', 'poison', { delay: 10 }),
  method('revolver', 'ballistic'),
  method('shotgun', 'ballistic'),
  method('medicine', 'poison', { delay: 10 }),
  method('sword', 'blade'),
  method('crossbow', 'projectile'),
  method('fall', 'fall', { roomTags: ['elevated'] }),
  method('artifact', 'arcane'),
  method('alchemy', 'poison', { delay: 10 }),
  method('air', 'environment', { delay: 10, roomTags: ['life-support'] }),
  method('medical', 'poison', { delay: 10 }),
  method('power', 'energy'),
  method('laser', 'energy'),
  method('plasma', 'energy'),
  method('robot', 'impact', { roomTags: ['industrial'] }),
  method('hatch', 'mechanical', { roomTags: ['industrial'] }),
  method('cryo', 'environment', { delay: 10, roomTags: ['cryogenic'] }),
];
export const findMethod = id => methodCatalog.find(m => m.id === id);
// Whether a room can be the scene of a method.
export const fitsRoom = (methodId, room) =>
  findMethod(methodId)?.roomTags.every(tag => (room.tags || []).includes(tag)) ?? false;
