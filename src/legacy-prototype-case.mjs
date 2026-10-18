// The first prototype generator, kept only to open saves made before case files existed.
// New investigations use case-generator.mjs; this code must not change, or old saves
// would no longer rebuild the case they were played with.
import { contextualClue, auditPrototype } from './contextual-evidence.mjs';
import { methodRoomPairs, methodTiming, methodEvidence } from './method-catalog.mjs';
import { prototypeRooms, prototypeMethods } from './prototype-worlds.mjs';
import { hash, rng, pick, clock } from './random.mjs';
import { CASE_FORMAT } from './case-file.mjs';

const motives = [
  'Había falsificado sus credenciales profesionales. La dirección iba a denunciarlo al consejo al día siguiente.',
  'Había desviado suministros de la estación. La dirección había reunido pruebas y las entregaría al consejo al día siguiente.',
  'Había ocultado cobros irregulares en contratos. La dirección iba a entregar las cuentas a una auditoría al día siguiente.',
  'Había vendido información reservada de la estación. La dirección había descubierto la operación y presentaría las pruebas al día siguiente.',
];
export const legacyRevisions = [
  'orbital-v1',
  'noir-v1',
  'medieval-v1',
  'fantasy-v1',
  'custom-v1',
  'custom-v2',
];
export function createLegacyCase(
  data,
  { seed, previousMethodId = '', previousPersonId = '', forcedMethodId = '' } = {},
) {
  if (
    !legacyRevisions.includes(data.revision) ||
    typeof seed !== 'string' ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(seed)
  )
    throw Error('Semilla o mundo incompatible');
  const random = rng(seed),
    people = data.world.people,
    rooms = prototypeRooms(data);
  let pool = prototypeMethods(data),
    previous = pool.find(m => m.id === previousMethodId);
  if (forcedMethodId) {
    pool = pool.filter(m => m.id === forcedMethodId);
    if (!pool.length) throw Error('Método no disponible en esta ambientación');
  } else if (previous && pool.some(m => m.family !== previous.family))
    pool = pool.filter(m => m.family !== previous.family);
  const method = pick(pool, random),
    pairs = methodRoomPairs(data.setting || 'scifi', rooms).filter(p => p.methodId === method.id),
    pair = pick(pairs, random),
    scene = rooms.find(r => r.id === pair.roomId);
  const culprit = pick(
      people.filter(p => p.id !== previousPersonId),
      random,
    ),
    safe = rooms.filter(r => r.id !== scene.id),
    innocent = people.filter(p => p.id !== culprit.id),
    motive = pick(data.motives || motives, random);
  const timing = methodTiming(method, 1200 + Math.floor(random() * 30) * 5),
    from = clock(timing.windowStart),
    to = clock(timing.windowEnd),
    at = clock(timing.crimeMinute);
  const alibis = people.map(person => {
    const i = innocent.findIndex(p => p.id === person.id),
      partner = i < 0 ? null : innocent[i % 2 === 0 ? i + 1 : i - 1],
      room = i < 0 ? safe[2] : safe[Math.floor(i / 2)];
    return {
      person: person.id,
      room: room.id,
      witness: partner?.id || null,
      claim:
        i < 0
          ? `Estuve a solas en «${room.name}» de ${from} a ${to}. No entré en «${scene.name}» durante ese intervalo.`
          : `Estuve con ${partner.name} en «${room.name}» de ${from} a ${to}.`,
    };
  });
  const clues = [];
  for (const [g, category] of ['motive', 'link', 'opportunity'].entries())
    for (const [i, p] of people.entries()) {
      const guilty = p.id === culprit.id,
        alibi = alibis.find(a => a.person === p.id),
        partner = people.find(x => x.id === alibi.witness),
        room = rooms.find(r => r.id === alibi.room),
        id = 'c' + (g * 5 + i + 1);
      let text, title;
      if (g === 0) {
        title = 'Documento de ' + p.name;
        text = guilty
          ? `Documento recibido y firmado por ${p.name}: ${motive}`
          : `Solicitud firmada por ${p.name} para revisar sus turnos de trabajo. Refleja un desacuerdo laboral, no una amenaza ni una prueba del crimen.`;
      }
      if (g === 1) {
        title = 'Inspección de ' + p.name;
        text = guilty
          ? methodEvidence(method, p.name, at)
          : `La inspección no encontró un vínculo material entre ${p.name} y el objeto del crimen. Las pruebas independientes descartan su intervención durante el intervalo investigado.`;
      }
      if (g === 2) {
        title = 'Registro de ' + p.name;
        text = guilty
          ? `El registro independiente identifica a ${p.name} entrando en «${scene.name}» a las ${at} y saliendo a las ${clock(timing.crimeMinute + 2)}. Contradice su afirmación de haber permanecido en «${safe[2].name}».`
          : `El registro continuo confirma que ${p.name} y ${partner.name} permanecieron en «${room.name}» de ${from} a ${to}. Ninguno pudo entrar en «${scene.name}» durante el crimen.`;
      }
      const contextual =
        data.revision === 'custom-v2'
          ? contextualClue({
              data,
              g,
              p,
              guilty,
              motive,
              method,
              at,
              from,
              to,
              scene,
              safe,
              room,
              partner,
              timing,
              clock,
            })
          : null;
      if (contextual) {
        text = contextual.text;
        title = contextual.title;
      }
      clues.push({
        ...(contextual ? { imagePrompt: contextual.imagePrompt } : {}),
        id,
        person: p.id,
        category,
        effect: g === 0 || guilty ? 'supports' : 'excludes',
        room: rooms[(g * 5 + i) % rooms.length].id,
        title,
        text,
        image:
          g === 1 && guilty
            ? (data.setting &&
              ['shotgun', 'sword', 'crossbow', 'artifact', 'alchemy'].includes(method.id)
                ? '/prototype/world-assets-v1/'
                : '/prototype/assets/') +
              'method-' +
              method.id +
              '.webp'
            : data.setting
              ? '/assets/blackwood-complete-v1/clue-letter.webp'
              : '/lab/assets/clue-' + id + '.webp',
      });
    }
  const signature = hash(
    JSON.stringify({
      revision: data.revision,
      seed,
      method,
      scene: scene.id,
      culprit: culprit.id,
      timing,
      motive,
      alibis,
      clues,
      world: data.world,
    }),
  );
  const result = {
    ...(data.revision === 'custom-v2' ? { context: data.rules } : {}),
    id: 'orbital-' + signature,
    revision: data.revision,
    seed,
    people,
    rooms,
    method,
    scene,
    culprit,
    motive,
    timing,
    alibis,
    clues,
    victim: data.victim,
  };
  if (data.revision === 'custom-v2') auditPrototype(result);
  return result;
}
function legacyFacts(c, person) {
  const alibi = c.alibis.find(a => a.person === person),
    guilty = person === c.culprit.id,
    clueOf = category => c.clues.find(x => x.person === person && x.category === category).id;
  return [
    { id: 'alibi', text: alibi.claim },
    {
      id: 'motive',
      text: c.context
        ? 'Mi relación con la víctima era profesional. Había diferencias sobre el reparto de ' +
          c.context.resource +
          '.'
        : 'Mi relación con la dirección era profesional. Había discrepancias sobre las condiciones de trabajo.',
    },
    {
      id: 'secret',
      requires: clueOf('motive'),
      text: guilty
        ? c.motive
        : c.context
          ? 'Pedí revisar el reparto de ' +
            c.context.resource +
            '. Mi petición no contiene una amenaza.'
          : 'Pedí revisar mis turnos. Ese documento no contiene una amenaza.',
    },
    {
      id: 'link',
      requires: clueOf('link'),
      text: guilty
        ? `La inspección me vincula con el objeto «${c.method.object}». No puedo negar ese vínculo material.`
        : 'La inspección descarta que yo interviniera en el crimen.',
    },
    {
      id: 'timeline',
      requires: clueOf('opportunity'),
      text: guilty
        ? `${c.context ? 'La prueba de acceso sitúa' : 'El registro sitúa'} mi entrada en «${c.scene.name}» a las ${clock(c.timing.crimeMinute)}. Mi primera coartada era falsa.`
        : alibi.claim +
          (c.context ? ' La prueba de acceso lo confirma.' : ' El registro continuo lo confirma.'),
    },
  ];
}
// Expresses a legacy case as a case file so it plays on the current engine.
export function legacyCaseFile(data, c) {
  const crime = c.timing.crimeMinute,
    exit = crime + 2,
    culprit = c.culprit.id;
  const fact = clue => {
    const guilty = clue.person === culprit,
      alibi = c.alibis.find(a => a.person === clue.person);
    if (clue.category === 'motive')
      return guilty ? { type: 'motive', person: culprit } : { type: 'note' };
    if (clue.category === 'link')
      return guilty ? { type: 'access', method: c.method.id, people: [culprit] } : { type: 'note' };
    return guilty
      ? { type: 'presence', people: [culprit], room: c.scene.id, from: crime, to: exit }
      : {
          type: 'presence',
          people: [clue.person, alibi.witness],
          room: alibi.room,
          from: c.timing.windowStart,
          to: c.timing.windowEnd,
        };
  };
  return {
    format: CASE_FORMAT,
    version: 1,
    title: data.world.title,
    setting: data.setting || 'scifi',
    ...(data.label ? { label: data.label } : {}),
    ...(data.description ? { description: data.description } : {}),
    ...(data.visualStyle ? { visualStyle: data.visualStyle } : {}),
    ...(data.rules ? { rules: data.rules } : {}),
    victim: data.victim,
    people: c.people,
    rooms: c.rooms,
    crime: {
      culprit,
      method: c.method.id,
      scene: c.scene.id,
      crimeMinute: crime,
      exitMinute: exit,
      deathMinute: c.timing.deathMinute,
      discoveryMinute: Math.max(c.timing.deathMinute, exit + 1),
      motive: c.motive,
    },
    alibis: c.alibis.map(a => ({
      person: a.person,
      room: a.room,
      from: c.timing.windowStart,
      to: c.timing.windowEnd,
      claim: a.claim,
    })),
    clues: c.clues.map(({ id, room, title, text, image, imagePrompt, ...clue }) => ({
      id,
      room,
      title,
      text,
      ...(image ? { image } : {}),
      ...(imagePrompt ? { imagePrompt } : {}),
      fact: fact(clue),
    })),
    facts: Object.fromEntries(c.people.map(p => [p.id, legacyFacts(c, p.id)])),
    origin: { generator: 'legacy', seed: c.seed, legacyId: c.id, revision: c.revision },
  };
}
