// World files ("mundos"): everything that belongs to a setting and not to a single case.
// The cast, the places, who keeps watch, the weapons and how each one is described, the
// objects that can mislead, the motives, the documents, the prologues and the art.
// The case generator (case-generator.mjs) has no text of its own: it combines these.
// The format is described in docs/MUNDOS.md.
import { findMethod, fitsRoom } from './method-catalog.mjs';
import { statementKinds, phrasingIssue } from './statements.mjs';

export const WORLD_FORMAT = 'mundos-mundo';
export const personIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
const articles = ['el', 'la', 'los', 'las'];
const genders = ['f', 'm'];

const fail = message => {
  throw Error(message);
};
export function text(value, max, field, { optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === '')) return undefined;
  if (typeof value !== 'string' || !value.trim()) fail(`Falta el texto de ${field}`);
  if (value.length > max) fail(`${field} supera ${max} caracteres`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(value))
    fail(`${field} contiene caracteres no válidos`);
  return value.trim();
}
export function image(value, field) {
  if (value === undefined || value === '') return undefined;
  if (
    typeof value !== 'string' ||
    value.length > 200 ||
    value.includes('..') ||
    !/^\/worlds\/[A-Za-z0-9_\-/.]+\.webp$/.test(value)
  )
    fail(`Imagen no permitida en ${field}`);
  return value;
}
export const optional = (key, value) => (value === undefined ? {} : { [key]: value });
export const list = (value, field, { min = 0, max = 50 } = {}) => {
  if (!Array.isArray(value)) fail(`${field} debe ser una lista`);
  if (value.length < min || value.length > max)
    fail(`${field} necesita entre ${min} y ${max} elementos`);
  return value;
};
const choice = (value, options, field) => (options.includes(value) ? value : fail(field));
// Image path and the prompt that produced (or will produce) it.
const art = (raw, field) => ({
  ...optional('image', image(raw?.image, field)),
  ...optional(
    'imagePrompt',
    text(raw?.imagePrompt, 600, 'la ilustración de ' + field, { optional: true }),
  ),
});
// Placeholders a world text may use, filled by the generator.
function template(value, max, field, allowed) {
  const t = text(value, max, field);
  for (const [, key] of t.matchAll(/\{(\w+)\}/g))
    if (!allowed.includes(key)) fail(`${field} usa un marcador desconocido: {${key}}`);
  if (/\d/.test(t.replace(/\{\w+\}/g, ''))) fail(`${field} no debe llevar horas ni cifras`);
  return t;
}
function voice(raw, field) {
  if (raw === undefined) return undefined;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`${field} no es válida`);
  return Object.fromEntries(
    Object.entries(raw).map(([kind, lines]) => {
      if (!statementKinds[kind]) fail(`${field}: tipo de declaración desconocido «${kind}»`);
      return [
        kind,
        list(lines, field + ' · ' + kind, { min: 1, max: 6 }).map(line => {
          const issue = phrasingIssue(kind, line);
          if (issue) fail(`${field} · ${kind}: ${issue} («${line}»)`);
          return line.trim();
        }),
      ];
    }),
  );
}

export function normalizeWorld(raw) {
  if (!raw || raw.format !== WORLD_FORMAT || raw.version !== 1) fail('No es un mundo compatible');
  const id = /^[a-z0-9-]{2,40}$/.test(raw.id) ? raw.id : fail('Identificador de mundo no válido');
  const people = list(raw.people, 'los personajes', { min: 5, max: 5 }).map((p, i) => ({
    id: p?.id === personIds[i] ? p.id : fail('Los personajes deben ser p1 a p5'),
    name: text(p.name, 80, 'el nombre de ' + p.id),
    role: text(p.role, 80, 'el oficio de ' + p.id),
    gender: choice(p.gender, genders, 'Género no válido en ' + p.id),
    ...optional('age', Number.isInteger(p.age) && p.age > 0 && p.age < 120 ? p.age : undefined),
    personality: text(p.personality, 600, 'la personalidad de ' + p.id),
    appearance: text(p.appearance, 600, 'el aspecto de ' + p.id),
    ...art(p, p.id),
    ...optional('voice', voice(p.voice, 'la voz de ' + p.id)),
  }));
  const rooms = list(raw.rooms, 'los lugares', { min: 6, max: 8 }).map(r => ({
    id: /^r\d$/.test(r?.id) ? r.id : fail('Identificador de lugar no válido'),
    name: text(r.name, 60, 'el nombre de ' + r.id),
    article: choice(r.article, articles, 'Artículo no válido en ' + r.id),
    description: text(r.description, 500, 'la descripción de ' + r.id),
    // Atmosphere shown the first time the player enters the room.
    ...optional(
      'ambience',
      r.ambience === undefined
        ? undefined
        : list(r.ambience, 'la atmósfera de ' + r.id, { min: 1, max: 3 }).map((t, i) =>
            template(t, 220, `la atmósfera ${i + 1} de ${r.id}`, []),
          ),
    ),
    tags: list(r.tags ?? [], 'las etiquetas de ' + r.id, { max: 6 }).map(t =>
      text(t, 30, 'una etiqueta'),
    ),
    ...art(r, r.id),
  }));
  if (new Set(rooms.map(r => r.id)).size !== rooms.length) fail('Lugares repetidos');
  const weapons = list(raw.weapons, 'las armas', { min: 3, max: 20 }).map(w => {
    const field = 'el arma ' + w?.method;
    if (!findMethod(w?.method)) fail(`Método desconocido: ${w?.method}`);
    if (!rooms.some(r => fitsRoom(w.method, r))) fail(`Ningún lugar permite ${field}`);
    return {
      method: w.method,
      label: text(w.label, 60, 'el nombre de ' + field),
      cause: template(w.cause, 300, 'la causa de ' + field, []),
      weapon: text(w.weapon, 80, 'el objeto de ' + field),
      access: text(w.access, 80, 'el acceso de ' + field),
      ...optional('seen', text(w.seen, 80, 'lo que se vio de ' + field, { optional: true })),
      device: w.device === true,
      phrase: text(w.phrase, 120, 'cómo se usó ' + field),
      ...art(w, field),
    };
  });
  if (new Set(weapons.map(w => w.method)).size !== weapons.length) fail('Armas repetidas');
  const documents = raw.documents || fail('Faltan los documentos');
  const doc = (d, field) => ({
    title: template(d?.title, 80, 'el título de ' + field, ['victim', 'person']),
    text: template(d?.text, 400, 'el texto de ' + field, ['victim', 'person']),
  });
  return {
    format: WORLD_FORMAT,
    version: 1,
    id,
    label: text(raw.label, 40, 'la etiqueta'),
    title: text(raw.title, 100, 'el título'),
    premise: text(raw.premise, 500, 'la premisa'),
    art: { style: text(raw.art?.style, 400, 'el estilo de las ilustraciones') },
    victim: {
      name: text(raw.victim?.name, 80, 'el nombre de la víctima'),
      role: text(raw.victim?.role, 80, 'el cargo de la víctima'),
      gender: choice(raw.victim?.gender, genders, 'Género no válido en la víctima'),
      description: text(raw.victim?.description, 600, 'la descripción de la víctima'),
    },
    people,
    rooms,
    staff: {
      guardian: text(raw.staff?.guardian, 60, 'quien vigila'),
      record: text(raw.staff?.record, 60, 'el registro'),
      report: text(raw.staff?.report, 60, 'el informe médico'),
    },
    weapons,
    items: list(raw.items, 'los objetos perdidos', { min: 2, max: 12 }).map((it, i) => ({
      noun: text(it?.noun, 60, 'el objeto ' + (i + 1)),
      gender: choice(it.gender, genders, 'Género no válido en un objeto'),
      ...art(it, 'el objeto ' + (i + 1)),
    })),
    motives: list(raw.motives, 'los móviles', { min: 3, max: 20 }).map((m, i) =>
      template(m, 400, 'el móvil ' + (i + 1), ['victim']),
    ),
    documents: {
      weak: list(documents.weak, 'los documentos de móvil débil', { min: 2, max: 12 }).map((d, i) =>
        doc(d, 'móvil débil ' + (i + 1)),
      ),
      neutral: list(documents.neutral, 'los documentos neutros', { min: 2, max: 12 }).map((d, i) =>
        doc(d, 'documento neutro ' + (i + 1)),
      ),
    },
    clueArt: Object.fromEntries(
      ['report', 'testimony', 'ledger', 'document'].map(k => [k, art(raw.clueArt?.[k], k)]),
    ),
    openings: {
      arrivals: list(raw.openings?.arrivals, 'los prólogos', { min: 1, max: 12 }).map((t, i) =>
        template(t, 650, 'el prólogo ' + (i + 1), []),
      ),
      tensions: list(raw.openings?.tensions, 'los cierres del prólogo', { min: 1, max: 12 }).map(
        (t, i) => template(t, 650, 'el cierre del prólogo ' + (i + 1), []),
      ),
    },
    // How the night goes on while the player investigates; the game puts the time.
    ...optional(
      'night',
      raw.night === undefined
        ? undefined
        : list(raw.night, 'la noche', { min: 3, max: 8 }).map((t, i) =>
            template(t, 180, 'el paso de la noche ' + (i + 1), []),
          ),
    ),
    // The arrest, told after the case is solved.
    ...optional(
      'epilogues',
      raw.epilogues === undefined
        ? undefined
        : list(raw.epilogues, 'los epílogos', { min: 1, max: 6 }).map((t, i) =>
            template(t, 700, 'el epílogo ' + (i + 1), ['culprit', 'victim', 'scene']),
          ),
    ),
    // Colours and the background effect of the world.
    ...optional('look', normalizeLook(raw.look)),
  };
}
const colour = (value, field) =>
  /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fail('Color no válido en ' + field);
export const effects = ['rain', 'snow', 'stars', 'dust', 'storm'];
export const lookColours = ['bg', 'panel', 'line', 'accent', 'text', 'muted'];
export function normalizeLook(raw) {
  if (raw === undefined) return undefined;
  return {
    ...Object.fromEntries(lookColours.map(k => [k, colour(raw[k], 'el color ' + k)])),
    effect: effects.includes(raw.effect) ? raw.effect : fail('Efecto de fondo desconocido'),
  };
}
export const weaponOf = (world, methodId) => world.weapons.find(w => w.method === methodId);
// Weapons that have a room where they can be used.
export const worldWeapons = world =>
  world.weapons.filter(w => world.rooms.some(r => fitsRoom(w.method, r)));
