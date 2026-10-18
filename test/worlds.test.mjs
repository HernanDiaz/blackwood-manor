import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { worlds, worldFile, selectWorld } from '../src/prototype-worlds.mjs';
import {
  newPrototype,
  restorePrototype,
  createPrototypeCase,
  prototypeMethods,
  inspectPrototype,
  accusePrototype,
} from '../src/prototype-engine.mjs';
for (const w of worlds)
  test('complete and restore ' + w.id, () => {
    const d = JSON.parse(readFileSync('public/prototype/' + w.file));
    for (const m of prototypeMethods(d)) {
      const s = newPrototype(d, { seed: 'theme-test', forcedMethodId: m.id }),
        c = createPrototypeCase(d, s);
      for (const clue of c.clues) {
        s.room = clue.room;
        inspectPrototype(c, s, clue.id);
        assert.ok(existsSync('public' + clue.image));
      }
      assert.equal(
        accusePrototype(c, s, {
          person: c.culprit.id,
          method: m.id,
          room: c.scene.id,
          evidence: s.found,
        }),
        'won',
      );
      const restored = restorePrototype(d, JSON.stringify(s));
      assert.equal(restored.worldId, w.id);
      assert.equal(restored.caseId, c.id);
      assert.equal(restored.result, 'won');
    }
    for (const item of [...d.world.people, ...d.world.rooms])
      if (item.image) assert.ok(existsSync('public' + item.image));
    if (w.id === 'medieval')
      assert.ok(!prototypeMethods(d).some(m => ['revolver', 'laser', 'artifact'].includes(m.id)));
  });
test('random world is resolved once; unknown world paths rejected', () => {
  assert.equal(
    selectWorld('random', () => 0),
    'scifi',
  );
  assert.equal(
    selectWorld('random', () => 0.99),
    'noir',
  );
  assert.throws(() => worldFile('../world.json'));
  const d = JSON.parse(readFileSync('public/prototype/world.json'));
  const s = newPrototype(d, { seed: 'legacy' });
  delete s.worldId;
  assert.equal(restorePrototype(d, s).worldId, 'scifi');
});
