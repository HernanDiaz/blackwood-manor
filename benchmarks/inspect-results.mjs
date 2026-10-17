import fs from 'node:fs';
const root='E:/2026 blackwood manor';
for(const name of ['qwen-2b','gemma-e2b','smollm3','gemma-e2b-r2','smollm3-r2']){const p=`${root}/benchmarks/results/${name}.json`;if(!fs.existsSync(p))continue;const r=JSON.parse(fs.readFileSync(p));console.log(name,JSON.stringify(r.summary||{}));if(name.endsWith('r2'))console.log(JSON.stringify(r.dialogue.map(({id,text})=>({id,text})),null,2));}
