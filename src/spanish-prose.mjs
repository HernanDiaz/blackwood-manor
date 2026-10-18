const lowerFirst=s=>s.charAt(0).toLocaleLowerCase('es')+s.slice(1);
export function placePhrase(room){const name=room.name;if(/^(el|la|los|las)\s/i.test(name))return lowerFirst(name);const first=name.split(/\s+/)[0];const article=/^Aposentos$/i.test(first)?'los':/^(Sala|Cámara|Estación|Enfermería|Biblioteca|Cocina|Botica|Armería|Torre|Forja|Bodega|Despensa|Fábrica|Oficina|Zona|Capilla|Iglesia|Cripta|Cueva|Taberna|Posada|Escuela|Galería|Habitación|Celda|Mazmorra|Catedral)$/i.test(first)?'la':'el';return article+' '+lowerFirst(name);}
export function naturalProse(text,rooms=[],object=''){
 let result=String(text);
 if(object){const article=/^(daga|copa|escopeta|espada|ballesta|barandilla|cápsula|consola|compuerta)\b/i.test(object)?'la':/^(arma)\b/i.test(object)?'el':'el';result=result.split('el objeto «'+object+'»').join(article+' '+object).split('«'+object+'»').join(article+' '+object);}
 for(const room of rooms)result=result.split('«'+room.name+'»').join(placePhrase(room));
 return result.replace(/«([^»]+)»/g,(_,name)=>lowerFirst(name)).replace(/\bde el\b/g,'del').replace(/\ba el\b/g,'al');
}
