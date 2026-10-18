const lowerFirst = s => s.charAt(0).toLocaleLowerCase('es') + s.slice(1);
// A place inside a sentence: "la Sala de navegación" -> "la sala de navegación".
// Proper nouns keep their capitals ("el salón de Ámbar").
export function placePhrase(room) {
  return room.article + ' ' + lowerFirst(room.name);
}
// "de el" -> "del", "a el" -> "al", only between whole words ("Umbría el" stays as it is).
export const contract = text =>
  text
    .replace(/(?<!\p{L})de el(?!\p{L})/gu, 'del')
    .replace(/(?<!\p{L})a el(?!\p{L})/gu, 'al')
    .replace(/(?<!\p{L})De el(?!\p{L})/gu, 'Del')
    .replace(/(?<!\p{L})A el(?!\p{L})/gu, 'Al');
// "en el Vestíbulo" -> "en el vestíbulo", for text written by the local model.
export function lowerRoomNames(text, rooms = []) {
  let result = String(text);
  for (const room of rooms) {
    const name = room.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp('(?<![\\p{L}])(el|la|los|las|del|al) ' + name + '(?![\\p{L}])', 'gu'),
      (_, article) => article + ' ' + lowerFirst(room.name),
    );
  }
  return result;
}
