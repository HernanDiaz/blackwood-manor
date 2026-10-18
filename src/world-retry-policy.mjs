export const DEFAULT_WORLD_ATTEMPTS = 5;
export function worldAttemptLimit(value = DEFAULT_WORLD_ATTEMPTS) {
  if (!Number.isInteger(value) || value < 1 || value > 8)
    throw Error('El límite debe estar entre 1 y 8 intentos por ficha');
  return value;
}
export function worldStepLabel(id) {
  return id === 'world'
    ? 'las reglas del mundo'
    : id.startsWith('person-')
      ? 'el personaje ' + id.split('-')[1]
      : 'la habitación ' + id.split('-')[1];
}
export function worldIssue(message = '') {
  if (/specific interior room|Spanish room noun|bedroom|dining room/.test(message))
    return 'el nombre y la descripción no corresponden a una habitación coherente';
  if (/proper name|distinct|repetid/i.test(message)) return 'el nombre está incompleto o repetido';
  if (/portrait|imagePrompt|English portrait/i.test(message))
    return 'la descripción de la imagen no cumple el formato';
  if (/Spanish/i.test(message)) return 'un texto no está en español';
  if (/occupation|oficio/i.test(message)) return 'falta un oficio concreto';
  if (/personality/i.test(message)) return 'la personalidad no contiene rasgos válidos';
  if (/incompleta|length/i.test(message)) return 'el modelo devolvió una respuesta incompleta';
  if (/no disponible|offline|fetch failed/i.test(message))
    return 'el modelo local no está disponible';
  if (/timeout|aborted|tiempo/i.test(message)) return 'el modelo tardó demasiado';
  if (/technology|preindustrial|magic|firearm/i.test(message))
    return 'la ficha contradice las reglas de la ambientación';
  return 'faltan campos válidos en la ficha';
}
