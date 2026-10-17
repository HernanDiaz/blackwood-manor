import fs from 'node:fs';
import {cases,validateCase} from '../src/cases.mjs';
import {newGame,availableFacts,caseClues} from '../src/engine.mjs';
import {localConversation} from '../src/conversation.mjs';
import {responseOptions} from '../src/local-llm.mjs';
const results=[];
for(const c of cases){
 const state=newGame({caseId:c.id});
 const person=c.solution.person,question='¿Dónde estabas a las 21:15?';
 const response=await localConversation(state,person,question);
 results.push({caseId:c.id,person,question,expected:availableFacts(state,person).find(f=>f.id==='alibi').text,...response,catalogue:responseOptions(state,person,'alibi').includes(response.answer),structuralErrors:validateCase(c),clueCount:caseClues(state).length});
}
fs.writeFileSync(new URL('./results/five-cases-dialogue.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
