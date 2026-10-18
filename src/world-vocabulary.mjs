// Closed vocabularies for the free-text world generator. The model chooses from these lists
// whenever the answer is known in advance (occupation, valuable resource, kind of room), so
// a small model cannot invent "Pajot" as a job or copy "mineral" from an example.
const both = (...pairs) => pairs.flatMap(p => p.split('/'));
const preindustrialPairs = [
  'abad/abadesa',
  'monje/monja',
  'novicio/novicia',
  'copista',
  'escribano/escribana',
  'sanador/sanadora',
  'curandero/curandera',
  'boticario/boticaria',
  'herbolario/herbolaria',
  'cocinero/cocinera',
  'cillerero/cillerera',
  'mayordomo/mayordoma',
  'guardia',
  'capitán de la guardia/capitana de la guardia',
  'soldado',
  'caballero/dama',
  'castellano/castellana',
  'herrero/herrera',
  'carpintero/carpintera',
  'cantero/cantera',
  'minero/minera',
  'capataz/capataza',
  'mercader',
  'posadero/posadera',
  'juglar',
  'mensajero/mensajera',
  'peregrino/peregrina',
  'cazador/cazadora',
  'pastor/pastora',
  'tejedor/tejedora',
  'sacerdote',
  'bibliotecario/bibliotecaria',
  'administrador/administradora',
  'criado/criada',
  'noble',
];
const preindustrial = both(...preindustrialPairs);
const magicalPairs = [
  'mago/maga',
  'hechicero/hechicera',
  'druida',
  'alquimista',
  'guardián del bosque/guardiana del bosque',
  'emisario feérico/emisaria feérica',
  'archivero real/archivera real',
  'caballero del reino/dama del reino',
  'oráculo',
];
const magical = both(...magicalPairs);
const industrialPairs = [
  'anfitrión/anfitriona',
  'periodista',
  'médico/médica',
  'chófer',
  'cantante',
  'abogado/abogada',
  'banquero/banquera',
  'mayordomo/ama de llaves',
  'cocinero/cocinera',
  'detective',
  'actor/actriz',
  'inventor/inventora',
  'ingeniero/ingeniera',
  'enfermero/enfermera',
  'secretario/secretaria',
  'contable',
  'profesor/profesora',
  'fotógrafo/fotógrafa',
  'aviador/aviadora',
  'heredero/heredera',
  'capitán/capitana',
  'sacerdote',
  'monje/monja',
  'obrero/obrera',
  'capataz/capataza',
  'minero/minera',
  'comerciante',
];
const industrial = both(...industrialPairs);
const futuristicPairs = [
  'piloto',
  'ingeniero/ingeniera',
  'médico/médica',
  'botánico/botánica',
  'mecánico/mecánica',
  'responsable de comunicaciones',
  'comandante',
  'geólogo/geóloga',
  'químico/química',
  'técnico de soporte vital/técnica de soporte vital',
  'oficial de seguridad',
  'analista de datos',
  'minero/minera',
  'cocinero/cocinera',
  'enfermero/enfermera',
  'biólogo/bióloga',
  'navegante',
  'programador/programadora',
  'administrador/administradora',
  'astrónomo/astrónoma',
];
const futuristic = both(...futuristicPairs);
export function roleChoices(technology, magic) {
  return technology === 'futuristic'
    ? futuristic
    : technology === 'industrial'
      ? industrial
      : magic
        ? [...preindustrial, ...magical]
        : preindustrial;
}
export const resources = {
  preindustrial: [
    'grano',
    'vino',
    'sal',
    'lana',
    'plata',
    'hierro',
    'madera',
    'ganado',
    'especias',
    'aceite',
    'cera',
    'manuscritos',
    'medicinas',
    'oro',
  ],
  industrial: [
    'dinero',
    'acciones',
    'joyas',
    'combustible',
    'medicamentos',
    'obras de arte',
    'contratos',
    'tierras',
  ],
  futuristic: [
    'oxígeno',
    'agua',
    'combustible',
    'mineral',
    'energía',
    'alimentos',
    'medicamentos',
    'datos',
  ],
};
export const allResources = [...new Set(Object.values(resources).flat())];
// Room name nouns for each function, with the article used in prose.
export const roomKinds = [
  {
    function: 'workshop or control room',
    kinds: {
      Taller: 'el',
      'Sala de control': 'la',
      Forja: 'la',
      'Sala de máquinas': 'la',
      Obrador: 'el',
      Laboratorio: 'el',
      'Puente de mando': 'el',
    },
  },
  {
    function: 'supply storage',
    kinds: {
      Almacén: 'el',
      Despensa: 'la',
      Bodega: 'la',
      Granero: 'el',
      Depósito: 'el',
      'Bodega de carga': 'la',
    },
  },
  {
    function: 'medical care',
    kinds: { Enfermería: 'la', Botica: 'la', 'Sala de curas': 'la', Dispensario: 'el' },
  },
  {
    function: 'dining',
    kinds: {
      Comedor: 'el',
      Refectorio: 'el',
      Cocina: 'la',
      'Sala de banquetes': 'la',
      Cantina: 'la',
    },
  },
  {
    function: 'archive',
    kinds: {
      Archivo: 'el',
      Biblioteca: 'la',
      Scriptorium: 'el',
      'Sala de registros': 'la',
      'Sala de mapas': 'la',
    },
  },
  {
    function: 'sleeping quarters',
    kinds: {
      Dormitorio: 'el',
      Celdas: 'las',
      Aposentos: 'los',
      'Cuarto de huéspedes': 'el',
      Camarote: 'el',
      'Habitación de invitados': 'la',
    },
  },
];
const words = text =>
  text
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .match(/[a-z]+/g) || [];
const pairs = text => {
  const w = words(text);
  return w.slice(1).map((x, i) => w[i] + ' ' + x);
};
// A display field that repeats two consecutive words of the instructions is a copied
// placeholder ("Spanish name", "max 20 words"), whatever the exact wording.
export function echoedInstruction(value, instructions) {
  const known = new Set(pairs(instructions));
  return pairs(value).find(pair => known.has(pair)) || null;
}
// Room kinds that only make sense with some technology levels.
const kindEras = {
  'Sala de control': ['industrial', 'futuristic'],
  'Sala de máquinas': ['industrial', 'futuristic'],
  Laboratorio: ['industrial', 'futuristic'],
  'Puente de mando': ['futuristic'],
  'Bodega de carga': ['futuristic'],
  Cantina: ['industrial', 'futuristic'],
  Camarote: ['futuristic'],
  Forja: ['preindustrial', 'industrial'],
  Obrador: ['preindustrial', 'industrial'],
  Granero: ['preindustrial'],
  Botica: ['preindustrial'],
  Refectorio: ['preindustrial'],
  Scriptorium: ['preindustrial'],
  Celdas: ['preindustrial'],
  Aposentos: ['preindustrial', 'industrial'],
};
export function roomKindsFor(index, technology) {
  return Object.fromEntries(
    Object.entries(roomKinds[index].kinds).filter(
      ([kind]) => !kindEras[kind] || kindEras[kind].includes(technology),
    ),
  );
}

// Grammatical gender of each occupation: "a/b" pairs list the masculine form first.
export function roleGender(role, technology, magic) {
  const source =
    technology === 'futuristic'
      ? futuristicPairs
      : technology === 'industrial'
        ? industrialPairs
        : magic
          ? [...preindustrialPairs, ...magicalPairs]
          : preindustrialPairs;
  for (const pair of source) {
    const forms = pair.split('/');
    if (forms.length === 2 && forms[0] === role) return 'masculino';
    if (forms.length === 2 && forms[1] === role) return 'femenino';
    if (forms.length === 1 && forms[0] === role) return 'común';
  }
  return null;
}
// The form of an occupation that agrees with the gender ("monja" for a man -> "monje").
export function roleForGender(role, gender) {
  const pair = [...preindustrialPairs, ...magicalPairs, ...industrialPairs, ...futuristicPairs]
    .map(p => p.split('/'))
    .find(forms => forms.includes(role));
  if (!pair || pair.length === 1) return role;
  return gender === 'femenino' ? pair[1] : pair[0];
}
// Both forms of an occupation, so using one rules out the other.
export function roleForms(role) {
  return (
    [...preindustrialPairs, ...magicalPairs, ...industrialPairs, ...futuristicPairs]
      .map(p => p.split('/'))
      .find(forms => forms.includes(role)) || [role]
  );
}
// Character traits in both genders; the generator picks two and agrees them.
export const traits = [
  'serio/seria',
  'reservado/reservada',
  'observador/observadora',
  'tranquilo/tranquila',
  'impaciente',
  'desconfiado/desconfiada',
  'amable',
  'orgulloso/orgullosa',
  'nervioso/nerviosa',
  'astuto/astuta',
  'leal',
  'ambicioso/ambiciosa',
  'meticuloso/meticulosa',
  'irónico/irónica',
  'tímido/tímida',
  'franco/franca',
  'rencoroso/rencorosa',
  'piadoso/piadosa',
  'curioso/curiosa',
  'severo/severa',
  'alegre',
  'calculador/calculadora',
  'testarudo/testaruda',
  'generoso/generosa',
];
export const traitChoices = traits.map(t => t.split('/')[0]);
export function personality(chosen, gender) {
  const words = chosen.map(t => {
    const forms = traits.find(x => x.split('/')[0] === t).split('/');
    return gender === 'femenino' && forms[1] ? forms[1] : forms[0];
  });
  const text = words.slice(0, -1).join(', ') + ' y ' + words.at(-1);
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1);
}
// What each kind of room contains, so descriptions are coherent even when the model is not.
const roomContents = {
  Taller: 'Bancos de trabajo, herramientas colgadas de la pared y piezas a medio reparar',
  'Sala de control': 'Paneles de mandos, indicadores y una mesa con registros de turno',
  Forja: 'Un yunque, un fuelle y herramientas de hierro junto al fuego',
  'Sala de máquinas': 'Motores, tuberías y manómetros que vibran sin descanso',
  Obrador: 'Mesas de trabajo, moldes y sacos de materiales apilados',
  Laboratorio: 'Mesas con instrumentos, frascos etiquetados y cuadernos de notas',
  'Puente de mando': 'Puestos de navegación, pantallas y el asiento del mando',
  Almacén: 'Estanterías con cajas, sacos y un inventario clavado en la puerta',
  Despensa: 'Sacos de provisiones, tarros y estantes con conservas',
  Bodega: 'Barriles, cajas apiladas y un aire fresco que huele a humedad',
  Granero: 'Montones de grano, sacos y herramientas de labranza',
  Depósito: 'Cajas numeradas, estanterías altas y un registro de entradas',
  'Bodega de carga': 'Contenedores sujetos con correas y una grúa de carga',
  Enfermería: 'Camas estrechas, vendas limpias y un armario de remedios',
  Botica: 'Frascos de hierbas secas, morteros y una balanza de precisión',
  'Sala de curas': 'Una camilla, vendas, palanganas y un armario de remedios',
  Dispensario: 'Un mostrador, frascos ordenados y un libro de entregas',
  Comedor: 'Una mesa larga, sillas y un aparador con vajilla',
  Refectorio: 'Mesas largas de madera, bancos y un atril para las lecturas',
  Cocina: 'Fogones, ollas colgadas y una mesa para preparar la comida',
  'Sala de banquetes': 'Una mesa larga con mantel, candelabros y sillas tapizadas',
  Cantina: 'Mesas pequeñas, una barra y una cafetera siempre encendida',
  Archivo: 'Estanterías de legajos, cajas rotuladas y una mesa de consulta',
  Biblioteca: 'Estanterías de libros, una mesa de lectura y una escalera de mano',
  Scriptorium: 'Atriles, pergaminos, tinteros y plumas sobre las mesas',
  'Sala de registros': 'Ficheros, libros de registro y una mesa con sellos',
  'Sala de mapas': 'Mapas extendidos sobre una gran mesa y cartas enrolladas',
  Dormitorio: 'Camas en fila, arcones y ropa doblada',
  Celdas: 'Celdas pequeñas con un catre, una manta y un taburete',
  Aposentos: 'Una cama amplia, un arcón y un escritorio personal',
  'Cuarto de huéspedes': 'Dos camas hechas, un armario y una jofaina',
  Camarote: 'Literas plegables, taquillas y un ojo de buey',
  'Habitación de invitados': 'Una cama con dosel, un tocador y un sillón',
};
const light = {
  preindustrial: 'a la luz de las velas',
  industrial: 'bajo una lámpara eléctrica',
  futuristic: 'bajo paneles de luz blanca',
};
export function roomDescription(kind, technology) {
  return roomContents[kind] + ', ' + light[technology] + '.';
}
const romanValue = roman =>
  [...roman.toUpperCase()].reduce((total, letter, i, all) => {
    const value = { I: 1, V: 5, X: 10, L: 50 }[letter],
      next = { I: 1, V: 5, X: 10, L: 50 }[all[i + 1]] || 0;
    return total + (value < next ? -value : value);
  }, 0);
// The technology level when the request makes it evident, or null to let the model decide.
// A small model ignores repeated corrections ("a Mars colony needs futuristic technology"),
// so evident cases are fixed in the schema instead of being retried.
export function technologyFromRequest(description) {
  const text = description.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (
    /\b(marte|mars|venus|jupiter|saturno|planeta|planetaria|espacial|espacio exterior|nave (espacial|estelar)|orbital|galaxia|asteroide|base lunar|colonia lunar|en la luna|androide|cibernetic|cyberpunk|futur)/.test(
      text,
    )
  )
    return 'futuristic';
  const year = Number(text.match(/\b(1[0-9]\d\d|2[0-9]\d\d)\b/)?.[1]);
  if (year) return year < 1780 ? 'preindustrial' : year < 2050 ? 'industrial' : 'futuristic';
  const century = text.match(/\bsiglo ([ivxl]+)\b/)?.[1];
  if (century) {
    const n = romanValue(century);
    return n <= 18 ? 'preindustrial' : n <= 21 ? 'industrial' : 'futuristic';
  }
  if (
    /\b(medieval|edad media|feudal|castillo|caballeros|vikingo|romano|antigua grecia)\b/.test(text)
  )
    return 'preindustrial';
  if (
    /\b(victorian|anos (20|30|40|50|60|70|80|90)|ferrocarril|vapor|electricidad|automovil|telegrafo)\b/.test(
      text,
    )
  )
    return 'industrial';
  return null;
}
