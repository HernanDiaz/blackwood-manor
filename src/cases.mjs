import {clues as legacyClues,facts as legacyFacts} from './legacy-case.mjs';

const names={elena:'Elena Blackwood',victor:'Víctor Hale',clara:'Clara Reed',arthur:'Arthur Finch',julian:'Julián Blackwood'};
const places={study:'despacho',library:'biblioteca',dining:'comedor',kitchen:'cocina',greenhouse:'invernadero',hall:'vestíbulo'};
const placeLabel=id=>(['library','kitchen'].includes(id)?'la ':'el ')+places[id];
const legacy={id:'bm01',revision:1,title:'El último té',startRoom:'study',brief:'Sir Edmund ha muerto en su despacho.',clues:legacyClues,facts:legacyFacts,
 solution:{person:'victor',weapon:'aconite',room:'study',groups:[['fraud'],['vial','glove'],['tray','appointment','visitor']]},
 ending:'Víctor Hale añadió acónito al té y lo llevó al despacho a las 21:15. Edmund descubrió su fraude y pensaba denunciarlo. El frasco o guante lo vincula al veneno; la bandeja, agenda o registro demuestra su oportunidad.',
 proof:[{id:'fraud',category:'motive',person:'victor'},...['vial','glove'].map(id=>({id,category:'link',person:'victor'})),...['tray','appointment','visitor'].map(id=>({id,category:'opportunity',person:'victor'}))],
 timeline:{drinkAt:'21:15',symptomsAt:'21:25',deathAt:'21:30',room:'study',person:'victor',pairs:[['elena','julian','dining'],['arthur','clara','kitchen']],verifiedBy:['body','visitor','receipt','photo']}};

// Four authored reconstructions. Each retains the same cast and visual objects,
// but owns its timeline, clue meanings, statements and evidence requirements.
const definitions=[
 {id:'bm02',title:'La firma pendiente',killer:'elena',room:'study',claim:'library',claimText:'Estuve sola en la biblioteca de 21:10 a 21:25. No entré en el despacho durante ese intervalo.',weapon:'aconite',pairs:[['victor','julian','dining'],['arthur','clara','kitchen']],motiveId:'will',linkId:'cup',
 motive:'Edmund había firmado una orden para excluir a Elena de la herencia al día siguiente. Elena recibió la notificación y firmó el acuse.',
 secret:'Recibí la notificación: mi padre iba a excluirme de la herencia mañana. Firmé el acuse de recibo.',
 link:'La taza de Edmund contiene acónito. La huella de Elena está superpuesta al residuo del borde interior: manipuló la taza después de contaminarse.',
 access:'Elena retiró la taza de la cocina a las 21:12 y entró con ella al despacho a las 21:15. Edmund la bebió allí.',
 confession:'Elena contaminó la taza y sirvió el té a Edmund en el despacho a las 21:15 para impedir su exclusión de la herencia.'},
 {id:'bm03',title:'La carta retenida',killer:'clara',room:'library',claim:'study',claimText:'Trabajé sola en el despacho de 21:10 a 21:25. No fui a la biblioteca durante ese rato.',weapon:'wine',pairs:[['elena','julian','dining'],['arthur','victor','kitchen']],motiveId:'letter',linkId:'glasses',
 motive:'Carta recibida por Clara: Edmund iba a denunciar mañana las firmas que ella había falsificado en contratos. Clara anotó «no puede salir de esta casa».',
 secret:'Falsifiqué firmas en unos contratos. Edmund lo descubrió y recibí su carta: iba a denunciarme mañana.',
 link:'Solo la copa de Edmund contiene acónito. Una huella de Clara cruza el depósito de veneno en su interior; las otras cinco copas están limpias.',
 access:'Clara retiró una copa de vino a las 21:12 y entró con ella en la biblioteca a las 21:15. Edmund bebió allí.',
 confession:'Clara contaminó el vino y se lo sirvió a Edmund en la biblioteca a las 21:15 para evitar que denunciara sus contratos falsificados.'},
 {id:'bm04',title:'Treinta años de silencio',killer:'arthur',room:'greenhouse',claim:'kitchen',claimText:'No abandoné la cocina entre las 21:10 y las 21:25. Estaba solo atendiendo el servicio.',weapon:'aconite',pairs:[['elena','julian','dining'],['clara','victor','library']],motiveId:'receipt',linkId:'tray',
 motive:'Copia del despido que Arthur recibió y firmó a las 20:45: Edmund había descubierto que desviaba el dinero del servicio y lo denunciaría mañana.',
 secret:'Firmé mi despido a las 20:45. Había desviado dinero del servicio y Edmund iba a denunciarme mañana.',
 link:'La bandeja conserva una gota de concentrado de acónito y, sobre ella, una huella de Arthur. El concentrado se manipuló al servir, después de preparar el té.',
 access:'Arthur llevó la taza al invernadero a las 21:15. Edmund la bebió allí. No hubo otro servicio de té después de las 21:05.',
 confession:'Arthur añadió acónito al servir el té en el invernadero a las 21:15. Quería evitar la denuncia por el dinero desviado del servicio.'},
 {id:'bm05',title:'La deuda vencida',killer:'julian',room:'dining',claim:'greenhouse',claimText:'Me fui al invernadero a las 21:10 y estuve solo allí hasta las 21:25. No regresé al comedor en ese rato.',weapon:'wine',pairs:[['elena','clara','library'],['arthur','victor','kitchen']],motiveId:'argument',linkId:'glasses',
 motive:'Requerimiento recibido y firmado por Julián a las 20:50: Edmund denunciaría mañana la garantía falsificada con la que Julián obtuvo un préstamo.',
 secret:'Falsifiqué la garantía de un préstamo. A las 20:50 firmé el requerimiento de Edmund: iba a denunciarme mañana.',
 link:'Solo la copa de Edmund contiene acónito. Una huella de Julián cruza el depósito de veneno en su interior; las otras cinco copas están limpias.',
 access:'Julián retiró una copa de vino a las 21:12 y volvió al comedor con ella a las 21:15. Edmund bebió allí.',
 confession:'Julián contaminó la copa de vino y se la sirvió a Edmund en el comedor a las 21:15 para impedir la denuncia por su préstamo fraudulento.'}
];

function buildCase(d){
 const person=names[d.killer],room=placeLabel(d.room),tea=d.weapon==='aconite';
 const alibis=Object.fromEntries(d.pairs.flatMap(([a,b,r])=>[
  [a,`Estuve con ${names[b]} en ${placeLabel(r)} de 21:10 a 21:25.`],
  [b,`Estuve con ${names[a]} en ${placeLabel(r)} de 21:10 a 21:25.`]
 ]));
 alibis[d.killer]=d.claimText;
 const motives={
  elena:'Mi padre y yo discrepábamos por la herencia. No quería seguir discutiendo con él.',
  victor:'Edmund me pidió revisar sus cuentas médicas. No había una deuda pendiente.',
  clara:'Mi trabajo dependía de Edmund. Nuestra relación era laboral.',
  arthur:'Llevaba treinta años al servicio de Sir Edmund. Prefería no discutir sus decisiones.',
  julian:'Le debía dinero a mi tío. Discutí con él antes de que terminara la cena.'
 };
 const secrets={
  elena:['Quería que mi padre adelantara parte de la herencia. Le escribí para pedírselo.','will'],
  victor:['Había corregido un error de suma en las cuentas médicas antes de entregarlas.','fraud'],
  clara:['Guardé una carta de solicitud de otro empleo. No se lo había contado a Edmund.','letter'],
  arthur:['Pensaba retirarme y había preparado una solicitud por escrito.','receipt'],
  julian:['Quería vender una joya familiar para pagar mis deudas. Todavía no la había vendido.','argument']
 };
 secrets[d.killer]=[d.secret,d.motiveId];
 const facts=Object.fromEntries(Object.keys(names).map(id=>[id,[['alibi',alibis[id]],['motive',motives[id]],['secret',...secrets[id]]]]));
 // A culprit's account remains a controlled lie until confronted with a trace.
 facts[d.killer].push(['evidence',`La prueba me vincula con la bebida. No puedo mantener que no la manipulé.`,d.linkId],['timeline',`El registro sitúa mi entrada en ${room} a las 21:15. Mi afirmación de haber permanecido en ${placeLabel(d.claim)} era falsa.`,'visitor']);
 facts.arthur.push(['tea',tea?(d.killer==='arthur'?'Preparé el té a las 21:05 y lo llevé al invernadero a las 21:15.':`Preparé el té a las 21:05. ${person} retiró la taza a las 21:12.`):'Preparé el té a las 21:05. La taza quedó sin beber en la cocina; el servicio posterior fue de vino.']);
 const pairEvidence=d.pairs.map(([a,b,r])=>`${names[a]} y ${names[b]} permanecieron en ${placeLabel(r)} de 21:10 a 21:25; ambos firmaron el registro y un testigo del servicio lo confirmó.`);
 const records={
  cup:[tea?d.room:'kitchen','Taza de té',tea?'En el té de Edmund se detecta acónito. Se bebió a las 21:15; los primeros síntomas aparecieron a las 21:25.':'La taza de té quedó sin beber en la cocina. El análisis no detecta veneno.'],
  body:[d.room,'Informe preliminar',`Edmund fue hallado en ${room}. Sin heridas: intoxicación por acónito ingerido a las 21:15. Permaneció en esta habitación hasta su muerte a las 21:30.`],
  will:['study','Documentos de herencia','Solicitud de Elena de un adelanto de herencia. No hay una orden de desheredarla.'],
  appointment:['study','Agenda de Edmund',`21:15, en ${room}: recibir a ${person} para hablar en privado.`],
  fraud:['library','Cuentas médicas','Corrección de una suma, firmada por Víctor y aceptada por Edmund. No hay pagos médicos ficticios.'],
  botany:['library','Tratado de botánica','El acónito puede ingerirse disuelto tanto en té como en vino. Los síntomas tardan unos diez minutos.'],
  letter:['library','Correspondencia de Clara','Solicitud de otro empleo redactada por Clara. Su relación con Edmund era laboral.'],
  glasses:['dining','Copas examinadas',tea?'Las copas de vino no contienen veneno. La bebida contaminada fue el té.':'El vino de la copa de Edmund contiene acónito; las demás copas están limpias.'],
  photo:['dining','Fotografía de sobremesa','Elena y Julián aparecen en el comedor a las 21:00. Esta imagen no demuestra dónde estaban a las 21:15.'],
  argument:['dining','Correspondencia de Julián','Julián debía dinero a Edmund y preparaba la venta de una joya familiar. La venta aún no se había realizado.'],
  tray:['kitchen','Bandeja del servicio',tea?`Arthur preparó el té a las 21:05. ${d.access}`:`La bandeja transportó una copa de vino. ${d.access}`],
  vial:['kitchen','Frasco del botiquín','Concentrado de acónito, guardado en el botiquín común. El frasco no tiene nombre: por sí solo no identifica a quien lo usó.'],
  receipt:['kitchen','Registro del servicio','Solicitud de jubilación de Arthur, todavía sin tramitar. No hay constancia de desvíos de dinero.'],
  plant:['greenhouse','Planta de acónito','La planta está intacta. El análisis identifica el preparado del botiquín como origen del veneno.'],
  glove:['greenhouse','Guante de trabajo','Un guante de Víctor usado para atender una planta antes de la cena. No contiene acónito; no vincula a su dueño con el envenenamiento.'],
  mud:['greenhouse','Registro de movimientos',pairEvidence[0]],
  clock:['hall','Reloj y registro horario',`Reloj verificado: bebida a las 21:15, síntomas a las 21:25 y grito a las 21:30. ${pairEvidence[1]}`],
  visitor:['hall','Registro de acceso',`Un testigo del servicio vio a ${person} entrar en ${room} a las 21:15 con la bebida y salir a las 21:18. Contradice su afirmación de haber permanecido en ${placeLabel(d.claim)}. ${d.access}`]
 };
 records[d.motiveId][2]=d.motive;
 records[d.linkId][2]=d.link;
 const objectIds=['cup','glasses','tray','vial','plant','glove'];
 const clues=Object.entries(records).map(([id,[room,title,text]])=>({id,room,title,text,kind:objectIds.includes(id)?'object':'document'}));
 // Explicit proof metadata drives deduction checks independently of dialogue.
 const proof=[{id:d.motiveId,category:'motive',person:d.killer},{id:d.linkId,category:'link',person:d.killer},{id:'visitor',category:'opportunity',person:d.killer}];
 return {id:d.id,revision:1,title:d.title,startRoom:d.room,brief:`Sir Edmund ha muerto en ${room}.`,clues,facts,proof,
  timeline:{drinkAt:'21:15',symptomsAt:'21:25',deathAt:'21:30',room:d.room,person:d.killer,pairs:d.pairs,verifiedBy:['body','visitor','clock','mud']},
  solution:{person:d.killer,weapon:d.weapon,room:d.room,groups:[[d.motiveId],[d.linkId],['visitor']]},ending:d.confession+' Las coartadas contrastadas descartan a los otros cuatro sospechosos.'};
}
export const cases=[legacy,...definitions.map(buildCase)];
export const LEGACY_CASE_ID='bm01';
export function caseById(id){const c=cases.find(c=>c.id===id);if(!c)throw Error('Variante de caso desconocida');return c;}
export function selectCase(previousCaseId,random=Math.random){
 const pool=cases.filter(c=>c.id!==previousCaseId);
 return pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))].id;
}

// Structural and deduction audit. This cannot replace a human reading the prose.
export function validateCase(c){
 const errors=[],ids=c.clues.map(x=>x.id),cast=Object.keys(names),categories=['motive','link','opportunity'];
 if(ids.length!==18||new Set(ids).size!==18)errors.push('clue-count');
 if(cast.some(p=>!c.facts[p]?.some(f=>f[0]==='alibi')))errors.push('missing-alibi');
 if(c.clues.some(x=>!places[x.room]||!x.text))errors.push('invalid-clue');
 if(Object.keys(places).some(r=>!c.clues.some(x=>x.room===r)))errors.push('unreachable-room');
 for(const facts of Object.values(c.facts)){
  if(new Set(facts.map(f=>f[0])).size!==facts.length)errors.push('duplicate-topic');
  if(facts.some(f=>f[2]&&!ids.includes(f[2])))errors.push('missing-secret-gate');
 }
 if(c.proof.some(p=>!ids.includes(p.id)||!cast.includes(p.person)||!categories.includes(p.category)))errors.push('invalid-proof');
 const candidates=cast.filter(person=>categories.every(category=>c.proof.some(p=>p.person===person&&p.category===category)));
 if(candidates.length!==1||candidates[0]!==c.solution.person)errors.push('ambiguous-deduction');
 for(const [i,category] of categories.entries()){
  if(!c.solution.groups[i]?.length||c.solution.groups[i].some(id=>!c.proof.some(p=>p.id===id&&p.person===c.solution.person&&p.category===category)))errors.push('unsupported-solution');
 }
 const innocents=c.timeline.pairs.flatMap(([a,b])=>[a,b]);
 if(new Set(innocents).size!==4||cast.filter(p=>p!==c.solution.person).some(p=>!innocents.includes(p)))errors.push('incomplete-exoneration');
 if(c.timeline.pairs.some(([a,b,r])=>a===b||r===c.solution.room||!places[r]))errors.push('contradictory-alibis');
 if(c.timeline.person!==c.solution.person||c.timeline.room!==c.solution.room||c.timeline.verifiedBy.some(id=>!ids.includes(id)))errors.push('invalid-timeline');
 return errors;
}
