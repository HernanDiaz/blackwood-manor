import fs from 'node:fs/promises';import {settings,methodCatalog,methodRoomPairs,methodTiming} from '../src/method-catalog.mjs';
const results=[];
for(const setting of Object.keys(settings)){
 const rooms=[{id:'main',tags:['interior']},{id:'gallery',tags:['interior','elevated']},...(setting==='scifi'?[{id:'engineering',tags:['industrial','life-support','cryogenic']}]:[])];
 let previousFamily;
 for(let round=0;round<2;round++){
 const pairs=methodRoomPairs(setting,rooms).filter(p=>methodCatalog.find(m=>m.id===p.methodId).family!==previousFamily);
 const started=performance.now();const r=await fetch('http://127.0.0.1:1235/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({model:'local',seed:4400+results.length,temperature:.5,max_tokens:120,chat_template_kwargs:{enable_thinking:false},messages:[{role:'system',content:'Choose one suitable weapon/scene combination for a fictional murder mystery. Output ONLY a combination id in the schema. Do not invent another combination.'},{role:'user',content:JSON.stringify({setting:settings[setting].name,options:pairs.map(p=>({id:p.id,method:methodCatalog.find(m=>m.id===p.methodId).name}))})}],response_format:{type:'json_schema',json_schema:{name:'method',strict:true,schema:{type:'object',properties:{combination:{type:'string',enum:pairs.map(p=>p.id)}},required:['combination'],additionalProperties:false}}}})});
 const raw=await r.json();let choice,pass=false,error;try{choice=JSON.parse(raw.choices[0].message.content).combination;pass=raw.choices[0].finish_reason!=='length'&&pairs.some(p=>p.id===choice);}catch(e){error=e.message;}
 const pair=pairs.find(p=>p.id===choice),method=pair&&methodCatalog.find(m=>m.id===pair.methodId);results.push({setting,round,choice,pass,error,method:method?.name,family:method?.family,timing:method&&methodTiming(method,1335),seconds:(performance.now()-started)/1000,raw});if(method)previousFamily=method.family;
 }
}
await fs.writeFile(new URL('./generic-pilot/method-selection.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({raw,...r})=>r),null,2));
