// Case files ("expedientes"): one investigation, as plain JSON. A case file is complete on its
// own: cast, places, the weapons the accusation offers, the crime, the prologue, the clues and
// what each person can say. Generated and hand-written cases share this format, so they can be
// exported, edited and imported. Every clue carries a machine-readable fact; analyzeCase() uses
// those facts, never the prose, to prove that exactly one person can be the culprit.
// The format is described in docs/EXPEDIENTES.md.
import { findMethod, fitsRoom } from './method-catalog.mjs';
import { hash } from './random.mjs';
import { placePhrase, contract } from './spanish-prose.mjs';
import { statementKinds } from './statements.mjs';
import { text, image, optional, list as ids, personIds } from './world-file.mjs';

export const CASE_FORMAT = 'mundos-expediente';
export const topics = [
  'alibi',
  'motive',
  'secret',
  'link',
  'timeline',
  'seen',
  'object',
  'identity',
  'social',
  'unknown',
];
const fail = message => {
  throw Error(message);
};
const genders = ['f', 'm'];
function minute(value, field) {
  if (!Number.isInteger(value) || value < 0 || value > 1439) fail(`Hora no válida en ${field}`);
  return value;
}
function normalizeFact(raw, file, field) {
  const person = id => (personIds.includes(id) ? id : fail(`Persona desconocida en ${field}`));
  const room = id =>
    file.rooms.some(r => r.id === id) ? id : fail(`Lugar desconocido en ${field}`);
  const method = id => (findMethod(id) ? id : fail(`Método desconocido en ${field}`));
  switch (raw?.type) {
    case 'cause':
      return {
        type: 'cause',
        method: method(raw.method),
        room: room(raw.room),
        minute: minute(raw.minute, field),
      };
    case 'discovery':
      return {
        type: 'discovery',
        person: person(raw.person),
        room: room(raw.room),
        minute: minute(raw.minute, field),
      };
    case 'weapon':
      return { type: 'weapon', method: method(raw.method), room: room(raw.room) };
    case 'motive':
      return { type: 'motive', person: person(raw.person) };
    case 'access': {
      const people = [...new Set(ids(raw.people, field).map(person))];
      if (!people.length) fail(`Nadie tiene acceso en ${field}`);
      return { type: 'access', method: method(raw.method), people };
    }
    case 'presence': {
      const from = minute(raw.from, field),
        to = minute(raw.to, field);
      if (to <= from) fail(`Intervalo vacío en ${field}`);
      return {
        type: 'presence',
        people: [...new Set(ids(raw.people, field).map(person))],
        room: room(raw.room),
        from,
        to,
        exclusive: raw.exclusive === true,
      };
    }
    case 'herring':
      return { type: 'herring', person: person(raw.person), room: room(raw.room) };
    case 'explains':
      return { type: 'explains', clue: text(raw.clue, 8, field) };
    case 'note':
      return { type: 'note' };
    default:
      return fail(`Tipo de hecho desconocido en ${field}`);
  }
}

// Copies only known fields, so an imported file cannot smuggle anything else.
export function normalizeCaseFile(raw) {
  if (!raw || raw.format !== CASE_FORMAT || raw.version !== 1)
    fail('No es un expediente compatible');
  const people = ids(raw.people, 'personajes', { min: 5, max: 5 }).map((p, i) => ({
    id: personIds[i] === p?.id ? p.id : fail('Los personajes deben ser p1 a p5'),
    name: text(p.name, 80, 'el nombre de ' + p.id),
    role: text(p.role, 80, 'el oficio de ' + p.id),
    gender: genders.includes(p.gender) ? p.gender : fail('Género no válido en ' + p.id),
    ...optional('personality', text(p.personality, 600, 'la personalidad', { optional: true })),
    ...optional('image', image(p.image, p.id)),
  }));
  const rooms = ids(raw.rooms, 'lugares', { min: 4, max: 8 }).map(r => ({
    id: /^r\d{1,2}$/.test(r?.id) ? r.id : fail('Identificador de lugar no válido'),
    name: text(r.name, 60, 'el nombre de ' + r.id),
    article: ['el', 'la', 'los', 'las'].includes(r.article)
      ? r.article
      : fail('Artículo no válido en ' + r.id),
    description: text(r.description, 500, 'la descripción de ' + r.id),
    tags: ids(r.tags ?? [], 'etiquetas', { max: 6 }).map(t => text(t, 30, 'una etiqueta')),
    ...optional('image', image(r.image, r.id)),
  }));
  if (new Set(rooms.map(r => r.id)).size !== rooms.length) fail('Lugares repetidos');
  const file = { rooms };
  const crime = raw.crime || fail('Falta el crimen');
  const normalized = {
    format: CASE_FORMAT,
    version: 1,
    world: /^[a-z0-9-]{2,40}$/.test(raw.world) ? raw.world : fail('Mundo no válido'),
    title: text(raw.title, 120, 'el título'),
    weapons: ids(raw.weapons, 'armas', { min: 1, max: 20 }).map(w => ({
      method: findMethod(w?.method) ? w.method : fail('Arma desconocida'),
      label: text(w.label, 60, 'el nombre de un arma'),
    })),
    victim: {
      name: text(raw.victim?.name, 80, 'el nombre de la víctima'),
      role: text(raw.victim?.role, 80, 'el cargo de la víctima'),
      gender: genders.includes(raw.victim?.gender)
        ? raw.victim.gender
        : fail('Género no válido en la víctima'),
    },
    people,
    rooms,
    crime: {
      culprit: personIds.includes(crime.culprit) ? crime.culprit : fail('Culpable desconocido'),
      method: findMethod(crime.method) ? crime.method : fail('Método desconocido'),
      weapon: text(crime.weapon, 80, 'el arma'),
      phrase: text(crime.phrase, 120, 'cómo se cometió'),
      scene: rooms.some(r => r.id === crime.scene) ? crime.scene : fail('Escena desconocida'),
      crimeMinute: minute(crime.crimeMinute, 'el crimen'),
      exitMinute: minute(crime.exitMinute, 'la salida'),
      deathMinute: minute(crime.deathMinute, 'la muerte'),
      discoveryMinute: minute(crime.discoveryMinute, 'el hallazgo'),
      motive: text(crime.motive, 600, 'el móvil'),
    },
    opening: {
      arrival: text(raw.opening?.arrival, 650, 'el prólogo'),
      tension: text(raw.opening?.tension, 650, 'el cierre del prólogo'),
    },
    alibis: ids(raw.alibis, 'coartadas').map(a => ({
      person: personIds.includes(a?.person) ? a.person : fail('Coartada de persona desconocida'),
      room: rooms.some(r => r.id === a.room) ? a.room : fail('Coartada en un lugar desconocido'),
      from: minute(a.from, 'una coartada'),
      to: minute(a.to, 'una coartada'),
      claim: text(a.claim, 400, 'una coartada'),
    })),
    clues: ids(raw.clues, 'pistas').map(c => ({
      id: /^c\d{1,3}$/.test(c?.id) ? c.id : fail('Identificador de pista no válido'),
      room: rooms.some(r => r.id === c.room) ? c.room : fail('Pista en un lugar desconocido'),
      title: text(c.title, 120, 'el título de ' + c.id),
      text: text(c.text, 700, 'el texto de ' + c.id),
      ...optional('image', image(c.image, c.id)),
      fact: normalizeFact(c.fact, file, 'la pista ' + c.id),
    })),
    facts: Object.fromEntries(
      personIds.map(person => [
        person,
        ids(raw.facts?.[person], 'declaraciones').map(f => ({
          id: topics.includes(f?.id) ? f.id : fail('Tema de declaración desconocido'),
          ...optional(
            'kind',
            f.kind === undefined
              ? undefined
              : statementKinds[f.kind]?.topic === f.id
                ? f.kind
                : fail('Tipo de declaración no válido'),
          ),
          text: text(f.text, 600, 'una declaración'),
          // Alternative wordings of the same statement; the interrogation rotates them.
          ...optional(
            'variants',
            f.variants === undefined
              ? undefined
              : ids(f.variants, 'variantes')
                  .slice(0, 8)
                  .map(v => text(v, 600, 'una variante')),
          ),
          ...(f.requires === undefined
            ? {}
            : {
                requires: /^c\d{1,3}$/.test(f.requires) ? f.requires : fail('Requisito no válido'),
              }),
        })),
      ]),
    ),
    ...(raw.origin
      ? {
          origin: {
            generator: text(raw.origin.generator, 40, 'el origen'),
            ...optional('seed', text(raw.origin.seed, 64, 'la semilla', { optional: true })),
          },
        }
      : {}),
  };
  if (normalized.clues.length < 6 || normalized.clues.length > 30)
    fail('Un expediente necesita entre 6 y 30 pistas');
  if (new Set(normalized.clues.map(c => c.id)).size !== normalized.clues.length)
    fail('Pistas repetidas');
  return { id: caseFileId(normalized), ...normalized };
}
export function caseFileId(file) {
  const { id, ...content } = file;
  const body = JSON.stringify(content);
  return 'case-' + hash(body) + hash('#' + body);
}

const overlaps = (f, from, to) => f.from <= to && f.to >= from;
// Logical audit of a normalized file. Returns errors instead of throwing so an editor
// can show every problem at once.
export function analyzeCase(file) {
  const errors = [],
    { crime } = file,
    clues = file.clues,
    facts = clues.map(c => ({ ...c.fact, source: c.id })),
    of = type => facts.filter(f => f.type === type),
    name = id => file.people.find(p => p.id === id)?.name || id;
  if (
    !(crime.crimeMinute < crime.exitMinute) ||
    !(crime.crimeMinute <= crime.deathMinute) ||
    !(crime.exitMinute < crime.discoveryMinute) ||
    !(crime.deathMinute <= crime.discoveryMinute)
  )
    errors.push(
      'La cronología es imposible: el hallazgo debe llegar después del crimen y de la salida del culpable.',
    );
  if (
    !fitsRoom(
      crime.method,
      file.rooms.find(r => r.id === crime.scene),
    )
  )
    errors.push('El método no se puede usar en la escena.');
  if (!file.weapons.some(w => w.method === crime.method))
    errors.push('El arma del crimen no está entre las de la acusación.');
  for (const cause of of('cause'))
    if (cause.method !== crime.method || cause.room !== crime.scene)
      errors.push('La causa de la muerte contradice el crimen.');
  for (const weapon of of('weapon'))
    if (weapon.method !== crime.method) errors.push('El arma hallada no es la del crimen.');
  for (const access of of('access'))
    if (access.method !== crime.method) errors.push('Una pista de acceso habla de otro método.');
  const alibis = Object.fromEntries(file.alibis.map(a => [a.person, a]));
  for (const p of file.people) {
    const a = alibis[p.id];
    if (!a) errors.push(`${p.name} no tiene coartada.`);
    else if (a.from > crime.crimeMinute || a.to < crime.exitMinute)
      errors.push(`La coartada de ${p.name} no cubre la hora del crimen.`);
    else if (a.room === crime.scene) errors.push(`La coartada de ${p.name} está en la escena.`);
    if (!file.facts[p.id].some(f => f.id === 'alibi'))
      errors.push(`${p.name} no puede declarar su coartada.`);
    if (new Set(file.facts[p.id].map(f => f.id)).size !== file.facts[p.id].length)
      errors.push(`${p.name} tiene declaraciones repetidas.`);
    for (const f of file.facts[p.id])
      if (f.requires && !clues.some(c => c.id === f.requires))
        errors.push(`Una declaración de ${p.name} depende de una pista que no existe.`);
  }
  // Opportunity: an alibi is confirmed by a presence fact in the claimed room covering the
  // crime, and refuted by an exclusive presence that omits the person or by a presence
  // elsewhere during the crime.
  const confirmedBy = {},
    refutedBy = {};
  for (const p of file.people) {
    const a = alibis[p.id];
    if (!a) continue;
    confirmedBy[p.id] = of('presence')
      .filter(
        f =>
          f.people.includes(p.id) &&
          f.room === a.room &&
          f.from <= crime.crimeMinute &&
          f.to >= crime.exitMinute,
      )
      .map(f => f.source);
    refutedBy[p.id] = of('presence')
      .filter(
        f =>
          overlaps(f, crime.crimeMinute, crime.exitMinute) &&
          ((f.exclusive && f.room === a.room && !f.people.includes(p.id)) ||
            (f.people.includes(p.id) && f.room !== a.room)),
      )
      .map(f => f.source);
    if (confirmedBy[p.id].length && refutedBy[p.id].length)
      errors.push(`Las pistas confirman y desmienten a la vez la coartada de ${p.name}.`);
    if (p.id !== crime.culprit && refutedBy[p.id].length)
      errors.push(`Una pista desmiente la coartada de ${p.name}, que es inocente.`);
  }
  const motive = [...new Set(of('motive').map(f => f.person))],
    access = [...new Set(of('access').flatMap(f => f.people))],
    opportunity = file.people.map(p => p.id).filter(id => !confirmedBy[id]?.length),
    suspects = file.people
      .map(p => p.id)
      .filter(id => motive.includes(id) && access.includes(id) && opportunity.includes(id));
  if (!refutedBy[crime.culprit]?.length)
    errors.push(`Ninguna pista desmiente la coartada de ${name(crime.culprit)}.`);
  if (suspects.length !== 1 || suspects[0] !== crime.culprit)
    errors.push(
      suspects.length > 1
        ? 'La solución es ambigua: ' +
            suspects.map(name).join(', ') +
            ' cumplen las tres condiciones.'
        : 'Las pistas no permiten deducir al culpable.',
    );
  for (const herring of of('herring'))
    if (!of('explains').some(f => f.clue === herring.source))
      errors.push('Hay una pista engañosa sin explicación.');
  for (const explains of of('explains'))
    if (!of('herring').some(f => f.source === explains.clue))
      errors.push('Una explicación se refiere a una pista que no es engañosa.');
  const proof = [
    of('motive')
      .filter(f => f.person === crime.culprit)
      .map(f => f.source),
    of('access')
      .filter(f => f.people.includes(crime.culprit))
      .map(f => f.source),
    refutedBy[crime.culprit] || [],
  ];
  return {
    errors: [...new Set(errors)],
    motive,
    access,
    opportunity,
    suspects,
    proof,
    // Per person, the clues that confirm or refute their alibi.
    confirmedBy,
    refutedBy,
    herrings: of('herring').length,
  };
}

export function validateCaseFile(raw) {
  const file = normalizeCaseFile(raw),
    analysis = analyzeCase(file);
  if (analysis.errors.length) fail('Expediente incoherente: ' + analysis.errors.join(' '));
  return file;
}

// Replaces {victim}, {p1}… with names and {r1}… with the place and its article.
export function resolveText(text, file) {
  const value = contract(
    text
      .replace(/\{victim\}/g, file.victim.name)
      .replace(/\{(p\d)\}/g, (token, id) => file.people.find(p => p.id === id)?.name || token)
      .replace(/\{(r\d{1,2})\}/g, (token, id) => {
        const room = file.rooms.find(r => r.id === id);
        return room ? placePhrase(room) : token;
      }),
  );
  return value.charAt(0).toLocaleUpperCase('es') + value.slice(1);
}
// The playable case: the file plus resolved objects and the proof the accusation needs.
export function hydrateCase(file) {
  const { crime } = file,
    analysis = analyzeCase(file);
  if (analysis.errors.length) fail('Expediente incoherente: ' + analysis.errors.join(' '));
  return {
    id: file.id,
    world: file.world,
    ...optional('seed', file.origin?.seed),
    title: file.title,
    people: file.people,
    rooms: file.rooms,
    victim: file.victim,
    weapons: file.weapons,
    method: {
      ...file.weapons.find(w => w.method === crime.method),
      id: crime.method,
      weapon: crime.weapon,
      phrase: crime.phrase,
    },
    opening: file.opening,
    scene: file.rooms.find(r => r.id === crime.scene),
    culprit: file.people.find(p => p.id === crime.culprit),
    motive: resolveText(crime.motive, file),
    timing: {
      crimeMinute: crime.crimeMinute,
      exitMinute: crime.exitMinute,
      deathMinute: crime.deathMinute,
      discoveryMinute: crime.discoveryMinute,
    },
    alibis: file.alibis.map(a => ({ ...a, claim: resolveText(a.claim, file) })),
    clues: file.clues.map(c => ({
      ...c,
      title: resolveText(c.title, file),
      text: resolveText(c.text, file),
    })),
    facts: Object.fromEntries(
      Object.entries(file.facts).map(([person, facts]) => [
        person,
        facts.map(f => ({
          ...f,
          text: resolveText(f.text, file),
          ...(f.variants ? { variants: f.variants.map(v => resolveText(v, file)) } : {}),
        })),
      ]),
    ),
    proof: analysis.proof,
    analysis,
    file,
  };
}
