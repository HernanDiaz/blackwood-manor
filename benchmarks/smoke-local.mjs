import {newGame} from '../src/engine.mjs';
import fs from 'node:fs';
const cases=[{person:'arthur',question:'¿Quién llevó el té?'},{person:'victor',question:'¿Qué ocultas sobre las facturas?'}];const result=[];
for(const t of cases){const r=await fetch('http://127.0.0.1:4173/api/interrogate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...t,state:newGame({caseId:'bm01'})})});const body=await r.json();if(!r.ok||body.mode!=='local-llm')throw Error(JSON.stringify(body));if(t.person==='victor'&&body.answer.includes('facturas falsas'))throw Error('Secret leak');result.push({...t,...body});}
fs.writeFileSync(new URL('./results/integration.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
