// The worlds that come with the game. Each one is a world file (see world-file.mjs), with its
// English version beside it (<id>.en.json). The labels here are the Spanish ones; each world
// file carries its own.
export const worlds = [
  { id: 'blackwood-manor', label: 'Blackwood Manor' },
  { id: 'estacion-orbital', label: 'Ciencia ficción' },
  { id: 'corte-de-ambar', label: 'Fantasía' },
  { id: 'torre-umbria', label: 'Medieval' },
  { id: 'villa-bellavista', label: 'Años 30' },
];
export function worldFile(id, lang = 'es') {
  if (!worlds.some(w => w.id === id)) throw Error('Mundo no disponible');
  return 'worlds/' + id + (lang === 'en' ? '.en' : '') + '.json';
}
export function selectWorld(id, random = Math.random) {
  return id === 'random'
    ? worlds[Math.min(worlds.length - 1, Math.floor(random() * worlds.length))].id
    : (worldFile(id), id);
}
