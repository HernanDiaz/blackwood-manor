// The sentences with which the case generator (case-generator.mjs) joins the words of a world,
// in each language. Every entry that offers several wordings is drawn with one call to the
// random generator in both languages, so the same seed gives the same case in either.
// Placeholders such as {victim}, {p1} or {r2} stay in the text; the case file resolves them.
const capFirst = s => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);
const lowerFirst = s => s.charAt(0).toLocaleLowerCase('es') + s.slice(1);

const es = {
  list: names => names.slice(0, -1).join(', ') + ' y ' + names.at(-1),
  report: (cause, t) => [
    `${cause} Sitúa la muerte hacia las ${t}.`,
    `${cause} Fija la hora de la muerte hacia las ${t}.`,
    `${cause} La muerte se produjo hacia las ${t}.`,
  ],
  deviceTitle: ['Manipulación en la escena', 'Algo fuera de su sitio'],
  device: (weapon, scene) => [
    `Alguien manipuló a mano ${weapon} en ${scene}. No queda ninguna marca que diga quién.`,
    `En ${scene} hay señales de que alguien manipuló a mano ${weapon}. Nada indica quién lo hizo.`,
  ],
  weaponTitle: ['Objeto del crimen', 'Junto al cuerpo'],
  weapon: weapon => [
    `Junto al cuerpo apareció ${weapon}. No estaba en el lugar donde se guarda habitualmente.`,
    `${capFirst(weapon)} estaba en el suelo, cerca del cuerpo, lejos de donde se guarda.`,
  ],
  discoveryTitle: ['Aviso del hallazgo', 'Quién dio la alarma'],
  discovery: (person, victim, scene, t) => [
    `${person} encontró a ${victim} en ${scene} a las ${t} y dio la alarma.`,
    `A las ${t}, ${person} entró en ${scene}, encontró a ${victim} y dio la alarma.`,
  ],
  herringTitle: ['Objeto junto a la puerta', 'Un objeto perdido'],
  otherHerringTitle: 'Otro objeto junto a la puerta',
  herring: (item, scene, person) => {
    const a = item.gender === 'f' ? 'una' : 'un';
    return [
      `Junto a la puerta de ${scene} apareció ${a} ${item.noun} que pertenece a ${person}.`,
      `En el umbral de ${scene} había ${a} ${item.noun}. Es de ${person}.`,
    ];
  },
  accessTitle: ['Quién podía llegar al arma', 'Acceso al arma'],
  access: (guardian, names, access) => [
    `Según ${guardian}, solo ${names} tenían acceso a ${access}.`,
    `Anotación de ${guardian}: solo ${names} tenían permiso para usar ${access}.`,
  ],
  lastSeenTitle: ['Última vez en su sitio', 'Antes del crimen'],
  checked: (Guardian, weapon, t) =>
    `${Guardian} revisó ${weapon} a las ${t} y todo estaba en orden.`,
  lastSeen: (Guardian, guardian, weapon, t) => [
    `${Guardian} recuerda haber visto ${weapon} en su sitio a las ${t}.`,
    `A las ${t}, ${weapon} seguía en su sitio, según ${guardian}.`,
  ],
  recordTitle: room => ['Registro de ' + room, 'Entradas en ' + room],
  record: ({ Record, record, room, person, from, to }) => [
    `${Record} de ${room} anota una sola entrada entre las ${from} y las ${to}: la de ${person}, que entró a las ${from} y salió a las ${to}.`,
    `Entre las ${from} y las ${to}, ${record} de ${room} solo recoge a ${person}: entró a las ${from} y salió a las ${to}.`,
  ],
  pairTitle: room => ['Declaración sobre ' + room, 'Vigilancia de ' + room],
  pair: ({ Guardian, guardian, room, a, b, from, to }) => [
    `${Guardian} vigiló la puerta de ${room} de ${from} a ${to}: dentro estaban ${a} y ${b}, y nadie más entró ni salió.`,
    `De ${from} a ${to}, ${guardian} no se movió de la puerta de ${room}. Dentro solo estaban ${a} y ${b}; nadie más entró ni salió.`,
  ],
  lockedTitle: room => ['Llave de ' + room, 'Puerta cerrada'],
  locked: ({ Guardian, guardian, room, from, to }) => [
    `La puerta de ${room} estuvo cerrada con llave de ${from} a ${to}. ${Guardian} guardaba la única llave y nadie le pidió abrir.`,
    `Nadie pudo entrar en ${room} de ${from} a ${to}: la puerta estaba cerrada con llave, y ${guardian}, que tenía la única, no se la dio a nadie.`,
  ],
  witnessTitle: guardian => ['Un testigo', 'Lo que vio ' + guardian],
  witness: (Guardian, person, scene, t) =>
    `${Guardian} vio a ${person} entrar en ${scene} hacia las ${t}.`,
  aloneTitle: ['Sin testigos', 'Nadie le vio'],
  alone: (person, from, to) => [
    `Nadie recuerda haber visto a ${person} entre las ${from} y las ${to}.`,
    `Entre las ${from} y las ${to}, nadie se cruzó con ${person}.`,
  ],
  motive: (victim, person, motive) => [
    [
      `Papeles de ${victim}`,
      `Entre los papeles de ${victim} hay notas sobre ${person}: ${lowerFirst(motive)}`,
    ],
    [
      `Carta sin enviar de ${victim}`,
      `Carta sin enviar de ${victim}: escribe que ${person} ${lowerFirst(motive)}`,
    ],
  ],
  noteTitle: person => 'Nota de ' + person,
  note: (person, t, item, scene) =>
    `Nota escrita por ${person} a las ${t}: pregunta si alguien ha visto ${
      item.gender === 'f' ? 'la' : 'el'
    } ${item.noun} que perdió esta mañana en ${scene}.`,
  // The values of {item}, {mine} and {it} when someone owns the lost object.
  own: item => ({
    item: (item.gender === 'f' ? 'la' : 'el') + ' ' + item.noun,
    mine: item.gender === 'f' ? 'mía' : 'mío',
    it: item.gender === 'f' ? 'la' : 'lo',
  }),
};

const anA = noun => (/^[aeiou]/i.test(noun) ? 'an' : 'a');
const en = {
  list: names => names.slice(0, -1).join(', ') + ' and ' + names.at(-1),
  report: (cause, t) => [
    `${cause} It puts the death at around ${t}.`,
    `${cause} It sets the time of death at about ${t}.`,
    `${cause} Death occurred at around ${t}.`,
  ],
  deviceTitle: ['Tampering at the scene', 'Something out of place'],
  device: (weapon, scene) => [
    `Someone tampered with ${weapon} by hand in ${scene}. There is no mark to say who.`,
    `In ${scene} there are signs that someone tampered with ${weapon} by hand. Nothing shows who did it.`,
  ],
  weaponTitle: ['The object of the crime', 'Beside the body'],
  weapon: weapon => [
    `${capFirst(weapon)} was found beside the body. It was not where it is usually kept.`,
    `${capFirst(weapon)} lay on the floor near the body, far from where it is kept.`,
  ],
  discoveryTitle: ['The discovery', 'Who raised the alarm'],
  discovery: (person, victim, scene, t) => [
    `${person} found ${victim} in ${scene} at ${t} and raised the alarm.`,
    `At ${t}, ${person} went into ${scene}, found ${victim} and raised the alarm.`,
  ],
  herringTitle: ['An object by the door', 'A lost object'],
  otherHerringTitle: 'Another object by the door',
  herring: (item, scene, person) => [
    `By the door of ${scene} there was ${anA(item.noun)} ${item.noun} that belongs to ${person}.`,
    `On the threshold of ${scene} lay ${anA(item.noun)} ${item.noun}. It belongs to ${person}.`,
  ],
  accessTitle: ['Who could reach the weapon', 'Access to the weapon'],
  access: (guardian, names, access) => [
    `According to ${guardian}, only ${names} had access to ${access}.`,
    `A note by ${guardian}: only ${names} were allowed to use ${access}.`,
  ],
  lastSeenTitle: ['Last seen in its place', 'Before the crime'],
  checked: (Guardian, weapon, t) => `${Guardian} checked ${weapon} at ${t} and all was in order.`,
  lastSeen: (Guardian, guardian, weapon, t) => [
    `${Guardian} remembers seeing ${weapon} in its place at ${t}.`,
    `At ${t}, ${weapon} was still in its place, according to ${guardian}.`,
  ],
  recordTitle: room => ['Register of ' + room, 'Entries for ' + room],
  record: ({ Record, record, room, person, from, to }) => [
    `${Record} for ${room} shows a single entry between ${from} and ${to}: ${person}, who went in at ${from} and came out at ${to}.`,
    `Between ${from} and ${to}, ${record} for ${room} lists only ${person}: in at ${from}, out at ${to}.`,
  ],
  pairTitle: room => ['Statement about ' + room, 'Watch on ' + room],
  pair: ({ Guardian, guardian, room, a, b, from, to }) => [
    `${Guardian} watched the door of ${room} from ${from} to ${to}: ${a} and ${b} were inside, and nobody else went in or out.`,
    `From ${from} to ${to}, ${guardian} never left the door of ${room}. Only ${a} and ${b} were inside; nobody else went in or out.`,
  ],
  lockedTitle: room => ['The key to ' + room, 'A locked door'],
  locked: ({ Guardian, guardian, room, from, to }) => [
    `The door of ${room} was locked from ${from} to ${to}. ${Guardian} kept the only key and nobody asked for it to be opened.`,
    `Nobody could get into ${room} from ${from} to ${to}: the door was locked, and ${guardian}, who had the only key, gave it to no one.`,
  ],
  witnessTitle: guardian => ['A witness', 'What ' + guardian + ' saw'],
  witness: (Guardian, person, scene, t) =>
    `${Guardian} saw ${person} go into ${scene} at around ${t}.`,
  aloneTitle: ['No witnesses', 'Nobody saw them'],
  alone: (person, from, to) => [
    `Nobody remembers seeing ${person} between ${from} and ${to}.`,
    `Between ${from} and ${to}, nobody crossed paths with ${person}.`,
  ],
  motive: (victim, person, motive) => [
    [
      `The papers of ${victim}`,
      `Among the papers of ${victim} there are notes on ${person}, who ${lowerFirst(motive)}`,
    ],
    [
      `An unsent letter from ${victim}`,
      `An unsent letter from ${victim} says that ${person} ${lowerFirst(motive)}`,
    ],
  ],
  noteTitle: person => 'A note from ' + person,
  note: (person, t, item, scene) =>
    `A note written by ${person} at ${t}, asking whether anyone has seen the ${item.noun} they lost this morning in ${scene}.`,
  own: item => ({ item: 'the ' + item.noun, mine: 'mine', it: 'it' }),
};

export const casePhrases = { es, en };
