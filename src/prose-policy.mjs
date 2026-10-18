export function openingTextIssue(opening, description = '') {
  const text = (
    String(opening?.arrival || '') +
    ' ' +
    String(opening?.tension || '')
  ).toLowerCase();
  if (
    /s[aá]banas? de (madera|piedra|hierro)|telas? de (madera|piedra)|cortinas? de (piedra|hierro)/.test(
      text,
    )
  )
    return 'material incompatible con el objeto';
  for (const noun of ['ventana', 'escalera', 'balcón', 'pasadizo', 'salida lateral'])
    if (text.includes(noun) && !description.toLowerCase().includes(noun))
      return 'elemento espacial no descrito: ' + noun;
  return null;
}
