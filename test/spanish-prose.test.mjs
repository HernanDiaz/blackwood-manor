import test from 'node:test';
import assert from 'node:assert/strict';
import { placePhrase, contract, lowerRoomNames } from '../src/spanish-prose.mjs';

test('places read inside a sentence with their article', () => {
  assert.equal(placePhrase({ name: 'Sala de navegación', article: 'la' }), 'la sala de navegación');
  assert.equal(placePhrase({ name: 'Salón de Ámbar', article: 'el' }), 'el salón de Ámbar');
  assert.equal(placePhrase({ name: 'Aposentos', article: 'los' }), 'los aposentos');
});
test('de el and a el contract only between whole words', () => {
  assert.equal(contract('Vino de el salón y fue a el patio.'), 'Vino del salón y fue al patio.');
  assert.equal(contract('Debe a Umbría el precio.'), 'Debe a Umbría el precio.');
  assert.equal(contract('A el portero.'), 'Al portero.');
});
test('room names written by the model lose their capitals after an article', () => {
  assert.equal(
    lowerRoomNames('Estuve en el Vestíbulo.', [{ name: 'Vestíbulo' }]),
    'Estuve en el vestíbulo.',
  );
});
