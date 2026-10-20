// Builds, from a world file, a case file whose solution has to be deduced, not read.
//
// Five people with fixed parts in the logic (who plays each part is random):
//   culprit  motive, access, and an alibi that a clue refutes
//   i1       a motive and no witnesses, but never access to the weapon
//   i2       alibi confirmed by a register; finds the body
//   i3, i4   alibis that confirm each other under the eye of the watchman
// Only the culprit has a motive, access and an unconfirmed alibi. The difficulty decides how
// many innocents share the motive and the access, and how many misleading clues there are:
//   easy    motive: culprit, i1           access: culprit, i2           1 misleading clue
//   medium  motive: culprit, i1, i2       access: culprit, i2, i3       1 misleading clue
//   hard    motive: culprit, i1, i2, i3   access: culprit, i2, i3, i4   2 misleading clues
// The culprit's alibi falls in one of four ways: the watchman kept the door of the room they
// claim, the room was locked, the register of that room lists only someone else, or (easy only)
// the watchman saw them go into the scene. Every misleading clue has another that explains it.
// No clue names the culprit or states a conclusion.
//
// Every word that belongs to a setting comes from the world (see docs/MUNDOS.md); the
// sentences below only join them, each in several wordings.
import { findMethod, fitsRoom } from './method-catalog.mjs';
import { worldWeapons } from './world-file.mjs';
import { rng, pick, shuffle, clock } from './random.mjs';
import { CASE_FORMAT, normalizeCaseFile, analyzeCase } from './case-file.mjs';
import { statementKinds, phrasings, fillStatement } from './statements.mjs';
import { casePhrases } from './case-phrases.mjs';
import { languageOf } from './world-file.mjs';

export const difficulties = [
  { id: 'easy', label: 'Fácil' },
  { id: 'medium', label: 'Media' },
  { id: 'hard', label: 'Difícil' },
];
const capFirst = s => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

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
  {
    seed,
    previousMethodId = '',
    previousPersonId = '',
    forcedMethodId = '',
    difficulty = 'medium',
  } = {},
) {
  if (typeof seed !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(seed))
    throw Error('Semilla no válida');
  if (!difficulties.some(d => d.id === difficulty)) throw Error('Dificultad desconocida');
  // The world's language decides the sentences; the draws are the same in every language.
  const lang = languageOf(world),
    P = casePhrases[lang],
    random = rng('case:' + world.id + ':' + difficulty + ':' + seed),
    one = options => pick(options, random),
    { staff, rooms, people } = world,
    // Texts use {victim}, {p1}… and {r1}… so a renamed person or place updates every text.
    victim = '{victim}',
    named = id => '{' + id + '}',
    roomName = room => `{${room.id}}`,
    guardian = capFirst(staff.guardian),
    record = capFirst(staff.record);

  const weapon = chooseWeapon(world, random, { previousMethodId, forcedMethodId }),
    method = findMethod(weapon.method),
    scene = one(rooms.filter(r => fitsRoom(method.id, r))),
    culprit = one(people.filter(p => p.id !== previousPersonId)).id,
    [i1, i2, i3, i4] = shuffle(
      people.filter(p => p.id !== culprit).map(p => p.id),
      random,
    ),
    motiveHolders = { easy: [i1], medium: [i1, i2], hard: [i1, i2, i3] }[difficulty],
    accessHolders = { easy: [culprit, i2], medium: [culprit, i2, i3], hard: [culprit, i2, i3, i4] }[
      difficulty
    ],
    herringPeople = difficulty === 'hard' ? [i3, i4] : [one([i3, i4])],
    items = shuffle(world.items, random).slice(0, herringPeople.length),
    pattern = one(difficulty === 'easy' ? ['pair', 'empty', 'seen'] : ['pair', 'empty', 'record']),
    [pairRoom, recordRoom, aloneRoom, emptyRoom, storeRoom] = shuffle(
      rooms.filter(r => r.id !== scene.id),
      random,
    ),
    claimRoom = { pair: pairRoom, empty: emptyRoom, record: recordRoom, seen: emptyRoom }[pattern];

  const crime = 1200 + Math.floor(random() * 30) * 5,
    exit = crime + 3,
    death = crime + Math.max(1, method.delayMinutes),
    discovery = Math.max(exit, death) + 5 + Math.floor(random() * 3) * 5,
    from = crime - 20,
    to = discovery,
    recordTo = discovery - 2,
    time = clock;
  const motive = one(world.motives),
    weakDocs = shuffle(world.documents.weak, random),
    neutralDocs = shuffle(world.documents.neutral, random),
    fill = (template, person) =>
      template.replace(/\{victim\}/g, victim).replace(/\{person\}/g, named(person));

  const clues = [];
  const add = (room, title, text, fact, image) => {
    clues.push({
      id: 'c' + (clues.length + 1),
      room: room.id,
      title,
      text,
      ...(image ? { image } : {}),
      fact,
    });
    return clues.at(-1).id;
  };
  const art = world.clueArt;
  add(
    scene,
    staff.report,
    one(P.report(weapon.cause, time(death))),
    { type: 'cause', method: method.id, room: scene.id, minute: death },
    art.report.image,
  );
  add(
    scene,
    weapon.device ? one(P.deviceTitle) : one(P.weaponTitle),
    weapon.device ? one(P.device(weapon.weapon, roomName(scene))) : one(P.weapon(weapon.weapon)),
    { type: 'weapon', method: method.id, room: scene.id },
    weapon.image,
  );
  add(
    scene,
    one(P.discoveryTitle),
    one(P.discovery(named(i2), victim, roomName(scene), time(discovery))),
    { type: 'discovery', person: i2, room: scene.id, minute: discovery },
    art.testimony.image,
  );
  const herrings = herringPeople.map((person, k) => ({
    person,
    item: items[k],
    clue: add(
      scene,
      k ? P.otherHerringTitle : one(P.herringTitle),
      one(P.herring(items[k], roomName(scene), named(person))),
      { type: 'herring', person, room: scene.id },
      items[k].image,
    ),
  }));
  const accessNames = shuffle(accessHolders, random).map(named);
  const accessClue = add(
    storeRoom,
    one(P.accessTitle),
    one(P.access(staff.guardian, P.list(accessNames), weapon.access)),
    { type: 'access', method: method.id, people: accessHolders },
    art.ledger.image,
  );
  add(
    storeRoom,
    one(P.lastSeenTitle),
    weapon.device
      ? P.checked(guardian, weapon.weapon, time(crime - 40))
      : one(P.lastSeen(guardian, staff.guardian, weapon.seen || weapon.weapon, time(crime - 40))),
    { type: 'note' },
    art.testimony.image,
  );
  // The register of a room lists everyone who went in, so it also proves who was not there.
  const recordClue = add(
    recordRoom,
    one(P.recordTitle(roomName(recordRoom))),
    one(
      P.record({
        Record: record,
        record: staff.record,
        room: roomName(recordRoom),
        person: named(i2),
        from: time(from),
        to: time(recordTo),
      }),
    ),
    {
      type: 'presence',
      people: [i2],
      room: recordRoom.id,
      from,
      to: recordTo,
      exclusive: true,
    },
    art.ledger.image,
  );
  const pairClue = add(
    pairRoom,
    one(P.pairTitle(roomName(pairRoom))),
    one(
      P.pair({
        Guardian: guardian,
        guardian: staff.guardian,
        room: roomName(pairRoom),
        a: named(i3),
        b: named(i4),
        from: time(from),
        to: time(to),
      }),
    ),
    { type: 'presence', people: [i3, i4], room: pairRoom.id, from, to, exclusive: true },
    art.testimony.image,
  );
  let refuteClue = { pair: pairClue, record: recordClue }[pattern];
  if (pattern === 'empty')
    refuteClue = add(
      emptyRoom,
      one(P.lockedTitle(roomName(emptyRoom))),
      one(
        P.locked({
          Guardian: guardian,
          guardian: staff.guardian,
          room: roomName(emptyRoom),
          from: time(from),
          to: time(to),
        }),
      ),
      { type: 'presence', people: [], room: emptyRoom.id, from, to, exclusive: true },
      art.testimony.image,
    );
  if (pattern === 'seen')
    refuteClue = add(
      scene,
      one(P.witnessTitle(staff.guardian)),
      P.witness(guardian, named(culprit), roomName(scene), time(crime - 3)),
      { type: 'presence', people: [culprit], room: scene.id, from: crime - 3, to: crime },
      art.testimony.image,
    );
  const aloneClue = add(
    aloneRoom,
    one(P.aloneTitle),
    one(P.alone(named(i1), time(from), time(to))),
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
  const [motiveTitle, motiveText] = one(P.motive(victim, named(culprit), motive));
  documents[culprit] = add(
    documentRoom(),
    motiveTitle,
    motiveText,
    { type: 'motive', person: culprit },
    art.document.image,
  );
  motiveHolders.forEach((person, k) => {
    const weak = weakDocs[k % weakDocs.length];
    documents[person] = add(
      documentRoom(),
      fill(weak.title, person),
      fill(weak.text, person),
      { type: 'motive', person },
      art.document.image,
    );
  });
  people
    .map(p => p.id)
    .filter(id => !documents[id])
    .forEach((person, k) => {
      const neutral = neutralDocs[k % neutralDocs.length];
      documents[person] = add(
        documentRoom(),
        fill(neutral.title, person),
        fill(neutral.text, person),
        { type: 'note' },
        art.document.image,
      );
    });
  for (const h of herrings)
    add(
      documentRoom(),
      P.noteTitle(named(h.person)),
      P.note(named(h.person), time(600 + Math.floor(random() * 12) * 15), h.item, roomName(scene)),
      { type: 'explains', clue: h.clue },
      art.document.image,
    );

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
          [culprit]: ['pair', 'record'].includes(pattern) ? 'alibi.claim' : 'alibi.alone',
          [i1]: 'alibi.alone',
          [i2]: 'alibi.record',
          [i3]: 'alibi.pair',
          [i4]: 'alibi.pair',
        }[id],
        {
          place: roomName(alibiRoom[id]),
          from: time(from),
          to: time(id === i2 ? recordTo : to),
          partner: named(id === i3 ? i4 : i3),
        },
      ],
      ['relation', {}],
      [
        id === culprit
          ? 'secret.culprit'
          : motiveHolders.includes(id)
            ? 'secret.weak'
            : 'secret.neutral',
        {},
        documents[id],
      ],
      [accessHolders.includes(id) ? 'link.access' : 'link.none', {}, accessClue],
    ];
    if (id === culprit) list.push(['timeline.culprit', {}, refuteClue]);
    if (id === i1) list.push(['timeline.alone', {}, aloneClue]);
    if (id === i2) list.push(['timeline.record', {}, recordClue], ['seen.discovery', {}]);
    if ([i3, i4].includes(id))
      list.push(
        ['timeline.pair', {}, pairClue],
        ['seen.pair', { place: roomName(pairRoom), partner: named(id === i3 ? i4 : i3) }],
      );
    else if (id !== i2) list.push(['seen.nothing', {}]);
    const herring = herrings.find(h => h.person === id);
    if (herring) list.push(['object.own', P.own(herring.item), herring.clue]);
    list.push(['identity', {}], ['social', {}], ['unknown', {}]);
    return list;
  };
  const common = {
    victim,
    access: weapon.access,
    record: staff.record,
    guardian: staff.guardian,
    scene: roomName(scene),
    time: time(discovery),
  };
  const facts = Object.fromEntries(
    people.map(p => [
      p.id,
      statementsOf(p.id).map(([kind, values, requires]) => {
        const filled = { ...common, name: named(p.id), role: p.role, ...values };
        const variants = phrasings(kind, p.voice, random, lang).map(text =>
          fillStatement(text, filled),
        );
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
    ...(lang === 'es' ? {} : { lang }),
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
      ...(r.phrase ? { phrase: r.phrase } : {}),
      description: r.description,
      tags: r.tags,
      ...(r.ambience ? { ambience: r.ambience } : {}),
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
      arrival: one(world.openings.arrivals),
      tension: one(world.openings.tensions),
    },
    ...(world.night ? { night: world.night } : {}),
    // The arrest names the culprit and the scene of this case.
    ...(world.epilogues
      ? {
          epilogue: one(world.epilogues)
            .replace(/\{culprit\}/g, named(culprit))
            .replace(/\{scene\}/g, roomName(scene)),
        }
      : {}),
    ...(world.look ? { look: world.look } : {}),
    alibis: people.map(p => ({
      person: p.id,
      room: alibiRoom[p.id].id,
      from,
      to: p.id === i2 ? recordTo : to,
      claim: claimOf(p.id),
    })),
    clues,
    facts,
    // With what was given to the generator, the case can be made again in another language.
    origin: {
      generator: 'mundos-1',
      seed,
      difficulty,
      ...Object.fromEntries(
        Object.entries({ previousMethodId, previousPersonId, forcedMethodId }).filter(([, v]) => v),
      ),
    },
  });
  const analysis = analyzeCase(file);
  if (analysis.errors.length) throw Error('Generador incoherente: ' + analysis.errors.join(' '));
  return file;
}
