// The messages of the checks on worlds, case files and saves (world-file.mjs, case-file.mjs,
// statements.mjs, prototype-engine.mjs…) are written in Spanish, the language of the engine.
// This turns them into English when the screens are in English, without changing the checks:
// first the whole message, then the field it names ("el nombre de p1", "la pista c12").
const fields = [
  [/^la pista (c\d+)$/, m => `clue ${m[1]}`],
  [/^el arma (\w+)$/, m => `weapon ${m[1]}`],
  [/^el color (\w+)$/, m => `colour ${m[1]}`],
  [/^el objeto (\d+)$/, m => `lost object ${m[1]}`],
  [/^el móvil (\d+)$/, m => `motive ${m[1]}`],
  [/^móvil débil (\d+)$/, m => `weak motive document ${m[1]}`],
  [/^documento neutro (\d+)$/, m => `neutral document ${m[1]}`],
  [/^el prólogo (\d+)$/, m => `prologue ${m[1]}`],
  [/^el cierre del prólogo (\d+)$/, m => `prologue ending ${m[1]}`],
  [/^el paso de la noche (\d+)$/, m => `night line ${m[1]}`],
  [/^el epílogo (\d+)$/, m => `epilogue ${m[1]}`],
  [/^la atmósfera (\d+) de (\w+)$/, m => `atmosphere ${m[1]} of ${m[2]}`],
  [/^la voz de (\w+)$/, m => `the voice of ${m[1]}`],
  [/^el nombre de la víctima$/, () => "the victim's name"],
  [/^el cargo de la víctima$/, () => "the victim's position"],
  [/^la descripción de la víctima$/, () => "the victim's description"],
  [/^el nombre de un arma$/, () => 'the name of a weapon'],
  [/^el estilo de las ilustraciones$/, () => 'the style of the illustrations'],
  [/^los documentos de móvil débil$/, () => 'the weak motive documents'],
  [/^los cierres del prólogo$/, () => 'the prologue endings'],
  [/^el cierre del prólogo$/, () => 'the prologue ending'],
  // Composite fields: "el nombre de el arma knife", "la ilustración de p1"…
  [/^la forma en una frase de (.+)$/, m => `the in-sentence form of ${field(m[1])}`],
  [/^el nombre de (.+)$/, m => `the name of ${field(m[1])}`],
  [/^el oficio de (.+)$/, m => `the occupation of ${field(m[1])}`],
  [/^la personalidad de (.+)$/, m => `the personality of ${field(m[1])}`],
  [/^el aspecto de (.+)$/, m => `the appearance of ${field(m[1])}`],
  [/^la descripción de (.+)$/, m => `the description of ${field(m[1])}`],
  [/^la atmósfera de (.+)$/, m => `the atmosphere of ${field(m[1])}`],
  [/^las etiquetas de (.+)$/, m => `the tags of ${field(m[1])}`],
  [/^la causa de (.+)$/, m => `the cause of death of ${field(m[1])}`],
  [/^el objeto de (.+)$/, m => `the object of ${field(m[1])}`],
  [/^el acceso de (.+)$/, m => `the access text of ${field(m[1])}`],
  [/^lo que se vio de (.+)$/, m => `what was seen of ${field(m[1])}`],
  [/^cómo se usó (.+)$/, m => `how ${field(m[1])} was used`],
  [/^la ilustración de (.+)$/, m => `the illustration of ${field(m[1])}`],
  [/^el título de (.+)$/, m => `the title of ${field(m[1])}`],
  [/^el texto de (.+)$/, m => `the text of ${field(m[1])}`],
];
const words = {
  'la personalidad': 'the personality',
  'la atmósfera': 'the atmosphere',
  'una etiqueta': 'a tag',
  etiquetas: 'the tags',
  'la etiqueta': 'the label',
  'el título': 'the title',
  'la premisa': 'the premise',
  'quien vigila': 'who keeps watch',
  'el registro': 'the register',
  'el informe médico': 'the medical report',
  'los objetos perdidos': 'the lost objects',
  'los móviles': 'the motives',
  'el móvil': 'the motive',
  'los documentos neutros': 'the neutral documents',
  'los prólogos': 'the prologues',
  'el prólogo': 'the prologue',
  'la noche': 'the night',
  'los epílogos': 'the epilogues',
  'el epílogo': 'the epilogue',
  'los personajes': 'the characters',
  personajes: 'the characters',
  'los lugares': 'the places',
  lugares: 'the places',
  'las armas': 'the weapons',
  armas: 'the weapons',
  variantes: 'the variants',
  'el arma': 'the weapon',
  'el crimen': 'the crime',
  'la salida': "the culprit's exit",
  'la muerte': 'the death',
  'el hallazgo': 'the discovery',
  'el origen': 'the origin',
  'la semilla': 'the seed',
  'la víctima': 'the victim',
  'un objeto': 'an object',
  report: 'the report',
  testimony: 'the statement',
  ledger: 'the register',
  document: 'the document',
};
function field(text) {
  if (words[text]) return words[text];
  for (const [pattern, english] of fields) {
    const m = text.match(pattern);
    if (m) return english(m);
  }
  // A field that is only an id (p1, r3, c12) or a method stays as it is.
  return text;
}
// Why a statement cannot be used (statements.mjs, phrasingIssue).
const issues = [
  [/^tipo de declaración desconocido$/, () => 'unknown kind of statement'],
  [/^texto vacío o largo$/, () => 'empty or too long'],
  [/^caracteres no permitidos$/, () => 'characters not allowed'],
  [/^marcador desconocido: (\{\w+\})$/, m => `unknown placeholder: ${m[1]}`],
  [/^falta el marcador (\{\w+\})$/, m => `the placeholder ${m[1]} is missing`],
  [/^contiene horas o cifras escritas a mano$/, () => 'contains times or numbers written by hand'],
];
const issue = text => {
  for (const [pattern, english] of issues) {
    const m = text.match(pattern);
    if (m) return english(m);
  }
  return text;
};
const F = '(.+?)';
const messages = [
  // world-file.mjs
  [`^Falta el texto de ${F}$`, m => cap(`${field(m[1])} is missing`)],
  [`^${F} supera (\\d+) caracteres$`, m => cap(`${field(m[1])} is longer than ${m[2]} characters`)],
  [
    `^${F} contiene caracteres no válidos$`,
    m => cap(`${field(m[1])} contains characters that are not allowed`),
  ],
  [`^Imagen no permitida en ${F}$`, m => `Image not allowed in ${field(m[1])}`],
  [`^${F} debe ser una lista$`, m => cap(`${field(m[1])} must be a list`)],
  [
    `^${F} necesita entre (\\d+) y (\\d+) elementos$`,
    m => cap(`${field(m[1])}: between ${m[2]} and ${m[3]} items are needed`),
  ],
  [
    `^${F} usa un marcador desconocido: (\\{\\w+\\})$`,
    m => cap(`${field(m[1])} uses an unknown placeholder: ${m[2]}`),
  ],
  [
    `^${F} no debe llevar horas ni cifras$`,
    m => cap(`${field(m[1])} must not contain times or numbers`),
  ],
  [
    `^${F}: tipo de declaración desconocido «(.+)»$`,
    m => cap(`${field(m[1])}: unknown kind of statement “${m[2]}”`),
  ],
  [
    `^${F} · ([\\w.]+): (.+) \\(«(.*)»\\)$`,
    m => cap(`${field(m[1])} · ${m[2]}: ${issue(m[3])} (“${m[4]}”)`),
  ],
  [`^${F} no es válida$`, m => cap(`${field(m[1])} is not valid`)],
  [`^Género no válido en ${F}$`, m => `Invalid gender in ${field(m[1])}`],
  [`^Artículo no válido en ${F}$`, m => `Invalid article in ${field(m[1])}`],
  [`^Color no válido en ${F}$`, m => `Invalid colour in ${field(m[1])}`],
  [`^Método desconocido: ${F}$`, m => `Unknown method: ${m[1]}`],
  [`^Ningún lugar permite ${F}$`, m => `No place allows ${field(m[1])}`],
  ['^No es un mundo compatible$', () => 'Not a compatible world'],
  ['^Identificador de mundo no válido$', () => 'Invalid world id'],
  ['^Los personajes deben ser p1 a p5$', () => 'The characters must be p1 to p5'],
  ['^Identificador de lugar no válido$', () => 'Invalid place id'],
  ['^Lugares repetidos$', () => 'Repeated places'],
  ['^Armas repetidas$', () => 'Repeated weapons'],
  ['^Faltan los documentos$', () => 'The documents are missing'],
  ['^Efecto de fondo desconocido$', () => 'Unknown background effect'],
  // case-file.mjs: the fields
  [`^Hora no válida en ${F}$`, m => `Invalid time in ${field(m[1])}`],
  [`^Persona desconocida en ${F}$`, m => `Unknown person in ${field(m[1])}`],
  [`^Lugar desconocido en ${F}$`, m => `Unknown place in ${field(m[1])}`],
  [`^Método desconocido en ${F}$`, m => `Unknown method in ${field(m[1])}`],
  [`^Nadie tiene acceso en ${F}$`, m => `Nobody has access in ${field(m[1])}`],
  [`^Intervalo vacío en ${F}$`, m => `Empty time interval in ${field(m[1])}`],
  [`^Tipo de hecho desconocido en ${F}$`, m => `Unknown kind of fact in ${field(m[1])}`],
  ['^No es un expediente compatible$', () => 'Not a compatible case file'],
  ['^Falta el crimen$', () => 'The crime is missing'],
  ['^Mundo no válido$', () => 'Invalid world'],
  ['^Arma desconocida$', () => 'Unknown weapon'],
  ['^Culpable desconocido$', () => 'Unknown culprit'],
  ['^Método desconocido$', () => 'Unknown method'],
  ['^Escena desconocida$', () => 'Unknown scene'],
  ['^Coartada de persona desconocida$', () => 'Alibi of an unknown person'],
  ['^Coartada en un lugar desconocido$', () => 'Alibi in an unknown place'],
  ['^Identificador de pista no válido$', () => 'Invalid clue id'],
  ['^Pista en un lugar desconocido$', () => 'Clue in an unknown place'],
  ['^Tema de declaración desconocido$', () => 'Unknown statement topic'],
  ['^Tipo de declaración no válido$', () => 'Invalid kind of statement'],
  ['^Requisito no válido$', () => 'Invalid requirement'],
  [
    '^Un expediente necesita entre 6 y 30 pistas$',
    () => 'A case file needs between 6 and 30 clues',
  ],
  ['^Pistas repetidas$', () => 'Repeated clues'],
  // case-file.mjs: the logic of the case
  [
    '^La cronología es imposible: el hallazgo debe llegar después del crimen y de la salida del culpable\\.$',
    () =>
      "The timeline is impossible: the discovery must come after the crime and after the culprit's exit.",
  ],
  ['^El método no se puede usar en la escena\\.$', () => 'The method cannot be used at the scene.'],
  [
    '^El arma del crimen no está entre las de la acusación\\.$',
    () => 'The murder weapon is not among those of the accusation.',
  ],
  [
    '^La causa de la muerte contradice el crimen\\.$',
    () => 'The cause of death contradicts the crime.',
  ],
  ['^El arma hallada no es la del crimen\\.$', () => 'The weapon found is not the murder weapon.'],
  [
    '^Una pista de acceso habla de otro método\\.$',
    () => 'An access clue is about another method.',
  ],
  [`^${F} no tiene coartada\\.$`, m => `${m[1]} has no alibi.`],
  [
    `^La coartada de ${F} no cubre la hora del crimen\\.$`,
    m => `The alibi of ${m[1]} does not cover the time of the crime.`,
  ],
  [`^La coartada de ${F} está en la escena\\.$`, m => `The alibi of ${m[1]} is at the scene.`],
  [`^${F} no puede declarar su coartada\\.$`, m => `${m[1]} cannot give their alibi.`],
  [`^${F} tiene declaraciones repetidas\\.$`, m => `${m[1]} has repeated statements.`],
  [
    `^Una declaración de ${F} depende de una pista que no existe\\.$`,
    m => `A statement of ${m[1]} depends on a clue that does not exist.`,
  ],
  [
    `^Las pistas confirman y desmienten a la vez la coartada de ${F}\\.$`,
    m => `The clues both confirm and break the alibi of ${m[1]}.`,
  ],
  [
    `^Una pista desmiente la coartada de ${F}, que es inocente\\.$`,
    m => `A clue breaks the alibi of ${m[1]}, who is innocent.`,
  ],
  [`^Ninguna pista desmiente la coartada de ${F}\\.$`, m => `No clue breaks the alibi of ${m[1]}.`],
  [
    `^La solución es ambigua: ${F} cumplen las tres condiciones\\.$`,
    m => `The solution is ambiguous: ${m[1]} meet all three conditions.`,
  ],
  [
    '^Las pistas no permiten deducir al culpable\\.$',
    () => 'The clues do not lead to the culprit.',
  ],
  ['^Hay una pista engañosa sin explicación\\.$', () => 'A misleading clue has no explanation.'],
  [
    '^Una explicación se refiere a una pista que no es engañosa\\.$',
    () => 'An explanation refers to a clue that is not misleading.',
  ],
  // Saves and the generator
  ['^No es una partida compatible$', () => 'Not a compatible saved game'],
  [
    '^La definición del caso no coincide con el guardado$',
    () => 'The case does not match the saved game',
  ],
  [
    '^Las pruebas pertenecen a otra investigación$',
    () => 'The evidence belongs to another investigation',
  ],
  ['^Arma no disponible en este mundo$', () => 'Weapon not available in this world'],
  ['^Semilla no válida$', () => 'Invalid seed'],
  ['^Dificultad desconocida$', () => 'Unknown difficulty'],
  ['^Mundo no disponible$', () => 'World not available'],
].map(([pattern, english]) => [new RegExp(pattern), english]);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// The sentences of an incoherent case come joined after a heading.
const headings = [
  ['Expediente incoherente: ', 'Inconsistent case file: '],
  ['Generador incoherente: ', 'Inconsistent generator: '],
];
const sentences = text => text.match(/[^.]+(?:\.|$)/g)?.map(s => s.trim()) || [text];

export function validationText(message, lang = 'es') {
  const text = String(message ?? '');
  if (lang !== 'en') return text;
  for (const [es, en] of headings)
    if (text.startsWith(es))
      return (
        en +
        sentences(text.slice(es.length))
          .map(s => validationText(s, lang))
          .join(' ')
      );
  for (const [pattern, english] of messages) {
    const m = text.match(pattern);
    if (m) return english(m);
  }
  return text;
}
