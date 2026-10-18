// Free-text worlds were removed from the game. This module only keeps what is needed to
// open saves made with them: validating the stored world and finding the world of a save.
import { normalizeCaseFile, worldFromCase } from './case-file.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { worldFile } from './prototype-worlds.mjs';
function text(v, max = 1200) {
  if (typeof v !== 'string' || !v.trim() || v.length > max || /[<>\x00-\x08]/.test(v))
    throw Error('Texto de mundo inválido');
  return v.trim();
}
export function validateCustomWorld(raw) {
  if (
    !raw ||
    !['custom-v1', 'custom-v2'].includes(raw.revision) ||
    raw.custom !== true ||
    !['scifi', 'noir', 'medieval', 'fantasy'].includes(raw.setting)
  )
    throw Error('Mundo personalizado incompatible');
  const w = raw.world;
  if (!w || w.people?.length !== 5 || w.rooms?.length !== 6 || raw.motives?.length !== 3)
    throw Error('El mundo necesita cinco personajes, seis lugares y tres móviles');
  const d = {
    custom: true,
    revision: 'custom-v1',
    setting: raw.setting,
    label: 'Tu ambientación',
    description: text(raw.description, 600),
    victim: { name: text(raw.victim?.name, 80), role: text(raw.victim?.role, 120) },
    visualStyle: text(raw.visualStyle, 300),
    motives: raw.motives.map(x => text(x, 500)),
    world: {
      title: text(w.title, 100),
      premise: text(w.premise, 600),
      people: w.people.map((p, i) => ({
        id: 'p' + (i + 1),
        name: text(p.name, 80),
        role: text(p.role, 120),
        personality: text(p.personality, 500),
        imagePrompt: text(p.imagePrompt, 500),
      })),
      rooms: w.rooms.map((r, i) => ({
        id: 'r' + (i + 1),
        name: text(r.name, 100),
        description: text(r.description, 500),
        imagePrompt: text(r.imagePrompt, 500),
        tags: ['interior'],
        ...(['el', 'la', 'los', 'las'].includes(r.article) ? { article: r.article } : {}),
      })),
    },
  };
  if (/^(adulta?|v[ií]ctima|persona|nombre|victim)(\s|$)/i.test(d.victim.name))
    throw Error('La víctima debe tener nombre propio, no una etiqueta');
  if (d.motives.some(m => m.length < 35))
    throw Error(
      'Cada móvil debe explicar un conflicto concreto y lo que la víctima iba a revelar, no una sola palabra',
    );
  const names = [
    d.victim.name,
    ...d.world.people.map(p => p.name),
    ...d.world.rooms.map(r => r.name),
  ].map(n =>
    n
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
  );
  if (new Set(names).size !== names.length)
    throw Error('Nombres de víctima, sospechosos y lugares deben ser distintos');
  if (raw.revision === 'custom-v2') {
    const rules = raw.rules;
    if (
      !rules ||
      !['preindustrial', 'industrial', 'futuristic'].includes(rules.technology) ||
      typeof rules.magic !== 'boolean' ||
      typeof rules.firearms !== 'boolean'
    )
      throw Error('Reglas de mundo inválidas');
    const setting =
      rules.technology === 'futuristic'
        ? 'scifi'
        : rules.technology === 'industrial'
          ? 'noir'
          : rules.magic
            ? 'fantasy'
            : 'medieval';
    if (setting !== raw.setting) throw Error('Tecnología incompatible con la ambientación');
    d.revision = 'custom-v2';
    d.rules = {
      technology: rules.technology,
      magic: rules.magic,
      firearms: rules.firearms && rules.technology !== 'preindustrial',
      resource: text(rules.resource, 80),
    };
  }
  return d;
}
export async function resolvePrototypeWorld(root, state) {
  if (state?.version === 2) return worldFromCase(normalizeCaseFile(state.case));
  return state?.worldId === 'custom'
    ? validateCustomWorld(state.customWorld)
    : JSON.parse(
        await readFile(path.join(root, 'public/prototype', worldFile(state?.worldId)), 'utf8'),
      );
}
