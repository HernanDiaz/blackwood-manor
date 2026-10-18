// Builds a case file whose solution has to be deduced, not read.
//
// Structure (the "medium" difficulty):
//   motive:      the culprit and two innocents have one
//   access:      the culprit and two innocents could reach the weapon (one overlaps with motive)
//   opportunity: three innocents have confirmed alibis; one innocent and the culprit do not,
//                and only the culprit's alibi is contradicted by a clue
// Only the culprit belongs to all three groups. One misleading clue points at an innocent and
// another clue explains it. No clue names the culprit or states a conclusion.
import { methodRoomPairs } from './method-catalog.mjs';
import { prototypeRooms, prototypeMethods } from './prototype-worlds.mjs';
import { rng, pick, shuffle, clock } from './random.mjs';
import { CASE_FORMAT, normalizeCaseFile, analyzeCase } from './case-file.mjs';

const capFirst = s => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);
const lowerFirst = s => s.charAt(0).toLocaleLowerCase('es') + s.slice(1);
const list = names => names.slice(0, -1).join(', ') + ' y ' + names.at(-1);

const medievalProfile = {
  guardian: 'el guardia de turno',
  record: 'el registro de entradas',
  report: 'Examen del sanador',
  items: [
    { noun: 'rosario de cuentas de madera', fem: false, prompt: 'a wooden bead rosary' },
    { noun: 'guante de cuero', fem: false, prompt: 'a single leather glove' },
    { noun: 'broche de bronce', fem: false, prompt: 'a bronze brooch' },
    { noun: 'bolsa de monedas bordada', fem: true, prompt: 'an embroidered coin pouch' },
  ],
  documentPrompt: 'a parchment letter with a wax seal on a wooden desk',
  ledgerPrompt: 'an open handwritten ledger on a medieval desk',
  testimonyPrompt: 'a handwritten testimony on parchment, quill and candle',
  reportPrompt: 'a healer examination notes beside herbs on a wooden table',
};
const profiles = {
  noir: {
    guardian: 'el mayordomo',
    record: 'el libro de visitas',
    report: 'Informe del médico forense',
    items: [
      { noun: 'pañuelo bordado', fem: false, prompt: 'an embroidered handkerchief' },
      { noun: 'pitillera de plata', fem: true, prompt: 'a silver cigarette case' },
      { noun: 'guante de piel', fem: false, prompt: 'a single leather glove' },
      { noun: 'pluma estilográfica', fem: true, prompt: 'a fountain pen' },
    ],
    documentPrompt: 'a typed letter on a 1930s wooden desk',
    ledgerPrompt: 'an open guest book on a 1930s reception desk',
    testimonyPrompt: 'a handwritten statement on a 1930s desk with a lamp',
    reportPrompt: 'a 1930s medical examiner report on a desk',
  },
  medieval: medievalProfile,
  fantasy: { ...medievalProfile, guardian: 'el centinela' },
  scifi: {
    guardian: 'el oficial de guardia',
    record: 'el registro de accesos',
    report: 'Informe médico de la estación',
    items: [
      { noun: 'guante térmico', fem: false, prompt: 'a single thermal glove' },
      { noun: 'colgante de metal', fem: false, prompt: 'a small metal pendant' },
      { noun: 'auricular de comunicación', fem: false, prompt: 'a small communication earpiece' },
      { noun: 'libreta de papel', fem: true, prompt: 'a small paper notebook' },
    ],
    documentPrompt: 'a digital message on a tablet on a station desk',
    ledgerPrompt: 'an access log on a control room monitor',
    testimonyPrompt: 'a recorded statement on a station terminal',
    reportPrompt: 'a medical scan report on a station monitor',
  },
};
// Per method: cause of death, what was found at the scene, what the suspects could reach
// beforehand and what was seen in place before the crime.
const objects = {
  knife: {
    cause: 'El cuerpo presenta una herida de arma blanca.',
    weapon: 'la daga',
    access: 'la daga',
  },
  blunt: {
    cause: 'El cuerpo presenta un golpe fuerte en la cabeza, dado con un objeto pesado.',
    weapon: 'el pisapapeles metálico',
    access: 'el pisapapeles metálico',
  },
  rope: {
    cause: 'Las marcas del cuello indican una estrangulación con un cordón.',
    weapon: 'el cordón trenzado',
    access: 'el cordón trenzado',
  },
  drink: {
    cause: 'Los síntomas indican un veneno tomado en una bebida pocos minutos antes.',
    weapon: 'la copa con restos de veneno',
    access: 'el frasco de veneno',
  },
  revolver: {
    cause: 'La muerte se debió a un disparo de revólver hecho desde muy cerca.',
    weapon: 'el revólver',
    access: 'el revólver',
  },
  shotgun: {
    cause: 'La muerte se debió a un disparo de escopeta hecho desde muy cerca.',
    weapon: 'la escopeta de caza',
    access: 'la escopeta de caza',
  },
  medicine: {
    cause: 'Los síntomas indican un preparado medicinal alterado, tomado pocos minutos antes.',
    weapon: 'el frasco del preparado',
    access: 'el armario de los preparados',
    seen: 'el frasco del preparado',
  },
  sword: {
    cause: 'El cuerpo presenta una herida de espada.',
    weapon: 'la espada',
    access: 'la espada',
  },
  crossbow: {
    cause: 'Un virote de ballesta causó la muerte.',
    weapon: 'la ballesta',
    access: 'la ballesta',
  },
  fall: {
    cause:
      'La víctima cayó desde la galería elevada. Hay señales de forcejeo junto a la barandilla.',
    weapon: 'la puerta de la galería',
    access: 'la llave de la galería',
    device: true,
  },
  artifact: {
    cause: 'Una descarga arcana dejó marcas en el cuerpo.',
    weapon: 'el amuleto rúnico',
    access: 'el amuleto rúnico',
  },
  alchemy: {
    cause: 'Los síntomas indican un preparado alquímico tomado pocos minutos antes.',
    weapon: 'el vial alquímico',
    access: 'los viales alquímicos',
    seen: 'el vial alquímico',
  },
  air: {
    cause: 'La víctima respiró una mezcla de aire alterada a mano en el regulador.',
    weapon: 'el regulador ambiental',
    access: 'el código del regulador',
    device: true,
  },
  medical: {
    cause: 'Los síntomas indican una cápsula de tratamiento alterada, tomada poco antes.',
    weapon: 'la cápsula de tratamiento',
    access: 'las cápsulas de tratamiento',
    seen: 'la cápsula de tratamiento',
  },
  power: {
    cause: 'Una descarga de un panel portátil de energía causó la muerte.',
    weapon: 'el panel portátil de energía',
    access: 'el panel portátil de energía',
  },
  laser: {
    cause: 'Una descarga de un emisor láser causó la muerte.',
    weapon: 'el emisor láser',
    access: 'el emisor láser',
  },
  plasma: {
    cause: 'Una descarga de un arma de plasma causó la muerte.',
    weapon: 'el arma de plasma',
    access: 'el arma de plasma',
  },
  robot: {
    cause: 'El brazo industrial golpeó a la víctima tras una orden dada a mano desde su consola.',
    weapon: 'la consola del brazo industrial',
    access: 'la consola del brazo industrial',
    device: true,
  },
  hatch: {
    cause: 'La compuerta industrial se cerró sobre la víctima tras una orden dada a mano.',
    weapon: 'el mando de la compuerta',
    access: 'el mando de la compuerta',
    device: true,
  },
  cryo: {
    cause: 'Alguien alteró a mano la cápsula criogénica mientras la víctima estaba dentro.',
    weapon: 'el panel criogénico',
    access: 'el código del panel criogénico',
    device: true,
  },
};
// The prepared worlds share six generic room descriptions assigned by position, so a
// kitchen was described as a workshop. Their JSON stays untouched because old saves hash
// it; new cases use these descriptions instead.
const preparedRooms = {
  'Salón de Ámbar':
    'Un gran salón de piedra dorada, con columnas talladas y un trono vacío al fondo. La luz entra tamizada por vidrieras de ámbar.',
  'Archivo de runas':
    'Estanterías de tablillas grabadas con runas, mesas de consulta y lámparas que brillan sin llama.',
  'Jardín encantado':
    'Un jardín cubierto por una cúpula de cristal, con senderos de musgo, flores que se cierran al acercarse y una fuente de agua clara.',
  'Forja real':
    'Yunques, fuelles y armas a medio forjar junto a un horno que nunca se apaga del todo.',
  'Torre del oráculo':
    'Una sala circular en lo alto de la torre, con una galería abierta, un atril con pergaminos y una esfera de cristal sobre un pedestal.',
  'Aposentos de huéspedes':
    'Habitaciones con camas de dosel, arcones de viaje y tapices bordados con escenas del reino.',
  'Salón del castillo':
    'Una sala amplia con chimenea, mesas largas de madera y tapices que cubren los muros de piedra.',
  Scriptorium: 'Atriles, pergaminos, tinteros y plumas bajo ventanas estrechas que dan al patio.',
  Botica: 'Estantes con frascos de hierbas secas, morteros, una balanza y un banco de trabajo.',
  Armería: 'Lanzas, espadas y escudos colgados de la pared, con un banco para afilar y un arcón cerrado.',
  'Torre de vigía':
    'Una sala estrecha en lo alto de la torre, con una galería abierta al viento y un brasero para las guardias de noche.',
  'Cámara de invitados':
    'Una cama con cortinas, un arcón, una jofaina y una mesa pequeña junto a la ventana.',
  Despacho:
    'Un escritorio de caoba con cartas ordenadas, un sillón de cuero y una caja fuerte detrás de un cuadro.',
  Biblioteca:
    'Estanterías hasta el techo, una escalera de mano, sillones de lectura y un globo terráqueo.',
  Comedor:
    'Una mesa larga puesta para la cena, un aparador con vajilla de porcelana y una lámpara de araña.',
  Cocina: 'Fogones de hierro, cazuelas colgadas, una mesa de trabajo y una despensa al fondo.',
  Invernadero:
    'Plantas exóticas bajo una cubierta de cristal, macetas en estantes y una galería elevada con barandilla.',
  Vestíbulo:
    'La entrada principal, con un reloj de pie, un perchero con abrigos y la escalera que sube a las habitaciones.',
};
const defaultMotives = [
  'Había falsificado sus credenciales profesionales. La víctima iba a denunciarlo al día siguiente.',
  'Había desviado suministros de la estación. La víctima había reunido pruebas y las entregaría al día siguiente.',
  'Había ocultado cobros irregulares en contratos. La víctima iba a entregar las cuentas a una auditoría al día siguiente.',
  'Había vendido información reservada. La víctima había descubierto la operación y presentaría las pruebas al día siguiente.',
];
const weakMotives = [
  {
    title: v => 'Carta de ' + v,
    text: (v, n) =>
      `Carta de ${v} a ${n}: le reclama una deuda pendiente y le da de plazo hasta final de mes. Termina con una advertencia: “No habrá más prórrogas”.`,
  },
  {
    title: v => 'Nota de ' + v,
    text: (v, n) =>
      `Nota de ${v}: “Hablar mañana con ${n}. Si sigue desobedeciendo, perderá su puesto”.`,
  },
  {
    title: () => 'Borrador de testamento',
    text: (v, n) =>
      `Borrador de un nuevo testamento de ${v}, sin firmar: retira a ${n} la parte que le había prometido.`,
  },
  {
    title: (v, n) => 'Queja de ' + n,
    text: (v, n) =>
      `Queja firmada por ${n}: acusa a ${v} de haberle humillado delante de todos y exige una reparación.`,
  },
];
const neutralDocuments = [
  {
    title: (v, n) => `Carta de ${v} a ${n}`,
    text: (v, n) => `Carta de ${v} a ${n}: le agradece su ayuda de la última semana.`,
  },
  {
    title: (v, n) => 'Encargos de ' + n,
    text: (v, n) => `Lista de encargos de ${n} para mañana. Nada fuera de lo corriente.`,
  },
  {
    title: (v, n) => 'Nota de ' + n,
    text: (v, n) => `Nota de ${n} a ${v}: confirma que ha terminado el trabajo que le pidió.`,
  },
];
const relations = [
  v => `Trataba con ${v} a diario.`,
  v => `Conocía a ${v} desde hacía años.`,
  v => `Mi relación con ${v} era de trabajo.`,
  v => `Veía a ${v} casi todos los días.`,
  v => `Conocía a ${v} lo suficiente para saber cómo trataba a los demás.`,
];

export function chooseCaseMethod(data, random, { previousMethodId = '', forcedMethodId = '' }) {
  let pool = prototypeMethods(data);
  const previous = pool.find(m => m.id === previousMethodId);
  if (forcedMethodId) {
    pool = pool.filter(m => m.id === forcedMethodId);
    if (!pool.length) throw Error('Método no disponible en esta ambientación');
  } else if (previous && pool.some(m => m.family !== previous.family))
    pool = pool.filter(m => m.family !== previous.family);
  return pick(pool, random);
}

export function generateCaseFile(
  data,
  { seed, previousMethodId = '', previousPersonId = '', forcedMethodId = '' } = {},
) {
  if (typeof seed !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(seed))
    throw Error('Semilla no válida');
  const random = rng('case-v1:' + seed),
    setting = data.setting || 'scifi',
    profile = profiles[setting],
    rooms = prototypeRooms(data).map(r =>
      data.custom || !preparedRooms[r.name] ? r : { ...r, description: preparedRooms[r.name] },
    ),
    people = data.world.people,
    // Texts use {victim}, {p1}… and {r1}… so a renamed person or place updates every text.
    victim = '{victim}',
    named = id => '{' + id + '}';
  if (people.length !== 5 || rooms.length < 6)
    throw Error('El mundo no tiene el reparto necesario');

  const method = chooseCaseMethod(data, random, { previousMethodId, forcedMethodId }),
    object = objects[method.id],
    scenePair = pick(
      methodRoomPairs(setting, rooms).filter(p => p.methodId === method.id),
      random,
    ),
    scene = rooms.find(r => r.id === scenePair.roomId),
    culprit = pick(
      people.filter(p => p.id !== previousPersonId),
      random,
    ).id,
    [i1, i2, i3, i4] = shuffle(
      people.filter(p => p.id !== culprit).map(p => p.id),
      random,
    ),
    herringPerson = pick([i3, i4], random),
    item = pick(profile.items, random),
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
  const motive = pick(data.motives?.length ? data.motives : defaultMotives, random).replace(
    /\b[Ll]a (víctima|dirección)\b/g,
    victim,
  );
  const [weakA, weakB] = shuffle(weakMotives, random),
    [neutralA, neutralB] = shuffle(neutralDocuments, random),
    accessList = shuffle([culprit, i2, i3], random).map(named);
  const prose = text => text;
  const roomName = room => `{${room.id}}`;

  const clues = [];
  const add = (room, title, text, fact, imagePrompt, image) =>
    clues.push({
      id: 'c' + (clues.length + 1),
      room: room.id,
      title: prose(title),
      text: prose(text),
      imagePrompt,
      image: image || '/assets/blackwood-complete-v1/clue-letter.webp',
      fact,
    });
  add(
    scene,
    profile.report,
    `${object.cause} Sitúa la muerte hacia las ${clock(death)}.`,
    { type: 'cause', method: method.id, room: scene.id, minute: death },
    profile.reportPrompt,
  );
  add(
    scene,
    object.device ? 'Manipulación en la escena' : 'Objeto del crimen',
    object.device
      ? `Alguien manipuló a mano ${object.weapon} en ${roomName(scene)}. No queda ninguna marca que diga quién.`
      : `Junto al cuerpo apareció ${object.weapon}. No estaba en el lugar donde se guarda habitualmente.`,
    { type: 'weapon', method: method.id, room: scene.id },
    method.imagePrompt,
    (setting !== 'scifi' &&
    ['shotgun', 'sword', 'crossbow', 'artifact', 'alchemy'].includes(method.id)
      ? '/prototype/world-assets-v1/'
      : '/prototype/assets/') +
      'method-' +
      method.id +
      '.webp',
  );
  add(
    scene,
    'Aviso del hallazgo',
    `${named(i2)} encontró a ${victim} en ${roomName(scene)} a las ${clock(discovery)} y dio la alarma.`,
    { type: 'discovery', person: i2, room: scene.id, minute: discovery },
    profile.testimonyPrompt,
  );
  const herringId = 'c' + (clues.length + 1);
  add(
    scene,
    'Objeto junto a la puerta',
    `Junto a la puerta de ${roomName(scene)} apareció ${item.fem ? 'una' : 'un'} ${item.noun} que pertenece a ${named(herringPerson)}.`,
    { type: 'herring', person: herringPerson, room: scene.id },
    item.prompt + ' on the floor',
  );
  add(
    storeRoom,
    'Quién podía llegar al arma',
    pick(
      [
        `Según ${profile.guardian}, solo ${list(accessList)} tenían acceso a ${object.access}.`,
        `Inventario de ${roomName(storeRoom)}: ${object.access} se guardaba bajo llave, y solo ${list(accessList)} tenían esa llave.`,
      ],
      random,
    ),
    { type: 'access', method: method.id, people: [culprit, i2, i3] },
    profile.ledgerPrompt,
  );
  add(
    storeRoom,
    'Última vez en su sitio',
    object.device
      ? `${capFirst(profile.guardian)} revisó ${object.weapon} a las ${clock(crime - 40)} y todo estaba en orden.`
      : `${capFirst(profile.guardian)} recuerda haber visto ${object.seen || object.access} en su sitio a las ${clock(crime - 40)}.`,
    { type: 'note' },
    profile.testimonyPrompt,
  );
  add(
    recordRoom,
    'Registro de ' + roomName(recordRoom),
    `${capFirst(profile.record)} de ${roomName(recordRoom)} anota la entrada de ${named(i2)} a las ${clock(from)} y su salida a las ${clock(recordTo)}.`,
    { type: 'presence', people: [i2], room: recordRoom.id, from, to: recordTo },
    profile.ledgerPrompt,
  );
  add(
    pairRoom,
    'Declaración sobre ' + roomName(pairRoom),
    `${capFirst(profile.guardian)} vigiló la puerta de ${roomName(pairRoom)} de ${clock(from)} a ${clock(to)}: dentro estaban ${named(i3)} y ${named(i4)}, y nadie más entró ni salió.`,
    { type: 'presence', people: [i3, i4], room: pairRoom.id, from, to, exclusive: true },
    profile.testimonyPrompt,
  );
  if (pattern === 'empty')
    add(
      emptyRoom,
      'Llave de ' + roomName(emptyRoom),
      `La puerta de ${roomName(emptyRoom)} estuvo cerrada con llave de ${clock(from)} a ${clock(to)}. ${capFirst(profile.guardian)} guardaba la única llave y nadie le pidió abrir.`,
      { type: 'presence', people: [], room: emptyRoom.id, from, to, exclusive: true },
      profile.testimonyPrompt,
    );
  add(
    aloneRoom,
    'Sin testigos',
    `Nadie recuerda haber visto a ${named(i1)} entre las ${clock(from)} y las ${clock(to)}.`,
    { type: 'note' },
    profile.testimonyPrompt,
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
    profile.documentPrompt,
  );
  for (const [person, weak] of [
    [i1, weakA],
    [i2, weakB],
  ]) {
    documents[person] = clues.length + 1;
    add(
      documentRoom(),
      weak.title(victim, named(person)),
      weak.text(victim, named(person)),
      { type: 'motive', person },
      profile.documentPrompt,
    );
  }
  for (const [person, neutral] of [
    [i3, neutralA],
    [i4, neutralB],
  ]) {
    documents[person] = clues.length + 1;
    add(
      documentRoom(),
      neutral.title(victim, named(person)),
      neutral.text(victim, named(person)),
      { type: 'note' },
      profile.documentPrompt,
    );
  }
  add(
    documentRoom(),
    'Nota de ' + named(herringPerson),
    `Nota escrita por ${named(herringPerson)} a las ${clock(morning)}: pregunta si alguien ha visto ${item.fem ? 'la' : 'el'} ${item.noun} que perdió esta mañana en ${roomName(scene)}.`,
    { type: 'explains', clue: herringId },
    profile.documentPrompt,
  );

  const clueId = n => 'c' + n,
    accessClue = clues.find(c => c.fact.type === 'access').id,
    recordClue = clues.find(c => c.fact.type === 'presence' && c.fact.people[0] === i2).id,
    pairClue = clues.find(c => c.fact.type === 'presence' && c.fact.people.length === 2).id,
    emptyClue = clues.find(c => c.fact.type === 'presence' && !c.fact.people.length)?.id,
    aloneClue = clues.find(c => c.title === 'Sin testigos').id;
  const claim = {
    [culprit]:
      pattern === 'pair'
        ? `Estuve en ${roomName(pairRoom)} de ${clock(from)} a ${clock(to)}.`
        : `Estuve en ${roomName(emptyRoom)} de ${clock(from)} a ${clock(to)}, sin compañía.`,
    [i1]: `Estuve en ${roomName(aloneRoom)} de ${clock(from)} a ${clock(to)}, sin compañía.`,
    [i2]: `Estuve en ${roomName(recordRoom)} de ${clock(from)} a ${clock(recordTo)}. Al salir encontré a ${victim}.`,
    [i3]: `Estuve en ${roomName(pairRoom)} con ${named(i4)} de ${clock(from)} a ${clock(to)}.`,
    [i4]: `Estuve en ${roomName(pairRoom)} con ${named(i3)} de ${clock(from)} a ${clock(to)}.`,
  };
  const alibiRoom = {
    [culprit]: claimRoom,
    [i1]: aloneRoom,
    [i2]: recordRoom,
    [i3]: pairRoom,
    [i4]: pairRoom,
  };
  const relationLines = shuffle(relations, random);
  const facts = Object.fromEntries(
    people.map((p, n) => {
      const id = p.id,
        own = [
          { id: 'alibi', text: claim[id] },
          { id: 'motive', text: relationLines[n](victim) },
          {
            id: 'secret',
            requires: clueId(documents[id]),
            text:
              id === culprit
                ? `Es cierto que ${victim} sabía eso de mí. Saberlo no me convierte en culpable.`
                : [i1, i2].includes(id)
                  ? `Sí, ${victim} y yo teníamos ese problema. Eso no significa que le hiciera daño.`
                  : 'Ese papel no tiene nada de particular.',
          },
          {
            id: 'link',
            requires: accessClue,
            text: [culprit, i2, i3].includes(id)
              ? `Sí, podía llegar a ${object.access}. No era la única persona que podía hacerlo.`
              : `Yo no tenía acceso a ${object.access}.`,
          },
        ];
      if (id === culprit)
        own.push({
          id: 'timeline',
          requires: pattern === 'pair' ? pairClue : emptyClue,
          text: `Quizá me confundí de hora. Eso no significa que entrara en ${roomName(scene)}.`,
        });
      if (id === i1)
        own.push({
          id: 'timeline',
          requires: aloneClue,
          text: 'Es verdad que nadie me vio. Estuve sin compañía todo ese tiempo.',
        });
      if (id === i2)
        own.push(
          {
            id: 'timeline',
            requires: recordClue,
            text: `Mi entrada y mi salida constan en ${profile.record}.`,
          },
          {
            id: 'seen',
            text: `Encontré a ${victim} en ${roomName(scene)} a las ${clock(discovery)} y di la alarma.`,
          },
        );
      if ([i3, i4].includes(id))
        own.push(
          {
            id: 'timeline',
            requires: pairClue,
            text: `${capFirst(profile.guardian)} vigilaba la puerta y puede confirmarlo.`,
          },
          {
            id: 'seen',
            text: `Estuve en ${roomName(pairRoom)} con ${named(id === i3 ? i4 : i3)}. No entró nadie más.`,
          },
        );
      else if (id !== i2) own.push({ id: 'seen', text: 'No vi nada fuera de lo normal.' });
      if (id === herringPerson)
        own.push({
          id: 'object',
          requires: herringId,
          text: `${item.fem ? 'Esa' : 'Ese'} ${item.noun} es ${item.fem ? 'mía' : 'mío'}. ${item.fem ? 'La' : 'Lo'} perdí esta mañana en ${roomName(scene)}.`,
        });
      return [id, own.map(f => ({ ...f, text: prose(f.text) }))];
    }),
  );

  const file = normalizeCaseFile({
    format: CASE_FORMAT,
    version: 1,
    title: data.world.title,
    setting,
    ...(data.label ? { label: data.label } : {}),
    ...(data.description ? { description: data.description } : {}),
    ...(data.visualStyle ? { visualStyle: data.visualStyle } : {}),
    ...(data.rules ? { rules: data.rules } : {}),
    victim: data.victim,
    people,
    rooms,
    crime: {
      culprit,
      method: method.id,
      scene: scene.id,
      crimeMinute: crime,
      exitMinute: exit,
      deathMinute: death,
      discoveryMinute: discovery,
      motive,
    },
    alibis: people.map(p => ({
      person: p.id,
      room: alibiRoom[p.id].id,
      from,
      to: p.id === i2 ? recordTo : to,
      claim: prose(claim[p.id]),
    })),
    clues,
    facts,
    origin: { generator: 'case-v1', seed },
  });
  const analysis = analyzeCase(file);
  if (analysis.errors.length) throw Error('Generador incoherente: ' + analysis.errors.join(' '));
  return file;
}
