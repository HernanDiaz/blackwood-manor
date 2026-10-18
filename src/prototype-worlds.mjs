import { methodCatalog, methodRoomPairs } from './method-catalog.mjs';
export const worlds = [
  { id: 'scifi', label: 'Ciencia ficción', file: 'world.json' },
  { id: 'fantasy', label: 'Fantasía', file: 'worlds/fantasy.json' },
  { id: 'medieval', label: 'Medieval', file: 'worlds/medieval.json' },
  { id: 'noir', label: 'Años 30', file: 'worlds/noir.json' },
];
export function worldFile(id = 'scifi') {
  const w = worlds.find(w => w.id === id);
  if (!w) throw Error('Mundo no disponible');
  return w.file;
}
export function selectWorld(id, random = Math.random) {
  return id === 'random'
    ? worlds[Math.min(worlds.length - 1, Math.floor(random() * worlds.length))].id
    : (worldFile(id), id);
}
// Room tags enable methods that need a special scene (elevated, industrial...).
const defaultTags = [
  ['interior', 'life-support'],
  ['interior'],
  ['interior', 'life-support'],
  ['interior', 'industrial', 'elevated'],
  ['interior', 'cryogenic'],
  ['interior'],
];
const scifiMethods = [
  'knife',
  'blunt',
  'rope',
  'drink',
  'revolver',
  'medicine',
  'air',
  'medical',
  'power',
  'laser',
  'plasma',
  'fall',
  'robot',
  'hatch',
  'cryo',
];
export function prototypeRooms(data) {
  return data.world.rooms.map((r, i) => ({ ...r, tags: r.tags || defaultTags[i] }));
}
export function prototypeMethods(data) {
  const pairs = methodRoomPairs(data.setting || 'scifi', prototypeRooms(data));
  return methodCatalog.filter(
    m =>
      (!data.setting || data.setting === 'scifi' ? scifiMethods.includes(m.id) : true) &&
      (!data.rules ||
        [
          'knife',
          'blunt',
          'rope',
          'drink',
          ...(data.rules.technology === 'preindustrial' ? ['sword', 'crossbow'] : []),
          ...(data.rules.firearms ? ['revolver'] : []),
          ...(data.rules.technology !== 'preindustrial' ? ['medicine'] : []),
        ].includes(m.id)) &&
      pairs.some(p => p.methodId === m.id),
  );
}
