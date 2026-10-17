import {VISUAL_SET} from './visuals.mjs';
export const rooms = [
 {id:'study',name:'Despacho',icon:'✒',description:'Sir Edmund yace junto a la mesa. La lluvia golpea las ventanas cerradas.'},
 {id:'library',name:'Biblioteca',icon:'▤',description:'Libros de medicina, cuentas y una carta que nunca llegó a enviarse.'},
 {id:'dining',name:'Comedor',icon:'♜',description:'La cena terminó a las 21:00. Cinco copas siguen sobre el mantel.'},
 {id:'kitchen',name:'Cocina',icon:'♨',description:'El servicio se retiró temprano. Todavía huele a té negro.'},
 {id:'greenhouse',name:'Invernadero',icon:'❧',description:'Entre los cristales empañados crecen plantas de belleza peligrosa.'},
 {id:'hall',name:'Vestíbulo',icon:'◷',description:'El reloj de la entrada marcó las 21:30 cuando se oyó el grito.'}
];
export const suspects = [
 {id:'elena',name:'Elena Blackwood',role:'La heredera',initials:'EB',color:'#bfa16b'},
 {id:'victor',name:'Dr. Víctor Hale',role:'El médico',initials:'VH',color:'#91ada7'},
 {id:'clara',name:'Clara Reed',role:'La secretaria',initials:'CR',color:'#b69bb5'},
 {id:'arthur',name:'Arthur Finch',role:'El mayordomo',initials:'AF',color:'#9ba9bc'},
 {id:'julian',name:'Julián Blackwood',role:'El sobrino',initials:'JB',color:'#bd947f'}
];
// Fixed canon: Edmund drank poisoned tea at 21:15, collapsed at 21:25.
export const clues = [
 ['cup','study','Taza de té','Un residuo vegetal oscuro permanece en el té que bebió Edmund a las 21:15.','object'],
 ['body','study','Informe preliminar','Sin heridas. Los síntomas concuerdan con intoxicación por acónito.','document'],
 ['will','study','Nuevo testamento','Edmund iba a desheredar a Elena. Aún no lo había firmado.','document'],
 ['appointment','study','Agenda de Edmund','21:10: cita privada con el doctor Hale para revisar sus cuentas.','document'],
 ['fraud','library','Libro de cuentas','Pagos médicos inventados, rubricados V. Hale. Edmund anotó: «Denunciar mañana».','document'],
 ['botany','library','Tratado de botánica','El acónito provoca síntomas en unos diez minutos al ingerirse.','document'],
 ['letter','library','Carta de Clara','Clara admite una relación con Edmund y teme perder su puesto.','document'],
 ['glasses','dining','Copas intactas','Las cinco copas no contienen restos de acónito. La cena no fue el vehículo.','object'],
 ['photo','dining','Fotografía de sobremesa','A las 21:12 Elena y Julián aparecen juntos en el comedor.','document'],
 ['argument','dining','Nota del servicio','Julián discutió por una deuda a las 20:50; Edmund lo echó del despacho.','document'],
 ['tray','kitchen','Bandeja del té','Arthur preparó una sola taza a las 21:05. El doctor se ofreció a llevarla.','object'],
 ['vial','kitchen','Frasco de botiquín','Frasco vacío rotulado «V. Hale». Conserva residuos de acónito.','object'],
 ['receipt','kitchen','Registro del servicio','Arthur y Clara revisaron juntos el inventario entre 21:10 y 21:25.','document'],
 ['plant','greenhouse','Acónito cortado','Falta un tallo, cortado recientemente con una hoja fina.','object'],
 ['glove','greenhouse','Guante de médico','Guante con iniciales VH y savia de acónito en los dedos.','object'],
 ['mud','greenhouse','Huellas en la tierra','La suela estrecha coincide con los zapatos del doctor, no con las botas de Julián.','document'],
 ['clock','hall','Reloj verificado','El reloj funciona bien. Arthur oyó caer la taza a las 21:25.','document'],
 ['visitor','hall','Registro de visitas','Víctor llegó a las 20:40 con su botiquín y salió del despacho a las 21:18.','document']
].map(([id,room,title,text,kind])=>({id,room,title,text,kind}));
const facts = {
 elena:[['alibi','Estuve en el comedor con Julián desde las 21:00 hasta el grito.'],['motive','Mi padre amenazó con desheredarme. Discutimos, sí.'],['secret','Pensé en robar el testamento. Pero no llegué a tocarlo.','will']],
 victor:[['alibi','Llevé el té al despacho y salí a las 21:18. Edmund seguía vivo.'],['motive','Edmund quería hablar de unas cuentas. Era un malentendido.'],['tea','Arthur preparó el té. Yo llevé la bandeja.'],['secret','Edmund descubrió mis facturas falsas. Si me denunciaba, lo perdía todo.','fraud'],['poison','Ese frasco era mío. Conocía el efecto del acónito. No puedo negar lo que han encontrado.','vial'],['glove','El guante es mío. Estuve en el invernadero antes de la cena.','glove']],
 clara:[['alibi','Revisé el inventario con Arthur en la cocina de 21:10 a 21:25.'],['motive','Dependía de este empleo, pero no quería que Edmund muriera.'],['secret','Éramos amantes. Oculté la carta para evitar un escándalo.','letter']],
 arthur:[['alibi','Clara estuvo conmigo en la cocina hasta el ruido de la taza.'],['tea','Preparé el té a las 21:05. El doctor insistió en llevarlo él mismo.'],['motive','Serví a Sir Edmund durante treinta años. No tenía nada que ganar.']],
 julian:[['alibi','Estuve con Elena en el comedor. La fotografía tiene la hora.'],['motive','Le debía dinero. Discutimos a las 20:50 y después no volví a verlo.'],['secret','Iba a vender una joya de la familia para pagar mis deudas.','argument']]
};
export const topics={alibi:'Dónde estabas a las 21:15',motive:'Tu relación con Edmund',tea:'Quién llevó el té',secret:'Qué estás ocultando',poison:'El frasco con tu nombre',glove:'Tu guante en el invernadero'};
export function availableFacts(state,person){return (facts[person]||[]).filter(f=>!f[2]||state.found.includes(f[2])).map(([id,text])=>({id,text}));}
export function newGame(){return {version:1,visualSet:VISUAL_SET,room:'study',found:[],pinned:[],notes:'',chat:[],result:null};}
export function restore(raw){const s=typeof raw==='string'?JSON.parse(raw):raw;if(!s||s.version!==1||!Array.isArray(s.found)||!Array.isArray(s.chat))throw Error('Guardado incompatible');if(s.visualSet&&s.visualSet!==VISUAL_SET)throw Error('Conjunto visual no disponible');const base=newGame();base.room=rooms.some(r=>r.id===s.room)?s.room:'study';base.found=[...new Set(s.found.filter(id=>clues.some(c=>c.id===id)))];base.pinned=Array.isArray(s.pinned)?s.pinned.filter(id=>base.found.includes(id)):[];base.notes=typeof s.notes==='string'?s.notes.slice(0,10000):'';base.chat=s.chat.filter(m=>suspects.some(p=>p.id===m.person)&&typeof m.question==='string'&&typeof m.answer==='string').slice(-200);base.result=['won','lost'].includes(s.result)?s.result:null;return base;}
export function discover(state,id){if(state.result)throw Error('El caso está cerrado');const c=clues.find(c=>c.id===id&&c.room===state.room);if(!c)throw Error('Pista fuera de alcance');if(!state.found.includes(id))state.found.push(id);return c;}
export function inferTopic(question){const q=question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(/guante|invernadero/.test(q))return 'glove';if(/veneno|aconito|frasco/.test(q))return 'poison';if(/ocult|secret|carta|testamento|factura|cuentas/.test(q))return 'secret';if(/te\b|bandeja|taza/.test(q))return 'tea';if(/relacion|dinero|motivo|deuda|edmund/.test(q))return 'motive';return 'alibi';}
export function answer(state,person,question,selected){if(state.result)throw Error('El caso está cerrado');if(!suspects.some(p=>p.id===person))throw Error('Sospechoso desconocido');const allowed=availableFacts(state,person);const topic=selected||inferTopic(question);return allowed.find(f=>f.id===topic)?.text||'No voy a hablar de eso. Si tiene pruebas, enséñemelas. Puede preguntarme por mi coartada o mi relación con Edmund.';}
export const weapons=[{id:'aconite',name:'Acónito en el té'},{id:'knife',name:'Abrecartas'},{id:'wine',name:'Veneno en el vino'}];
export function accuse(state,{person,weapon,room,evidence}){if(state.result)throw Error('El caso ya está cerrado');if(!suspects.some(p=>p.id===person)||!weapons.some(w=>w.id===weapon)||!rooms.some(r=>r.id===room))throw Error('Completa la acusación');if(!Array.isArray(evidence)||new Set(evidence).size<3||evidence.some(id=>!state.found.includes(id)))throw Error('Selecciona al menos tres pistas descubiertas');const valid=person==='victor'&&weapon==='aconite'&&room==='study';const supported=evidence.includes('fraud')&&evidence.some(id=>['vial','glove'].includes(id))&&evidence.some(id=>['tray','appointment','visitor'].includes(id));state.result=valid&&supported?'won':'lost';return state.result;}
export function resolution(state){return state.result==='won'?'Caso resuelto. Víctor Hale añadió acónito al té y lo llevó al despacho a las 21:15. Edmund descubrió su fraude y pensaba denunciarlo. El frasco o guante lo vincula al veneno; la bandeja, agenda o registro demuestra su oportunidad.':'La acusación no se sostiene. Necesitas identificar culpable, método y habitación, y aportar pruebas del móvil, vínculo con el veneno y oportunidad. Reabre el caso para seguir investigando.';}
