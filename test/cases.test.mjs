import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cases,selectCase,validateCase} from '../src/cases.mjs';
import {newGame,restore,caseClues,currentCase,caseInfo,caseRooms,rooms,suspects,availableFacts,discover,accuse,resolution,weapons} from '../src/engine.mjs';
import {responseOptions,verifyGenerated} from '../src/local-llm.mjs';
import {visualFor} from '../src/visuals.mjs';
const full=c=>{const s=newGame({caseId:c.id});for(const room of rooms){s.room=room.id;for(const clue of caseClues(s).filter(x=>x.room===room.id))discover(s,clue.id);}return s;};

test('five authored reconstructions have unique culprits, consistent proof graphs and complete alibis',()=>{
 assert.equal(cases.length,5);assert.equal(new Set(cases.map(c=>c.solution.person)).size,5);
 assert.equal(new Set(cases.map(c=>c.solution.weapon)).size,2);assert.equal(new Set(cases.map(c=>c.startRoom)).size,4);
 for(const c of cases){assert.deepEqual(validateCase(c),[],c.id);assert.equal(full(c).found.length,18);assert.equal(caseInfo(full(c)).total,5);}
 const broken=structuredClone(cases[1]);broken.proof.push(...broken.proof.map(p=>({...p,person:'victor'})));assert(validateCase(broken).includes('ambiguous-deduction'));
});
test('random selection is reproducible at boundaries and never immediately repeats',()=>{
 for(const previous of cases){for(const n of [0,.1,.4,.7,.999999])assert.notEqual(selectCase(previous.id,()=>n),previous.id);}
 assert.deepEqual(new Set(cases.map((_,i)=>selectCase(undefined,()=>(i+.5)/5))),new Set(cases.map(c=>c.id)));
 for(const c of cases)for(let i=0;i<10;i++)assert.notEqual(newGame({previousCaseId:c.id}).caseId,c.id);
});
test('case identity, revision, discovered evidence, chat and notes survive complete investigation and restore',()=>{
 for(const c of cases){const s=full(c);s.notes='Mi teoría';s.chat=[{person:'elena',question:'coartada',answer:availableFacts(s,'elena')[0].text}];
 const restored=restore(JSON.stringify(s));assert.deepEqual(restored,s);assert.equal(currentCase(restored).id,c.id);
 const evidence=c.solution.groups.map(group=>group[0]);assert.equal(accuse(restored,{...c.solution,evidence}),'won');assert(resolution(restored).includes(c.ending));
 assert.throws(()=>discover(restored,'cup'));assert.equal(restore(JSON.stringify(restored)).result,'won');}
});
test('450 culprit / method / room combinations have exactly one winning reconstruction per case',()=>{
 let checked=0;
 for(const c of cases){let winners=0;for(const p of suspects)for(const w of weapons)for(const r of rooms){const s=full(c);
 const won=accuse(s,{person:p.id,weapon:w.id,room:r.id,evidence:c.solution.groups.map(g=>g[0])})==='won';
 const expected=p.id===c.solution.person&&w.id===c.solution.weapon&&r.id===c.solution.room;
 assert.equal(won,expected,`${c.id}/${p.id}/${w.id}/${r.id}`);winners+=Number(won);checked++;}assert.equal(winners,1);}
 assert.equal(checked,450);
});
test('each case requires evidence from all three categories, never accepts a generic pile of clues',()=>{
 for(const c of cases)for(const group of c.solution.groups){const s=full(c),evidence=s.found.filter(id=>!group.includes(id));
 assert.equal(accuse(s,{...c.solution,evidence}),'lost');}
});
test('every secret unlocks only at its own evidence gate, and every wording belongs to the active case',()=>{
 for(const c of cases){const s=newGame({caseId:c.id});for(const p of suspects){
  for(const f of c.facts[p.id])if(f[2]){assert(!availableFacts(s,p.id).some(x=>x.id===f[0]),`${c.id}/${p.id}/${f[0]}`);
   const unlocked={...s,found:[f[2]]};assert(availableFacts(unlocked,p.id).some(x=>x.id===f[0]&&x.text===f[1]));}
  for(const f of availableFacts(s,p.id))for(const option of responseOptions(s,p.id,f.id))assert(verifyGenerated(s,p.id,f.id,option));
 }
 if(c.id!=='bm01')assert(!responseOptions(s,'victor','alibi').some(text=>text.includes('Llevé el té al despacho')));
 }
 const doctor=cases[0],daughter=cases[1];const s=newGame({caseId:daughter.id});assert.notEqual(caseClues(s).find(x=>x.id==='will').text,doctor.clues.find(x=>x.id==='will').text);
});
test('legacy saves migrate to original case, malformed identities or revisions cannot reroll an investigation',()=>{
 const original=full(cases[0]);delete original.caseId;delete original.caseRevision;
 const migrated=restore(original);assert.equal(migrated.caseId,'bm01');assert.deepEqual(migrated.found,original.found);assert.equal(migrated.caseRevision,1);
 assert.throws(()=>restore({...migrated,caseId:'fake'}));assert.throws(()=>restore({...migrated,caseRevision:99}));
 for(const c of cases){const s=newGame({caseId:c.id});assert.equal(restore({...s,room:'fake'}).room,c.startRoom);}
});
test('illustrations remain stable across variants while the contents and scene follow the current case',()=>{
 for(const c of cases){const s=full(c);for(const clue of caseClues(s))assert(visualFor(s,'clue',clue.id));
 const room=caseRooms(s).find(r=>r.id===c.startRoom);assert(room);assert.equal(newGame({caseId:c.id}).room,c.startRoom);
 const locked=newGame({caseId:c.id});assert.equal(visualFor(locked,'clue','cup'),null);assert.equal(visualFor(s,'person','arthur'),visualFor(full(cases[0]),'person','arthur'));}
});

test('interrogation API restores the active case and never substitutes the original testimony',async()=>{
 const {respond}=await import('../server.mjs');const previousKey=process.env.OPENAI_API_KEY,previousLocal=process.env.BLACKWOOD_LOCAL_LLM;
 delete process.env.OPENAI_API_KEY;delete process.env.BLACKWOOD_LOCAL_LLM;
 try{for(const c of cases){const s=newGame({caseId:c.id}),person=c.solution.person;
 const response=await respond({state:s,person,question:'¿Dónde estabas?'});
 assert.equal(response.answer,availableFacts(s,person).find(f=>f.id==='alibi').text);
 const secret=c.facts[person].find(f=>f[0]==='secret');assert(secret);
 const locked=await respond({state:s,person,question:'¿Qué ocultas?'});assert(!locked.answer.includes(secret[1]));
 s.found=[secret[2]];const unlocked=await respond({state:s,person,question:'¿Qué ocultas?'});assert.equal(unlocked.answer,secret[1]);
 }}finally{if(previousKey!==undefined)process.env.OPENAI_API_KEY=previousKey;if(previousLocal!==undefined)process.env.BLACKWOOD_LOCAL_LLM=previousLocal;}
});
