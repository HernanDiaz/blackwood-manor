import {test} from 'node:test';import assert from 'node:assert/strict';
import {methodCatalog,settings,compatibleMethods,methodRoomPairs,chooseMethod,methodTiming,methodEvidence} from '../src/method-catalog.mjs';
test('twenty methods cover four settings with coherent evidence, time and objects',()=>{
 assert.equal(methodCatalog.length,20);assert.equal(new Set(methodCatalog.map(m=>m.id)).size,20);
 for(const m of methodCatalog){assert(m.name&&m.object&&m.finding&&m.trace&&m.imagePrompt);assert(m.requiresPresence);assert(m.settings.every(s=>settings[s]));assert(methodEvidence(m,'Testigo', '22:15').includes(m.object));const timing=methodTiming(m,1335);assert(timing.deathMinute>timing.crimeMinute);assert(timing.windowStart<=timing.crimeMinute&&timing.windowEnd>timing.deathMinute);}
});
test('compatibility rejects anachronisms, absent magic and missing scene features',()=>{
 const medieval=compatibleMethods('medieval').map(m=>m.id);assert(medieval.includes('sword'));assert(!medieval.includes('laser'));assert(!medieval.includes('revolver'));
 assert(!compatibleMethods('fantasy',{capabilities:['ordinary-tools','medieval-weapons'],roomTags:['interior']}).some(m=>m.id==='artifact'));
 assert(!compatibleMethods('scifi').some(m=>['air','cryo','robot','hatch','fall'].includes(m.id)));
 assert(compatibleMethods('scifi',{roomTags:['interior','industrial','life-support','cryogenic','elevated']}).some(m=>m.id==='cryo'));
 assert.throws(()=>compatibleMethods('random'));assert.throws(()=>methodTiming(methodCatalog.find(m=>m.id==='drink'),1430));
});
test('method selection prefers a new family and never escapes scene compatibility',()=>{
 for(const setting of Object.keys(settings)){let previous;
 for(let i=0;i<30;i++){const m=chooseMethod(setting,{},previous?.id,()=>((i*7)%29)/29);assert(compatibleMethods(setting).some(x=>x.id===m.id));if(previous)assert.notEqual(m.family,previous.family);previous=m;}}
 assert.throws(()=>chooseMethod('scifi',{capabilities:[],roomTags:[]}));
});
test('method-room choices validate the joint combination rather than independent plausible ids',()=>{
 const rooms=[{id:'bridge',tags:['interior','life-support']},{id:'hangar',tags:['interior','industrial']},{id:'bunks',tags:['interior']}],pairs=methodRoomPairs('scifi',rooms);
 assert(pairs.some(p=>p.id==='air@bridge'));assert(!pairs.some(p=>p.id==='air@bunks'));
 assert(pairs.some(p=>p.id==='robot@hangar'));assert(!pairs.some(p=>p.id==='robot@bridge'));
 assert(!pairs.some(p=>p.methodId==='artifact'));
});
