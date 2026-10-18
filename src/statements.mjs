// What suspects can say, as phrasing templates. The engine fills the facts (places, times,
// names) and the template only decides the wording, so a phrasing written by hand or by a
// larger model offline can change the voice of a character but never the evidence.
//
// Placeholders: {victim}, {name}, {role}, {place}, {scene}, {partner}, {from}, {to}, {time},
// {access}, {record}, {guardian}, {item} (with article), {mine} (mío/mía), {it} (lo/la).
// A capitalized placeholder ({Guardian}) inserts the value with a capital letter.
export const statementKinds = {
  'alibi.claim': {
    topic: 'alibi',
    required: ['place', 'from', 'to'],
    variants: [
      'Estuve en {place} de {from} a {to}.',
      'De {from} a {to} estuve en {place}.',
      'Pasé ese rato en {place}, de {from} a {to}.',
    ],
  },
  'alibi.alone': {
    topic: 'alibi',
    required: ['place', 'from', 'to'],
    variants: [
      'Estuve en {place} de {from} a {to}, sin compañía.',
      'De {from} a {to} estuve en {place}. No había nadie conmigo.',
      'Pasé ese rato en {place}, de {from} a {to}, sin nadie más.',
    ],
  },
  'alibi.record': {
    topic: 'alibi',
    required: ['place', 'from', 'to', 'victim'],
    variants: [
      'Estuve en {place} de {from} a {to}. Al salir encontré a {victim}.',
      'De {from} a {to} estuve en {place}; al salir encontré a {victim}.',
    ],
  },
  'alibi.pair': {
    topic: 'alibi',
    required: ['place', 'partner', 'from', 'to'],
    variants: [
      'Estuve en {place} con {partner} de {from} a {to}.',
      'De {from} a {to} estuve en {place}, con {partner}.',
      '{partner} y yo estuvimos en {place} de {from} a {to}.',
    ],
  },
  relation: {
    topic: 'motive',
    required: ['victim'],
    variants: [
      'Trataba con {victim} a diario.',
      'Conocía a {victim} desde hacía años.',
      'Mi relación con {victim} era de trabajo.',
      'Veía a {victim} casi todos los días.',
      'Conocía a {victim} lo suficiente para saber cómo trataba a los demás.',
    ],
  },
  'secret.culprit': {
    topic: 'secret',
    required: ['victim'],
    variants: [
      'Es cierto que {victim} sabía eso de mí. Saberlo no me convierte en culpable.',
      'Sí, {victim} lo había descubierto. Eso no prueba que le hiciera nada.',
      'Lo que dice ese papel es verdad. Pero de ahí a un crimen hay mucha distancia, y {victim} lo sabía.',
    ],
  },
  'secret.weak': {
    topic: 'secret',
    required: ['victim'],
    variants: [
      'Sí, {victim} y yo teníamos ese problema. Eso no significa que le hiciera daño.',
      'Ese asunto con {victim} era incómodo, lo reconozco. Pero nadie mata por algo así.',
      'Teníamos cuentas pendientes, {victim} y yo. Como tanta gente en este lugar.',
    ],
  },
  'secret.neutral': {
    topic: 'secret',
    required: [],
    variants: [
      'Ese papel no tiene nada de particular.',
      'Es un papel corriente. No sé qué espera encontrar en él.',
      'Nada de eso tiene importancia, se lo aseguro.',
    ],
  },
  'link.access': {
    topic: 'link',
    required: ['access'],
    variants: [
      'Sí, podía llegar a {access}. No era la única persona que podía hacerlo.',
      'Tenía acceso a {access}, es cierto. Igual que otras personas.',
      'Podía coger {access}, sí. Y no era la única persona.',
    ],
  },
  'link.none': {
    topic: 'link',
    required: ['access'],
    variants: [
      'Yo no tenía acceso a {access}.',
      'No podía llegar a {access}. Compruébelo si quiere.',
      'Nunca tuve acceso a {access}.',
    ],
  },
  'timeline.culprit': {
    topic: 'timeline',
    required: ['scene'],
    variants: [
      'Quizá me confundí de hora. Eso no significa que entrara en {scene}.',
      'Puede que me equivocara de sitio o de hora. Pero no entré en {scene}.',
      'No recuerdo cada minuto de esa noche. Lo que sé es que no entré en {scene}.',
    ],
  },
  'timeline.alone': {
    topic: 'timeline',
    required: [],
    variants: [
      'Es verdad que nadie me vio. Estuve sin compañía todo ese tiempo.',
      'Nadie puede confirmarlo, lo sé. Pero no me moví de allí.',
      'Estaba sin compañía; no tengo testigos que ofrecerle.',
    ],
  },
  'timeline.record': {
    topic: 'timeline',
    required: ['record'],
    variants: [
      'Mi entrada y mi salida constan en {record}.',
      'Compruebe {record}: ahí están las horas a las que entré y salí.',
    ],
  },
  'timeline.pair': {
    topic: 'timeline',
    required: ['guardian'],
    variants: [
      '{Guardian} vigilaba la puerta y puede confirmarlo.',
      'Pregunte a {guardian}: nos vio entrar y salir.',
    ],
  },
  'seen.discovery': {
    topic: 'seen',
    required: ['victim', 'scene', 'time'],
    variants: [
      'Encontré a {victim} en {scene} a las {time} y di la alarma.',
      'A las {time} entré en {scene} y vi a {victim}. Di la alarma enseguida.',
    ],
  },
  'seen.pair': {
    topic: 'seen',
    required: ['place', 'partner'],
    variants: [
      'Estuve en {place} con {partner}. No entró nadie más.',
      'Con {partner}, en {place}. Por esa puerta no pasó nadie más.',
    ],
  },
  'seen.nothing': {
    topic: 'seen',
    required: [],
    variants: [
      'No vi nada fuera de lo normal.',
      'No me fijé en nada extraño, lo siento.',
      'Esa noche no vi nada que me llamara la atención.',
    ],
  },
  'object.own': {
    topic: 'object',
    required: ['item', 'scene'],
    variants: [
      '{Item} es {mine}. {It} perdí esta mañana en {scene}.',
      'Sí, {item} es {mine}. {It} perdí esta mañana en {scene} y no {it} encontraba.',
    ],
  },
  identity: {
    topic: 'identity',
    required: ['name', 'role'],
    variants: ['Me llamo {name}. Soy {role}.', 'Soy {name}, {role}.'],
  },
  social: {
    topic: 'social',
    required: [],
    variants: [
      'Todo esto me inquieta. Pregunte lo que necesite.',
      'No me resulta fácil hablar de esto, pero adelante.',
      'Me cuesta creer lo que ha pasado. ¿Qué quiere saber?',
    ],
  },
  unknown: {
    topic: 'unknown',
    required: [],
    variants: [
      'De eso no sé nada. Pregúnteme por algo concreto.',
      'No sabría qué decirle sobre eso.',
      'No tengo nada que añadir a eso. Si tiene una prueba, enséñemela.',
    ],
  },
};
const placeholder = /\{(\w+)\}/g;
const known = [
  'victim',
  'name',
  'role',
  'place',
  'scene',
  'partner',
  'from',
  'to',
  'time',
  'access',
  'record',
  'guardian',
  'item',
  'mine',
  'it',
];
const base = key => key.charAt(0).toLowerCase() + key.slice(1);
// Why a phrasing cannot be used for a kind of statement, or null if it can.
export function phrasingIssue(kind, text) {
  const spec = statementKinds[kind];
  if (!spec) return 'tipo de declaración desconocido';
  if (typeof text !== 'string' || !text.trim() || text.length > 400) return 'texto vacío o largo';
  if (/[<>]/.test(text)) return 'caracteres no permitidos';
  const used = [...text.matchAll(placeholder)].map(m => base(m[1]));
  const unknown = used.find(key => !known.includes(key));
  if (unknown) return 'marcador desconocido: {' + unknown + '}';
  const missing = spec.required.find(key => !used.includes(key));
  if (missing) return 'falta el marcador {' + missing + '}';
  // Times and places must come from placeholders, never written by hand.
  if (/\d/.test(text.replace(placeholder, ''))) return 'contiene horas o cifras escritas a mano';
  return null;
}
export function fillStatement(text, values) {
  return text.replace(placeholder, (token, key) => {
    const value = values[base(key)];
    if (value === undefined) return token;
    return key === base(key) ? value : value.charAt(0).toLocaleUpperCase('es') + value.slice(1);
  });
}
// Phrasings of a kind for one character: their own voice when it has valid ones,
// otherwise the defaults, in an order that depends on the case.
export function phrasings(kind, voice, random) {
  const own = (voice?.[kind] || []).filter(text => !phrasingIssue(kind, text));
  const list = own.length ? own : statementKinds[kind].variants;
  const order = [...list];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.slice(0, 4);
}
