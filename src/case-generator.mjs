// Builds, from a world file, a case file whose solution has to be deduced, not read.
//
// Structure (the "medium" difficulty):
//   motive:      the culprit and two innocents have one
//   access:      the culprit and two innocents could reach the weapon (one overlaps with motive)
//   opportunity: three innocents have confirmed alibis; one innocent and the culprit do not,
//                and only the culprit's alibi is contradicted by a clue
// Only the culprit belongs to all three groups. One misleading clue points at an innocent and
// another clue explains it. No clue names the culprit or states a conclusion.
//
// Every word that belongs to a setting comes from the world (see docs/MUNDOS.md); the
// sentences below only join them.
import { findMethod, fitsRoom } from './method-catalog.mjs';
import { worldWeapons } from './world-file.mjs';
import { rng, pick, shuffle, clock } from './random.mjs';
import { CASE_FORMAT, normalizeCaseFile, analyzeCase } from './case-file.mjs';
import { statementKinds, phrasings, fillStatement } from './statements.mjs';

const capFirst = s => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);
const lowerFirst = s => s.charAt(0).toLocaleLowerCase('es') + s.slice(1);
const list = names => names.slice(0, -1).join(', ') + ' y ' + names.at(-1);

export function chooseWeapon(world, random, { previousMethodId = '', forcedMethodId = '' }) {
  let pool = worldWeapons(world);
  const family = id => findMethod(id)?.family;
  if (forcedMethodId) {
    pool = pool.filter(w => w.method === forcedMethodId);
    if (!pool.length) throw Error('Arma no disponible en este mundo');
  } else if (pool.some(w => family(w.method) !== family(previousMethodId)))
    pool = pool.filter(w => family(w.method) !== family(previousMethodId));
  return pick(pool, random);
}

export function generateCaseFile(
  world,
  { seed, previousMethodId = '', previousPersonId = '', forcedMethodId = '' } = {},
) {
  if (typeof seed !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(seed))
    throw Error('Semilla no válida');
  const random = rng('case:' + world.id + ':' + seed),
    { staff, rooms, people } = world,
    // Texts use {victim}, {p1}… and {r1}… so a renamed person or place updates every text.
    victim = '{victim}',
    named = id => '{' + id + '}',
    roomName = room => `{${room.id}}`,
    guardian = capFirst(staff.guardian);

  const weapon = chooseWeapon(world, random, { previousMethodId, forcedMethodId }),
    method = findMethod(weapon.method),
    scene = pick(
      rooms.filter(r => fitsRoom(method.id, r)),
      random,
    ),
    culprit = pick(
      people.filter(p => p.id !== previousPersonId),
      random,
    ).id,
    [i1, i2, i3, i4] = shuffle(
      people.filter(p => p.id !== culprit).map(p => p.id),
      random,
    ),
    herringPerson = pick([i3, i4], random),
    item = pick(world.items, random),
    itemArticle = item.gender === 'f' ? 'la' : 'el',
    pattern = pick(['pair', 'empty'], random),
    [pairRoom, recordRoom, aloneRoom, emptyRoom, storeRoom] = shuffle(
      rooms.filter(r => r.id !== scene.id),
      random,
    ),
    claimRoom = pattern === 'pair' ? pairRoom : emptyRoom;

  const crime = 1200 + Math.floor(random() * 30) * 5,
    exit = crime + 3,
    death = crime + Math.max(1, method.delayMinutes),
    discovery = Math.max(exit, death) + 5 + Math.floor(random() * 3) * 5,
    from = crime - 20,
    to = discovery,
    recordTo = discovery - 2,
    morning = 600 + Math.floor(random() * 12) * 15;
  const motive = pick(world.motives, random),
    [weakA, weakB] = shuffle(world.documents.weak, random),
    [neutralA, neutralB] = shuffle(world.documents.neutral, random),
    accessList = shuffle([culprit, i2, i3], random).map(named),
    fill = (template, person) =>
      template.replace(/\{victim\}/g, victim).replace(/\{person\}/g, named(person));

  const clues = [];
  const add = (room, title, text, fact, image) =>
    clues.push({
      id: 'c' + (clues.length + 1),
      room: room.id,
      title,
      text,
      ...(image ? { image } : {}),
      fact,
    });
  const art = world.clueArt;
  add(
    scene,
    staff.report,
    `${weapon.cause} Sitúa la muerte hacia las ${clock(death)}.`,
    { type: 'cause', method: method.id, room: scene.id, minute: death },
    art.report.image,
  );
  add(
    scene,
    weapon.device ? 'Manipulación en la escena' : 'Objeto del crimen',
    weapon.device
      ? `Alguien manipuló a mano ${weapon.weapon} en ${roomName(scene)}. No queda ninguna marca que diga quién.`
      : `Junto al cuerpo apareció ${weapon.weapon}. No estaba en el lugar donde se guarda habitualmente.`,
    { type: 'weapon', method: method.id, room: scene.id },
    weapon.image,
  );
  add(
    scene,
    'Aviso del hallazgo',
    `${named(i2)} encontró a ${victim} en ${roomName(scene)} a las ${clock(discovery)} y dio la alarma.`,
    { type: 'discovery', person: i2, room: scene.id, minute: discovery },
    art.testimony.image,
  );
  const herringId = 'c' + (clues.length + 1);
  add(
    scene,
    'Objeto junto a la puerta',
    `Junto a la puerta de ${roomName(scene)} apareció ${item.gender === 'f' ? 'una' : 'un'} ${item.noun} que pertenece a ${named(herringPerson)}.`,
    { type: 'herring', person: herringPerson, room: scene.id },
    item.image,
  );
  add(
    storeRoom,
    'Quién podía llegar al arma',
    pick(
      [
        `Según ${staff.guardian}, solo ${list(accessList)} tenían acceso a ${weapon.access}.`,
        `Anotación de ${staff.guardian}: solo ${list(accessList)} tenían permiso para usar ${weapon.access}.`,
      ],
      random,
    ),
    { type: 'access', method: method.id, people: [culprit, i2, i3] },
    art.ledger.image,
  );
  add(
    storeRoom,
    'Última vez en su sitio',
    weapon.device
      ? `${guardian} revisó ${weapon.weapon} a las ${clock(crime - 40)} y todo estaba en orden.`
      : `${guardian} recuerda haber visto ${weapon.seen || weapon.weapon} en su sitio a las ${clock(crime - 40)}.`,
    { type: 'note' },
    art.testimony.image,
  );
  add(
    recordRoom,
    'Registro de ' + roomName(recordRoom),
    `${capFirst(staff.record)} de ${roomName(recordRoom)} anota la entrada de ${named(i2)} a las ${clock(from)} y su salida a las ${clock(recordTo)}.`,
    { type: 'presence', people: [i2], room: recordRoom.id, from, to: recordTo },
    art.ledger.image,
  );
  add(
    pairRoom,
    'Declaración sobre ' + roomName(pairRoom),
    `${guardian} vigiló la puerta de ${roomName(pairRoom)} de ${clock(from)} a ${clock(to)}: dentro estaban ${named(i3)} y ${named(i4)}, y nadie más entró ni salió.`,
    { type: 'presence', people: [i3, i4], room: pairRoom.id, from, to, exclusive: true },
    art.testimony.image,
  );
  if (pattern === 'empty')
    add(
      emptyRoom,
      'Llave de ' + roomName(emptyRoom),
      `La puerta de ${roomName(emptyRoom)} estuvo cerrada con llave de ${clock(from)} a ${clock(to)}. ${guardian} guardaba la única llave y nadie le pidió abrir.`,
      { type: 'presence', people: [], room: emptyRoom.id, from, to, exclusive: true },
      art.testimony.image,
    );
  add(
    aloneRoom,
    'Sin testigos',
    `Nadie recuerda haber visto a ${named(i1)} entre las ${clock(from)} y las ${clock(to)}.`,
    { type: 'note' },
    art.testimony.image,
  );
  // Documents go to the rooms with fewest clues, so every room has something to search.
  const documentRoom = () => {
    const free = rooms.filter(r => r.id !== scene.id);
    const fewest = Math.min(...free.map(r => clues.filter(c => c.room === r.id).length));
    return pick(
      free.filter(r => clues.filter(c => c.room === r.id).length === fewest),
      random,
    );
  };
  const documents = {};
  documents[culprit] = clues.length + 1;
  add(
    documentRoom(),
    `Papeles de ${victim}`,
    pick(
      [
        `Entre los papeles de ${victim} hay notas sobre ${named(culprit)}: ${lowerFirst(motive)}`,
        `Carta sin enviar de ${victim}: escribe que ${named(culprit)} ${lowerFirst(motive)}`,
      ],
      random,
    ),
    { type: 'motive', person: culprit },
    art.document.image,
  );
  for (const [person, weak] of [
    [i1, weakA],
    [i2, weakB],
  ]) {
    documents[person] = clues.length + 1;
    add(
      documentRoom(),
      fill(weak.title, person),
      fill(weak.text, person),
      { type: 'motive', person },
      art.document.image,
    );
  }
  for (const [person, neutral] of [
    [i3, neutralA],
    [i4, neutralB],
  ]) {
    documents[person] = clues.length + 1;
    add(
      documentRoom(),
      fill(neutral.title, person),
      fill(neutral.text, person),
      { type: 'note' },
      art.document.image,
    );
  }
  add(
    documentRoom(),
    'Nota de ' + named(herringPerson),
    `Nota escrita por ${named(herringPerson)} a las ${clock(morning)}: pregunta si alguien ha visto ${itemArticle} ${item.noun} que perdió esta mañana en ${roomName(scene)}.`,
    { type: 'explains', clue: herringId },
    art.document.image,
  );

  const clueId = n => 'c' + n,
    accessClue = clues.find(c => c.fact.type === 'access').id,
    recordClue = clues.find(c => c.fact.type === 'presence' && c.fact.people[0] === i2).id,
    pairClue = clues.find(c => c.fact.type === 'presence' && c.fact.people.length === 2).id,
    emptyClue = clues.find(c => c.fact.type === 'presence' && !c.fact.people.length)?.id,
    aloneClue = clues.find(c => c.title === 'Sin testigos').id;
  const alibiRoom = {
    [culprit]: claimRoom,
    [i1]: aloneRoom,
    [i2]: recordRoom,
    [i3]: pairRoom,
    [i4]: pairRoom,
  };
  // What each person can say: the kind of statement, the facts it carries and when it unlocks.
  const statementsOf = id => {
    const list = [
      [
        {
          [culprit]: pattern === 'pair' ? 'alibi.claim' : 'alibi.alone',
          [i1]: 'alibi.alone',
          [i2]: 'alibi.record',
          [i3]: 'alibi.pair',
          [i4]: 'alibi.pair',
        }[id],
        {
          place: roomName(alibiRoom[id]),
          from: clock(from),
          to: clock(id === i2 ? recordTo : to),
          partner: named(id === i3 ? i4 : i3),
        },
      ],
      ['relation', {}],
      [
        id === culprit
          ? 'secret.culprit'
          : [i1, i2].includes(id)
            ? 'secret.weak'
            : 'secret.neutral',
        {},
        clueId(documents[id]),
      ],
      [[culprit, i2, i3].includes(id) ? 'link.access' : 'link.none', {}, accessClue],
    ];
    if (id === culprit)
      list.push(['timeline.culprit', {}, pattern === 'pair' ? pairClue : emptyClue]);
    if (id === i1) list.push(['timeline.alone', {}, aloneClue]);
    if (id === i2) list.push(['timeline.record', {}, recordClue], ['seen.discovery', {}]);
    if ([i3, i4].includes(id))
      list.push(
        ['timeline.pair', {}, pairClue],
        ['seen.pair', { place: roomName(pairRoom), partner: named(id === i3 ? i4 : i3) }],
      );
    else if (id !== i2) list.push(['seen.nothing', {}]);
    if (id === herringPerson) list.push(['object.own', {}, herringId]);
    list.push(['identity', {}], ['social', {}], ['unknown', {}]);
    return list;
  };
  const common = {
    victim,
    access: weapon.access,
    record: staff.record,
    guardian: staff.guardian,
    scene: roomName(scene),
    time: clock(discovery),
    item: itemArticle + ' ' + item.noun,
    mine: item.gender === 'f' ? 'mía' : 'mío',
    it: item.gender === 'f' ? 'la' : 'lo',
  };
  const facts = Object.fromEntries(
    people.map(p => [
      p.id,
      statementsOf(p.id).map(([kind, values, requires]) => {
        const filled = { ...common, name: named(p.id), role: p.role, ...values };
        const variants = phrasings(kind, p.voice, random).map(text => fillStatement(text, filled));
        return {
          id: statementKinds[kind].topic,
          kind,
          ...(requires ? { requires } : {}),
          text: variants[0],
          variants,
        };
      }),
    ]),
  );
  const claimOf = id => facts[id].find(f => f.id === 'alibi').text;

  const file = normalizeCaseFile({
    format: CASE_FORMAT,
    version: 1,
    world: world.id,
    title: world.title,
    victim: { name: world.victim.name, role: world.victim.role, gender: world.victim.gender },
    people: people.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      gender: p.gender,
      personality: p.personality,
      ...(p.image ? { image: p.image } : {}),
    })),
    rooms: rooms.map(r => ({
      id: r.id,
      name: r.name,
      article: r.article,
      description: r.description,
      tags: r.tags,
      ...(r.image ? { image: r.image } : {}),
    })),
    weapons: worldWeapons(world).map(w => ({ method: w.method, label: w.label })),
    crime: {
      culprit,
      method: method.id,
      weapon: weapon.weapon,
      phrase: weapon.phrase,
      scene: scene.id,
      crimeMinute: crime,
      exitMinute: exit,
      deathMinute: death,
      discoveryMinute: discovery,
      motive,
    },
    opening: {
      arrival: pick(world.openings.arrivals, random),
      tension: pick(world.openings.tensions, random),
    },
    alibis: people.map(p => ({
      person: p.id,
      room: alibiRoom[p.id].id,
      from,
      to: p.id === i2 ? recordTo : to,
      claim: claimOf(p.id),
    })),
    clues,
    facts,
    origin: { generator: 'mundos-1', seed },
  });
  const analysis = analyzeCase(file);
  if (analysis.errors.length) throw Error('Generador incoherente: ' + analysis.errors.join(' '));
  return file;
}
