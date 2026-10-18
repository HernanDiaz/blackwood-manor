import { test } from 'node:test';
import assert from 'node:assert/strict';
import { methodCatalog, findMethod, fitsRoom } from '../src/method-catalog.mjs';
import { chooseWeapon } from '../src/case-generator.mjs';
import { worldWeapons } from '../src/world-file.mjs';
import { rng } from '../src/random.mjs';
import { allWorlds } from './worlds-fixture.mjs';

test('twenty methods with a family, a delay and the scene they need', () => {
  assert.equal(methodCatalog.length, 20);
  assert.equal(new Set(methodCatalog.map(m => m.id)).size, 20);
  for (const m of methodCatalog) {
    assert.ok(m.family);
    assert.ok(Number.isInteger(m.delayMinutes) && m.delayMinutes >= 0);
    assert.ok(Array.isArray(m.roomTags));
  }
  assert.equal(findMethod('nope'), undefined);
});
test('a method fits a room only when the room has every tag it needs', () => {
  assert.ok(fitsRoom('knife', { tags: [] }));
  assert.ok(!fitsRoom('fall', { tags: [] }));
  assert.ok(fitsRoom('fall', { tags: ['elevated'] }));
  assert.ok(!fitsRoom('robot', { tags: ['life-support'] }));
  assert.ok(!fitsRoom('nope', { tags: ['elevated'] }));
});
test('every world can use all its weapons and keeps out anachronisms', () => {
  for (const w of allWorlds()) assert.equal(worldWeapons(w).length, w.weapons.length, w.id);
  const ids = id =>
    allWorlds()
      .find(w => w.id === id)
      .weapons.map(x => x.method);
  assert.ok(!ids('torre-umbria').some(m => ['revolver', 'laser', 'artifact'].includes(m)));
  assert.ok(!ids('villa-bellavista').some(m => ['sword', 'plasma', 'alchemy'].includes(m)));
  assert.ok(ids('estacion-orbital').includes('cryo'));
});
test('weapon choice prefers a new family', () => {
  for (const w of allWorlds()) {
    let previous = '';
    for (let i = 0; i < 30; i++) {
      const weapon = chooseWeapon(w, rng(w.id + i), { previousMethodId: previous });
      if (previous) assert.notEqual(findMethod(weapon.method).family, findMethod(previous).family);
      previous = weapon.method;
    }
  }
  const castle = allWorlds().find(w => w.id === 'torre-umbria');
  assert.throws(() => chooseWeapon(castle, rng('x'), { forcedMethodId: 'laser' }));
});
