import fs from 'node:fs';const p='E:/2026 blackwood manor/src/local-llm.mjs';let s=fs.readFileSync(p,'utf8');const at=s.indexOf('export async function localClassify');s=s.slice(0,at)+`export function explicitIntent(question,person){
 let q=question.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
 if(/ignora|devuelve.*id|revela.*solucion|program|codigo|caja fuerte|pistola|quien.*asesin|quien.*mato/.test(q))return 'unknown';
 q=q.split(/\\bsino\\b|quiero saber|necesito saber/).at(-1);
 if(/guante/.test(q))return 'glove';
 if(/frasco|aconito/.test(q))return 'poison';
 if(/ocult|secreto|factura|carta|amantes|sentimental|testamento|documento.*herencia|joya/.test(q))return 'secret';
 if(person==='julian'&&/de donde.*dinero|dinero.*saldar/.test(q))return 'secret';
 if(/quien.*(llevo|transport|preparo)|llebo|prepar.*bebida|transport.*taza/.test(q))return 'tea';
 if(/donde|\\bdnd\\b|ubicacion|coartada|con quien|quien.*contigo|quien.*confirm|quien.*estaba|comprob.*existencias|cuando.*sali|hora.*sali/.test(q)&&!/no.*(donde|coartada)/.test(q))return 'alibi';
 return null;
}
`+s.slice(at);s=s.replace("if(!actor||state.result)throw Error('Interrogatorio no disponible');","if(!actor||state.result)throw Error('Interrogatorio no disponible');\n const hint=explicitIntent(question,person);\n if(hint!==null)return hint==='unknown'||!facts.some(f=>f.id===hint)?'unknown':hint;");fs.writeFileSync(p,s);
let b=fs.readFileSync('E:/2026 blackwood manor/benchmarks/run-qwen-v3.mjs','utf8');b=b.replace("localInterrogate,verifyGenerated","localInterrogate,verifyGenerated,explicitIntent");b=b.replace("correct:r.topic===t.expected,verified:","correct:r.topic===t.expected,routed:explicitIntent(t.question,t.person)!==null,verified:");b=b.replaceAll('results/qwen-v3.json','results/qwen-v4.json');b=b.replace('varied:a.filter(t=>t.varied).length','varied:a.filter(t=>t.varied).length,routed:a.filter(t=>t.routed).length');fs.writeFileSync('E:/2026 blackwood manor/benchmarks/run-qwen-v4.mjs',b);
