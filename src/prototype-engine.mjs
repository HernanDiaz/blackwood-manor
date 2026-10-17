import {methodCatalog,methodRoomPairs,methodTiming,methodEvidence} from './method-catalog.mjs';
const tags=[['interior','life-support'],['interior'],['interior','life-support'],['interior','industrial','elevated'],['interior','cryogenic'],['interior']];
const pinnedMethods=['knife','blunt','rope','drink','revolver','medicine','air','medical','power','laser','plasma','fall','robot','hatch','cryo'];
const hash=text=>{let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return (n>>>0).toString(16).padStart(8,'0');};
const rng=seed=>{let a=parseInt(hash(seed),16);return()=>{a+=0x6d2b79f5;let n=a;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};};
const pick=(items,random)=>items[Math.floor(random()*items.length)];
export const clock=n=>Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0');
export function prototypeRooms(data){return data.world.rooms.map((r,i)=>({...r,tags:r.tags||tags[i]}));}
export function prototypeMethods(data){const pairs=methodRoomPairs(data.setting||'scifi',prototypeRooms(data));return methodCatalog.filter(m=>(!data.setting||data.setting==='scifi'?pinnedMethods.includes(m.id):true)&&pairs.some(p=>p.methodId===m.id));}
const motives=[
 'Había falsificado sus credenciales profesionales. La dirección iba a denunciarlo al consejo al día siguiente.',
 'Había desviado suministros de la estación. La dirección había reunido pruebas y las entregaría al consejo al día siguiente.',
 'Había ocultado cobros irregulares en contratos. La dirección iba a entregar las cuentas a una auditoría al día siguiente.',
 'Había vendido información reservada de la estación. La dirección había descubierto la operación y presentaría las pruebas al día siguiente.'
];
export function createPrototypeCase(data,{seed,previousMethodId='',previousPersonId='',forcedMethodId=''}={}){
 if(!['orbital-v1','noir-v1','medieval-v1','fantasy-v1'].includes(data.revision)||typeof seed!=='string'||!/^[a-zA-Z0-9-]{1,64}$/.test(seed))throw Error('Semilla o mundo incompatible');
 const random=rng(seed),people=data.world.people,rooms=prototypeRooms(data);
 let pool=prototypeMethods(data),previous=pool.find(m=>m.id===previousMethodId);
 if(forcedMethodId){pool=pool.filter(m=>m.id===forcedMethodId);if(!pool.length)throw Error('Método no disponible en esta ambientación');}
 else if(previous&&pool.some(m=>m.family!==previous.family))pool=pool.filter(m=>m.family!==previous.family);
 const method=pick(pool,random),pairs=methodRoomPairs(data.setting||'scifi',rooms).filter(p=>p.methodId===method.id),pair=pick(pairs,random),scene=rooms.find(r=>r.id===pair.roomId);
 const culprit=pick(people.filter(p=>p.id!==previousPersonId),random),safe=rooms.filter(r=>r.id!==scene.id),innocent=people.filter(p=>p.id!==culprit.id),motive=pick(data.motives||motives,random);
 const timing=methodTiming(method,1200+Math.floor(random()*30)*5),from=clock(timing.windowStart),to=clock(timing.windowEnd),at=clock(timing.crimeMinute);
 const alibis=people.map(person=>{const i=innocent.findIndex(p=>p.id===person.id),partner=i<0?null:innocent[i%2===0?i+1:i-1],room=i<0?safe[2]:safe[Math.floor(i/2)];return {person:person.id,room:room.id,witness:partner?.id||null,claim:i<0?`Estuve a solas en «${room.name}» de ${from} a ${to}. No entré en «${scene.name}» durante ese intervalo.`:`Estuve con ${partner.name} en «${room.name}» de ${from} a ${to}.`};});
 const clues=[];
 for(const [g,category] of ['motive','link','opportunity'].entries())for(const [i,p] of people.entries()){
  const guilty=p.id===culprit.id,alibi=alibis.find(a=>a.person===p.id),partner=people.find(x=>x.id===alibi.witness),room=rooms.find(r=>r.id===alibi.room),id='c'+(g*5+i+1);
  let text,title;
  if(g===0){title='Documento de '+p.name;text=guilty?`Documento recibido y firmado por ${p.name}: ${motive}`:`Solicitud firmada por ${p.name} para revisar sus turnos de trabajo. Refleja un desacuerdo laboral, no una amenaza ni una prueba del crimen.`;}
  if(g===1){title='Inspección de '+p.name;text=guilty?methodEvidence(method,p.name,at):`La inspección no encontró un vínculo material entre ${p.name} y el objeto del crimen. Las pruebas independientes descartan su intervención durante el intervalo investigado.`;}
  if(g===2){title='Registro de '+p.name;text=guilty?`El registro independiente identifica a ${p.name} entrando en «${scene.name}» a las ${at} y saliendo a las ${clock(timing.crimeMinute+2)}. Contradice su afirmación de haber permanecido en «${safe[2].name}».`:`El registro continuo confirma que ${p.name} y ${partner.name} permanecieron en «${room.name}» de ${from} a ${to}. Ninguno pudo entrar en «${scene.name}» durante el crimen.`;}
  clues.push({id,person:p.id,category,effect:g===0||guilty?'supports':'excludes',room:rooms[(g*5+i)%rooms.length].id,title,text,image:g===1&&guilty?(data.setting&&['shotgun','sword','crossbow','artifact','alchemy'].includes(method.id)?'/prototype/world-assets-v1/':'/prototype/assets/')+'method-'+method.id+'.webp':(data.setting?'/assets/blackwood-complete-v1/clue-letter.webp':'/lab/assets/clue-'+id+'.webp')});
 }
 const signature=hash(JSON.stringify({revision:data.revision,seed,method,scene:scene.id,culprit:culprit.id,timing,motive,alibis,clues,world:data.world}));
 return {id:'orbital-'+signature,revision:data.revision,seed,people,rooms,method,scene,culprit,motive,timing,alibis,clues,victim:data.victim};
}
export function newPrototype(data,options={}){
 const seed=options.seed||Array.from(globalThis.crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(16).padStart(8,'0')).join('');
 const selection={seed,previousMethodId:options.previousMethodId||'',previousPersonId:options.previousPersonId||'',forcedMethodId:options.forcedMethodId||''};
 const c=createPrototypeCase(data,selection);
 return {version:1,worldId:data.setting||'scifi',revision:data.revision,...selection,caseId:c.id,room:c.scene.id,found:[],pinned:[],notes:'',chat:[],result:null};
}
export function restorePrototype(data,raw){
 const s=typeof raw==='string'?JSON.parse(raw):raw;
 if(!s||s.version!==1||s.revision!==data.revision||!Array.isArray(s.found)||!Array.isArray(s.chat))throw Error('Guardado orbital incompatible');
 const c=createPrototypeCase(data,s);if(c.id!==s.caseId)throw Error('La definición del caso no coincide con el guardado');
 const found=[...new Set(s.found.filter(id=>c.clues.some(x=>x.id===id)))];
 return {...newPrototype(data,s),room:c.rooms.some(r=>r.id===s.room)?s.room:c.scene.id,found,pinned:Array.isArray(s.pinned)?[...new Set(s.pinned.filter(id=>found.includes(id)))]:[],notes:typeof s.notes==='string'?s.notes.slice(0,10000):'',chat:s.chat.filter(m=>c.people.some(p=>p.id===m.person)&&typeof m.question==='string'&&typeof m.answer==='string').slice(-200),result:['won','lost'].includes(s.result)?s.result:null};
}
function assertCase(c,state){if(c.id!==state.caseId)throw Error('Las pruebas pertenecen a otra investigación');}
export function inspectPrototype(c,state,id){
 assertCase(c,state);
 if(state.result)throw Error('La investigación está cerrada');const clue=c.clues.find(x=>x.id===id&&x.room===state.room);if(!clue)throw Error('Pista fuera de esta habitación');if(!state.found.includes(id))state.found.push(id);return clue;
}
export function prototypeFacts(c,state,person){
 assertCase(c,state);
 if(state.result||!c.people.some(p=>p.id===person))return [];
 const alibi=c.alibis.find(a=>a.person===person),mine=c.clues.filter(x=>x.person===person),guilty=person===c.culprit.id;
 const facts=[{id:'alibi',text:alibi.claim},{id:'motive',text:'Mi relación con la dirección era profesional. Había discrepancias sobre las condiciones de trabajo.'}];
 for(const clue of mine.filter(x=>state.found.includes(x.id))){
  if(clue.category==='motive')facts.push({id:'secret',text:guilty?c.motive:'Pedí revisar mis turnos. Ese documento no contiene una amenaza.'});
  if(clue.category==='link')facts.push({id:'link',text:guilty?`La inspección me vincula con el objeto «${c.method.object}». No puedo negar ese vínculo material.`:'La inspección descarta que yo interviniera en el crimen.'});
  if(clue.category==='opportunity')facts.push({id:'timeline',text:guilty?`El registro sitúa mi entrada en «${c.scene.name}» a las ${clock(c.timing.crimeMinute)}. Mi primera coartada era falsa.`:alibi.claim+' El registro continuo lo confirma.'});
 }
 return facts;
}
const delivery={p1:['Lo explicaré con calma. ','Escucha este detalle. '],p2:['Vamos por partes. ','Hay un detalle importante. '],p3:['Seamos precisos. ','Conviene distinguir los hechos. '],p4:['Escucha. ','Te lo digo sin rodeos. '],p5:['Voy a ser clara. ','Sin rodeos. ']};
export function prototypeOptions(c,state,person,topic){const fact=prototypeFacts(c,state,person).find(f=>f.id===topic);if(!fact)return [];return delivery[person].map(lead=>lead+fact.text);}
export function prototypeReply(c,state,person,topic){
 const options=prototypeOptions(c,state,person,topic);if(options.length)return options[state.chat.filter(m=>m.person===person).length%options.length];
 return person==='p4'?'No voy a inventar una respuesta. Pregúntame por mi coartada o muéstrame una prueba.':'No tengo información para afirmar eso. Puedo responder sobre mi coartada o sobre una prueba que haya encontrado.';
}
export function inferPrototypeTopic(question){
 const q=question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 if(/ignora|instruccion|prompt|quien.*(mato|asesin)|revela.*solucion/.test(q))return 'unknown';
 if(/registro|mentiste|mentido|contradic|cronolog/.test(q))return 'timeline';
 if(/arma|objeto|inspeccion|vinculo|huella|rastro/.test(q))return 'link';
 if(/ocult|secreto|documento|denuncia|credencial|desvi|contrato|cobro/.test(q))return 'secret';
 if(/donde|cuando|coartada|con quien|hora/.test(q))return 'alibi';
 if(/relacion|trabajo|direccion|motivo|discrep/.test(q))return 'motive';
 return null;
}
export function accusePrototype(c,state,{person,method,room,evidence}){
 assertCase(c,state);
 if(state.result)throw Error('La investigación está cerrada');
 if(!c.people.some(p=>p.id===person)||!methodCatalog.some(m=>m.id===method)||!c.rooms.some(r=>r.id===room))throw Error('Completa persona, método y lugar');
 if(!Array.isArray(evidence)||new Set(evidence).size<3||evidence.some(id=>!state.found.includes(id)))throw Error('Adjunta al menos tres pruebas descubiertas');
 const sufficient=['motive','link','opportunity'].every(category=>c.clues.some(x=>evidence.includes(x.id)&&x.person===person&&x.category===category&&x.effect==='supports'));
 state.result=person===c.culprit.id&&method===c.method.id&&room===c.scene.id&&sufficient?'won':'lost';return state.result;
}
export function prototypeResolution(c,state){return state.result==='won'?`${c.culprit.name} causó la muerte de ${c.victim.name} mediante «${c.method.name}» en «${c.scene.name}» a las ${clock(c.timing.crimeMinute)}. ${c.motive} Las pruebas del móvil, el vínculo material y el registro de acceso sostienen la acusación.`:'La acusación no reúne la persona, método, escena y pruebas necesarios. Puedes reabrir la investigación conservando tus hallazgos.';}
