export function openingTextIssue(opening,description=''){
 const text=(String(opening?.arrival||'')+' '+String(opening?.tension||'')).toLowerCase();
 if(/s[aá]banas? de (madera|piedra|hierro)|telas? de (madera|piedra)|cortinas? de (piedra|hierro)/.test(text))return 'material incompatible con el objeto';
 for(const noun of ['ventana','escalera','balcón','pasadizo','salida lateral'])if(text.includes(noun)&&!description.toLowerCase().includes(noun))return 'elemento espacial no descrito: '+noun;
 return null;
}
export function checkRoomMeaning(room,setting){
 const name=room.name.toLowerCase(),description=room.description.toLowerCase();
 if(/profundidades|subterr[aá]ne/.test(setting.toLowerCase())&&/paisaje exterior|cielo abierto|luz solar|sunlight|outside landscape/.test(description))throw Error('Deep underground rooms have no exterior landscape views, open sky or sunlight. Describe a connected enclosed stone room.');
 if(description.trim()===setting.toLowerCase().trim()||/^colonia de/.test(name))throw Error('Describe one specific interior room, not the whole setting or a copy of the request.');
 if(/^(esmalte|fangal)\b/.test(name))throw Error('Use a Spanish room noun matching its function: taller, almacén, enfermería, comedor, archivo or dormitorio.');
 if(/^(dormitorio|alcoba|aposentos)\b/.test(name)&&/comedor|desayuno|dining/.test(description))throw Error('A bedroom cannot be described as a dining room. Align room name and description.');
 if(/^(comedor|refectorio)\b/.test(name)&&/para dormir|dormitorio|sleeping/.test(description))throw Error('A dining room cannot be described as sleeping quarters.');
}
