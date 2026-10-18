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
