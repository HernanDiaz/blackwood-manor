// Fictional mystery design rules, not real-world forensic or technical guidance.
// Methods describe the committed act; pre-set traps and remote attacks are outside
// this pilot's same-time alibi model and must not be introduced by prose.
export const settings = {
  noir: {
    name: 'Años 30',
    capabilities: ['ordinary-tools', 'ballistics', 'medicine'],
    roomTags: ['interior'],
  },
  medieval: {
    name: 'Medieval',
    capabilities: ['ordinary-tools', 'medieval-weapons'],
    roomTags: ['interior'],
  },
  fantasy: {
    name: 'Fantasía',
    capabilities: ['ordinary-tools', 'medieval-weapons', 'magic'],
    roomTags: ['interior'],
  },
  scifi: {
    name: 'Ciencia ficción',
    capabilities: [
      'ordinary-tools',
      'ballistics',
      'medicine',
      'life-support',
      'energy-tech',
      'robotics',
      'cryotech',
    ],
    roomTags: ['interior'],
  },
};
const all = Object.keys(settings);
const objects = {
  knife: 'dagger',
  blunt: 'heavy metal paperweight',
  rope: 'braided cord',
  drink: 'goblet',
  revolver: 'vintage revolver',
  shotgun: 'hunting shotgun',
  medicine: 'sealed medicine bottle',
  sword: 'sword',
  crossbow: 'crossbow',
  fall: 'balcony railing',
  artifact: 'rune amulet',
  alchemy: 'alchemy vial',
  air: 'air regulator module',
  medical: 'sealed medical capsule',
  power: 'portable power panel',
  laser: 'fictional laser emitter',
  plasma: 'fictional plasma weapon',
  robot: 'industrial robot control console',
  hatch: 'industrial hatch controller',
  cryo: 'cryogenic capsule panel',
};
const definition = (
  id,
  name,
  object,
  family,
  eras,
  capabilities,
  roomTags,
  finding,
  trace,
  delay = 0,
) => ({
  id,
  name,
  object,
  family,
  settings: eras,
  capabilities,
  roomTags,
  finding,
  trace,
  delayMinutes: delay,
  requiresPresence: true,
  imagePrompt: 'a single ' + objects[id] + ', isolated object, no people',
});
export const methodCatalog = [
  definition(
    'knife',
    'Arma blanca',
    'daga',
    'blade',
    all,
    ['ordinary-tools'],
    [],
    'El informe describe una herida compatible con el arma blanca examinada.',
    'fragmento del arma y rastro del portador',
  ),
  definition(
    'blunt',
    'Golpe con objeto pesado',
    'pisapapeles metálico',
    'impact',
    all,
    ['ordinary-tools'],
    [],
    'El informe describe un impacto compatible con el objeto pesado examinado.',
    'fragmento material coincidente con el objeto',
  ),
  definition(
    'rope',
    'Estrangulación',
    'cordón trenzado',
    'asphyxia',
    all,
    ['ordinary-tools'],
    [],
    'El informe del caso atribuye la muerte al cordón examinado.',
    'fibra del cordón vinculada a la escena',
  ),
  definition(
    'drink',
    'Veneno en una bebida',
    'copa contaminada',
    'poison',
    all,
    ['ordinary-tools'],
    [],
    'El análisis ficticio del caso identifica la bebida como vehículo del veneno.',
    'residuo de la bebida y recipiente manipulado',
    10,
  ),
  definition(
    'revolver',
    'Disparo de revólver',
    'revólver',
    'ballistic',
    ['noir', 'scifi'],
    ['ballistics'],
    [],
    'El informe vincula el proyectil con el revólver examinado.',
    'proyectil y registro del arma',
  ),
  definition(
    'shotgun',
    'Disparo de escopeta',
    'escopeta de caza',
    'ballistic',
    ['noir'],
    ['ballistics'],
    [],
    'El informe del caso identifica el arma de caza como causa de la muerte.',
    'resto del disparo y arma recuperada',
  ),
  definition(
    'medicine',
    'Preparado medicinal ficticio',
    'frasco medicinal alterado',
    'poison',
    ['noir', 'scifi'],
    ['medicine'],
    [],
    'El informe ficticio vincula el preparado alterado con la muerte.',
    'precinto del preparado manipulado',
    10,
  ),
  definition(
    'sword',
    'Ataque con espada',
    'espada',
    'blade',
    ['medieval', 'fantasy'],
    ['medieval-weapons'],
    [],
    'El informe del caso describe una herida compatible con la espada recuperada.',
    'fragmento de la hoja coincidente con la escena',
  ),
  definition(
    'crossbow',
    'Disparo de ballesta',
    'ballesta',
    'projectile',
    ['medieval', 'fantasy'],
    ['medieval-weapons'],
    [],
    'El informe del caso vincula el virote recuperado con la ballesta.',
    'virote y marca del arma',
  ),
  definition(
    'fall',
    'Caída provocada',
    'barandilla de una galería elevada',
    'fall',
    all,
    ['ordinary-tools'],
    ['elevated'],
    'El informe y el registro de la escena establecen una caída provocada durante el intervalo del crimen.',
    'registro de la galería que sitúa al agresor',
  ),
  definition(
    'artifact',
    'Activación de un artefacto encantado',
    'amuleto rúnico',
    'arcane',
    ['fantasy'],
    ['magic'],
    [],
    'La regla mágica del caso vincula la activación presencial del amuleto con la muerte.',
    'firma arcana del portador en el artefacto',
  ),
  definition(
    'alchemy',
    'Preparado alquímico ficticio',
    'vial alquímico',
    'poison',
    ['fantasy'],
    ['magic'],
    [],
    'El análisis mágico ficticio identifica el preparado usado en el crimen.',
    'residuo alquímico y vial manipulado',
    10,
  ),
  definition(
    'air',
    'Sabotaje del regulador ambiental',
    'módulo del regulador ambiental',
    'environment',
    ['scifi'],
    ['life-support'],
    ['life-support'],
    'El registro ambiental vincula la alteración del regulador con la muerte.',
    'registro de la apertura no autorizada del regulador',
    10,
  ),
  definition(
    'medical',
    'Cápsula médica ficticia alterada',
    'cápsula de tratamiento sellada',
    'poison',
    ['scifi'],
    ['medicine'],
    [],
    'El análisis ficticio del caso vincula la cápsula manipulada con la muerte.',
    'precinto de la cápsula manipulado',
    10,
  ),
  definition(
    'power',
    'Sabotaje de un panel energético ficticio',
    'panel portátil de energía',
    'energy',
    ['scifi'],
    ['energy-tech'],
    [],
    'El registro del panel confirma una intervención presencial causante de la muerte.',
    'sello del panel manipulado',
  ),
  definition(
    'laser',
    'Disparo de emisor láser ficticio',
    'emisor láser',
    'energy',
    ['scifi'],
    ['energy-tech'],
    [],
    'El informe ficticio relaciona la descarga con el emisor recuperado.',
    'firma de descarga y emisor identificado',
  ),
  definition(
    'plasma',
    'Disparo de arma de plasma ficticia',
    'arma de plasma',
    'energy',
    ['scifi'],
    ['energy-tech'],
    [],
    'El informe ficticio relaciona la descarga con el arma recuperada.',
    'firma de descarga y arma identificada',
  ),
  definition(
    'robot',
    'Intervención de un brazo robótico',
    'consola de un brazo industrial',
    'impact',
    ['scifi'],
    ['robotics'],
    ['industrial'],
    'El registro del caso atribuye la muerte a una orden presencial emitida al brazo robótico.',
    'orden de la consola y registro del operador',
  ),
  definition(
    'hatch',
    'Accionamiento de una compuerta industrial',
    'mando de compuerta',
    'mechanical',
    ['scifi'],
    ['energy-tech'],
    ['industrial'],
    'El registro mecánico vincula la intervención presencial sobre la compuerta con la muerte.',
    'registro del mando y del operador',
  ),
  definition(
    'cryo',
    'Manipulación de una cápsula criogénica',
    'panel de cápsula criogénica',
    'environment',
    ['scifi'],
    ['cryotech'],
    ['cryogenic'],
    'El informe ficticio y el registro de la cápsula vinculan su manipulación con la muerte.',
    'sello de la cápsula y registro de acceso',
    10,
  ),
];
export function compatibleMethods(
  setting,
  { capabilities = settings[setting]?.capabilities, roomTags = settings[setting]?.roomTags } = {},
) {
  if (!settings[setting]) throw Error('Ambientación desconocida');
  return methodCatalog.filter(
    m =>
      m.settings.includes(setting) &&
      m.capabilities.every(c => capabilities.includes(c)) &&
      m.roomTags.every(tag => roomTags.includes(tag)),
  );
}
export function methodRoomPairs(setting, rooms, capabilities = settings[setting]?.capabilities) {
  return rooms.flatMap(room =>
    compatibleMethods(setting, { capabilities, roomTags: room.tags || [] }).map(method => ({
      id: method.id + '@' + room.id,
      methodId: method.id,
      roomId: room.id,
    })),
  );
}
export function chooseMethod(setting, context = {}, previousId, random = Math.random) {
  let pool = compatibleMethods(setting, context);
  const previous = methodCatalog.find(m => m.id === previousId);
  if (!pool.length) throw Error('No hay métodos compatibles con esta escena');
  const differentFamily = previous ? pool.filter(m => m.family !== previous.family) : pool;
  if (differentFamily.length) pool = differentFamily;
  else if (pool.some(m => m.id !== previousId)) pool = pool.filter(m => m.id !== previousId);
  return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))];
}
export function methodEvidence(method, person, time) {
  return `${method.finding} La prueba material registra ${method.trace}. Una prueba independiente identifica a ${person} usando el objeto «${method.object}» en la escena a las ${time}; no se trata únicamente de que sea su propietario.`;
}
export function methodTiming(method, crimeMinute) {
  const deathMinute = crimeMinute + Math.max(1, method.delayMinutes);
  if (!Number.isInteger(crimeMinute) || crimeMinute < 10 || deathMinute >= 1439)
    throw Error('Horario incompatible con el método');
  return { crimeMinute, deathMinute, windowStart: crimeMinute - 10, windowEnd: deathMinute + 1 };
}
// Names shown to the player. The catalog names above keep "ficticio" as a design note and are
// part of old saves, so they are not changed; the interface uses these instead.
const labels = {
  knife: 'Arma blanca',
  blunt: 'Golpe con un objeto pesado',
  rope: 'Estrangulación',
  drink: 'Veneno en una bebida',
  revolver: 'Disparo de revólver',
  shotgun: 'Disparo de escopeta',
  medicine: 'Medicamento alterado',
  sword: 'Espada',
  crossbow: 'Ballesta',
  fall: 'Caída provocada',
  artifact: 'Artefacto encantado',
  alchemy: 'Preparado alquímico',
  air: 'Sabotaje del regulador de aire',
  medical: 'Cápsula médica alterada',
  power: 'Descarga de un panel de energía',
  laser: 'Disparo láser',
  plasma: 'Disparo de plasma',
  robot: 'Brazo robótico',
  hatch: 'Compuerta industrial',
  cryo: 'Cápsula criogénica alterada',
};
export const methodLabel = id => labels[id] || methodCatalog.find(m => m.id === id)?.name || id;
