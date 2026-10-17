import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
const root=new URL('./generic-pilot/',import.meta.url);
const ids=['p1','p2','p3','p4','p5'],rooms=['r1','r2','r3','r4','r5','r6'];
const str={type:'string'},enm=values=>({type:'string',enum:values});
const obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const arr=(items,n)=>({type:'array',items,minItems:n,maxItems:n});
const worldSchema=obj({title:str,premise:str,visualStyle:str,people:arr(obj({id:enm(ids),name:str,role:str,personality:str,appearance:str,imagePrompt:str}),5),rooms:arr(obj({id:enm(rooms),name:str,description:str,imagePrompt:str}),6)});
const plotSchema=obj({victim:obj({name:str,role:str}),culprit:enm(ids),crimeRoom:enm(rooms),method:str,weaponObject:str,motive:str,crimeMinute:{type:'integer',minimum:60,maximum:1380},deathMinute:{type:'integer',minimum:61,maximum:1439},story:str});
const alibiSchema=obj({alibis:arr(obj({person:enm(ids),room:enm(rooms),witness:enm([...ids,'none']),from:{type:'integer',minimum:0,maximum:1439},to:{type:'integer',minimum:0,maximum:1439},claim:str,secret:str}),5)});
const clueSchema=obj({clues:arr(obj({id:enm(['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14','c15']),room:enm(rooms),title:str,text:str,imagePrompt:str}),5)});
function time(n){return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`;}
function unique(items,key){return new Set(items.map(x=>x[key])).size===items.length;}
export function checkAlibis(world,plot,alibis){
 const errors=[];
 if(alibis.length!==5||!unique(alibis,'person'))errors.push('Deben existir cinco coartadas con personas distintas.');
 for(const a of alibis){
  if(a.from>=a.to||a.from>plot.crimeMinute||a.to<plot.deathMinute)errors.push(`${a.person}: el intervalo no cubre el crimen y la muerte.`);
  if(a.person===plot.culprit){if(a.room===plot.crimeRoom)errors.push('La coartada falsa del culpable no lo aleja de la escena.');if(a.witness!=='none')errors.push('La mentira no puede tener un testigo inocente verificado.');}
  else{const b=alibis.find(x=>x.person===a.witness);
   if(!b||b.person===a.person||b.witness!==a.person||b.room!==a.room||b.person===plot.culprit||a.room===plot.crimeRoom)errors.push(`${a.person}: falta coartada inocente recíproca fuera de la escena.`);}
 }
 return errors;
}
export function candidates(mystery,found){
 return mystery.world.people.filter(p=>['motive','link','opportunity'].every(category=>mystery.plan.some(c=>found.includes(c.id)&&c.person===p.id&&c.category===category&&c.effect==='supports'))&&!mystery.plan.some(c=>found.includes(c.id)&&c.person===p.id&&c.effect==='excludes')).map(p=>p.id);
}
export function validateMystery(m){
 const errors=[];
 if(m.world.people.some(p=>p.name.toLowerCase()===m.plot.victim.name.toLowerCase()))errors.push('La víctima coincide con un sospechoso.');
 if(!m.world.premise?.trim())errors.push('Falta la introducción.');
 if(m.world.rooms.some(r=>/Da únicamente|sin explicación|nombre natural/i.test(r.name)))errors.push('Nombre de habitación contiene instrucciones.');
 if(!unique(m.world.people,'id')||!unique(m.world.rooms,'id'))errors.push('Identificadores de mundo duplicados.');
 if(m.plot.deathMinute<=m.plot.crimeMinute)errors.push('La muerte debe ser posterior al crimen.');
 if(!m.world.people.some(p=>p.id===m.plot.culprit)||!m.world.rooms.some(r=>r.id===m.plot.crimeRoom))errors.push('Solución con referencia inexistente.');
 errors.push(...checkAlibis(m.world,m.plot,m.alibis));
 if(m.clues.length!==15||!unique(m.clues,'id'))errors.push('Faltan pistas o hay identificadores repetidos.');
 for(const p of m.plan)if(!m.clues.some(c=>c.id===p.id&&m.world.rooms.some(r=>r.id===c.room)))errors.push(`Pista ${p.id} sin habitación válida.`);
 const solved=candidates(m,m.clues.map(c=>c.id));if(solved.length!==1||solved[0]!==m.plot.culprit)errors.push('Las pruebas no conducen a una única solución.');
 return errors;
}
function scaffold(plot){
 const innocent=ids.filter(id=>id!==plot.culprit),safe=rooms.filter(id=>id!==plot.crimeRoom);
 return ids.map(person=>{const index=innocent.indexOf(person),room=person===plot.culprit?safe[2]:safe[Math.floor(index/2)],witness=person===plot.culprit?'none':innocent[index%2===0?index+1:index-1];return {person,room,witness,from:plot.crimeMinute-10,to:plot.deathMinute+1};});
}
export async function runPilot(){
 await fs.mkdir(root,{recursive:true});const runs=[];
 for(const [index,setting] of ['Estación espacial de ciencia ficción, sin magia, tecnología industrial y vida cotidiana humana','Otra estación espacial de ciencia ficción, sin magia, distinta de la anterior','Fortaleza medieval de fantasía, sin tecnología moderna'].entries()){
  const folder=new URL(`run-${index+1}/`,root);await fs.mkdir(folder,{recursive:true});
  const log={setting,seed:710+index,steps:[],repairs:[],scaffolded:false};let serial=0;
  async function ask(stage,system,input,schema,tokens=1800){
   const started=performance.now(),messages=[{role:'system',content:system},{role:'user',content:JSON.stringify(input)}];
   const r=await fetch('http://127.0.0.1:1235/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model:'local',seed:log.seed+serial++,temperature:.55,max_tokens:tokens+160,messages,response_format:{type:'json_schema',json_schema:{name:'pilot',strict:true,schema}}})});
   if(!r.ok)throw Error(`${stage}: HTTP ${r.status}`);const data=await r.json(),choice=data.choices[0];
   await fs.writeFile(new URL(`${serial}-${stage}-raw.json`,folder),JSON.stringify({messages,response:data},null,2));
   log.steps.push({stage,seconds:(performance.now()-started)/1000,finish:choice.finish_reason,tokens:data.usage});
   if(choice.finish_reason==='length')throw Error(`${stage}: respuesta truncada`);
   return JSON.parse(choice.message.content);
  }
  try{
   const world=await ask('world','Crea un mundo original para un misterio deductivo. Español, salvo imagePrompt y visualStyle en inglés. Exactamente cinco sospechosos y seis habitaciones con ids distintos p1..p5 y r1..r6. Roles, apariencias y personalidades bien diferenciados. Nombres breves. Sin culpable todavía. No uses Blackwood, Edmund, Elena, Víctor, Clara, Arthur o Julián. Frases breves; imagePrompt describe un único retrato o espacio, sin texto escrito.',{setting},worldSchema,2200);
   const compact={people:world.people.map(({id,name,role})=>({id,name,role})),rooms:world.rooms.map(({id,name})=>({id,name}))};
   const plot=await ask('plot','Crea la verdad secreta del crimen a partir del mundo. No añadas sospechosos ni habitaciones. Víctima distinta de los sospechosos. Crimen físicamente sencillo, deducible y compatible con la ambientación. Elige culpable y habitación de los ids. Las horas son minutos desde medianoche; muerte entre 1 y 15 minutos después del crimen y antes del minuto 1400. El móvil debe ser concreto. No necesitas explicar instrucciones técnicas reales del método. Historia de máximo 100 palabras.',{setting,...compact},plotSchema,1100);
   if(plot.deathMinute<=plot.crimeMinute||plot.deathMinute>1400)throw Error('Cronología inválida generada en la verdad del caso.');
   let {alibis}=await ask('alibis','Escribe cinco coartadas. Los cuatro inocentes forman DOS parejas con testigos recíprocos, en habitaciones ajenas a la escena, todo el intervalo del crimen a la muerte. El culpable miente: dice estar solo en otra habitación, witness=none. Person ids únicos. from/to en minutos, intervalo cubre crimen y muerte. claim en primera persona con horas HH:MM correctas; secret privado plausible y distinto del móvil salvo el del culpable. No inventes otra persona. Debe haber exactamente cuatro inocentes y un culpable.',{...compact,plot,crimeTime:time(plot.crimeMinute),deathTime:time(plot.deathMinute)},alibiSchema,1700);
   let errors=checkAlibis(world,plot,alibis);log.rawAlibiErrors=errors;
   if(errors.length){
    const repaired=await ask('alibi-repair','Corrige la estructura de coartadas señalada por los errores. Devuelve todas las cinco corregidas, sin cambiar el mundo ni la verdad. Cuatro inocentes en parejas recíprocas fuera de la escena; culpable solo mintiendo. Horas HH:MM en el texto. Sin nuevos personajes.',{...compact,plot,previous:alibis,errors},alibiSchema,1700);
    alibis=repaired.alibis;errors=checkAlibis(world,plot,alibis);log.repairs.push({stage:'alibis',remainingErrors:errors});
   }
   if(errors.length){
    log.scaffolded=true;const schedule=scaffold(plot);
    const written=await ask('scaffolded-alibis','El motor ya fijó las coartadas. COPIA exactamente person,room,witness,from,to de cada fila. Escribe solo claim y secret; claim refleja esa fila con nombres y horas HH:MM. El culpable mantiene esa mentira. No cambies ninguna fila.',{...compact,plot,schedule,formatted:schedule.map(a=>({...a,from:time(a.from),to:time(a.to)}))},alibiSchema,1700);
    // Never silently attribute the engine's corrections to the model.
    alibis=schedule.map(row=>({...written.alibis.find(a=>a.person===row.person),...row}));
   }
   const plan=[];for(const [group,category] of ['motive','link','opportunity'].entries())for(const [i,person] of ids.entries())plan.push({id:'c'+(group*5+i+1),person,category,effect:category==='motive'||person===plot.culprit?'supports':'excludes'});
   const clues=[];
   for(let batch=0;batch<3;batch++){
    const result=await ask(`clues-${batch+1}`,'Escribe CINCO pistas materiales o documentos para las cinco filas del plan. Copia los ids. Cada pista debe identificar por su nombre a la persona de su fila. supports=móvil/vínculo/oportunidad a favor de sospechar; excludes=demuestra inocencia y NO incrimina. Las pistas de oportunidad inocentes corroboran su coartada; la del culpable contradice su mentira. Las pistas de vínculo inocentes muestran ausencia del rastro del crimen. No cambies la solución, horarios, lugares ni método. Objetos físicamente plausibles para la ambientación. title corto, text en español máximo 45 palabras; imagePrompt inglés, un objeto/documento sin personas ni letras legibles. No narrar instrucciones ni teoría del juego.',{setting,...compact,plot,alibis,plan:plan.slice(batch*5,batch*5+5)},clueSchema,1900);
    clues.push(...result.clues);
   }
   const mystery={version:1,setting,world,plot,alibis,plan,clues};log.validationErrors=validateMystery(mystery);
   mystery.id=createHash('sha256').update(JSON.stringify(mystery)).digest('hex').slice(0,16);
   await fs.writeFile(new URL('mystery.json',folder),JSON.stringify(mystery,null,2));
   // Replay: visit all rooms, gather only clues in the current room, save/restore,
   // enumerate all accusations and demand all three categories of support.
   const state={caseId:mystery.id,found:[],room:world.rooms[0].id,notes:'Prueba de guardado',result:null};
   for(const room of world.rooms){state.room=room.id;for(const clue of clues.filter(c=>c.room===state.room))state.found.push(clue.id);}
   const restored=JSON.parse(JSON.stringify(state));
   const wins=[];for(const person of world.people)for(const room of world.rooms)for(const method of [plot.method,'método incorrecto'])if(candidates(mystery,restored.found).includes(person.id)&&room.id===plot.crimeRoom&&method===plot.method)wins.push({person:person.id,room:room.id,method});
   log.replay={found:restored.found.length,saveRetained:JSON.stringify(restored)===JSON.stringify(state),accusations:60,winners:wins,missingCategoriesRejected:['motive','link','opportunity'].every(category=>candidates(mystery,plan.filter(p=>p.category!==category).map(p=>p.id)).length===0)};
   if(log.validationErrors.length)log.status='rejected';else log.status='structural-pass';
   const review=await ask('semantic-review','Revisa un misterio ficticio. Detecta contradicciones CONCRETAS entre la solución, coartadas y textos de pistas: personas, lugares, horarios, método, rastro. Las coartadas del culpable son mentiras deliberadas: su contradicción con pruebas no es error. Sí lo es un inocente cuya prueba lo incrimina o un texto que no corresponde a su etiqueta. Detecta anacronismos claros. Cita literalmente el fragmento erróneo y explica la contradicción. No inventes problemas. Lista vacía si no ves problemas. Esta revisión no es garantía.',{world:compact,plot,alibis,clues:clues.map(c=>({...c,...plan.find(p=>p.id===c.id)}))},obj({issues:{type:'array',maxItems:8,items:obj({quote:str,reason:str})}}),1300);
   log.semanticReview=review;
  }catch(e){log.status='failed';log.error=e.message;}
  log.seconds=log.steps.reduce((n,s)=>n+s.seconds,0);runs.push(log);await fs.writeFile(new URL('run-log.json',folder),JSON.stringify(log,null,2));await fs.writeFile(new URL('summary.json',root),JSON.stringify(runs,null,2));console.log(JSON.stringify({run:index+1,status:log.status,seconds:log.seconds,errors:log.validationErrors,rawAlibiErrors:log.rawAlibiErrors,scaffolded:log.scaffolded,semanticReview:log.semanticReview,error:log.error}));
 }
}
if(process.argv[1]?.endsWith('test-generic-generation.mjs'))await runPilot();
