// Stable visual references. A saved visualSet always points to the same files.
export const VISUAL_SET='blackwood-pilot-v1';
const base='/assets/'+VISUAL_SET+'/';
export function visualFor(state,kind,id){
 if(state.visualSet!==VISUAL_SET)return null;
 if(kind==='clue')return id==='cup'&&state.found.includes(id)?base+'cup.webp':null;
 if(kind==='room'&&id==='study')return base+'study.webp';
 if(kind==='person'&&id==='arthur')return base+'arthur.webp';
 return null;
}
