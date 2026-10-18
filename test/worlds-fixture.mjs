// The worlds that come with the game, validated, for the tests.
import { readFileSync } from 'node:fs';
import { normalizeWorld } from '../src/world-file.mjs';
import { worlds } from '../src/prototype-worlds.mjs';
export const loadWorld = id =>
  normalizeWorld(JSON.parse(readFileSync(new URL(`../public/worlds/${id}.json`, import.meta.url))));
export const allWorlds = () => worlds.map(w => loadWorld(w.id));
