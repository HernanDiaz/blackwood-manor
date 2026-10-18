// Free-text worlds were removed; these tests keep their old saves playable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCustomWorld, resolvePrototypeWorld } from '../src/custom-world.mjs';
import {
  newPrototype,
  createPrototypeCase,
  restorePrototype,
  accusePrototype,
  inspectPrototype,
  prototypeMethods,
} from '../src/prototype-engine.mjs';
import { imagePlan } from '../src/session-images.mjs';
const base = JSON.parse(readFileSync('public/prototype/worlds/medieval.json'));
const raw = {
  ...base,
  custom: true,
  revision: 'custom-v1',
  description: 'Un castillo medieval sobre un volcán',
  visualStyle: 'medieval volcanic castle oil painting',
};
raw.world.people.forEach(
  (p, i) => (p.imagePrompt = 'portrait of adult medieval investigator ' + i),
);
raw.world.rooms.forEach((r, i) => (r.imagePrompt = 'volcanic medieval castle room ' + i));
const data = validateCustomWorld(raw);
test('custom snapshot roundtrip, complete solutions and themed image plans', async () => {
  for (const method of prototypeMethods(data)) {
    const state = newPrototype(data, { seed: 'custom-test', forcedMethodId: method.id }),
      c = createPrototypeCase(data, state);
    assert.equal(state.worldId, 'custom');
    const loaded = await resolvePrototypeWorld(process.cwd(), JSON.parse(JSON.stringify(state)));
    assert.deepEqual(
      loaded.world.people.map(p => p.name),
      data.world.people.map(p => p.name),
    );
    assert.equal(loaded.description, data.description);
    assert.equal(createPrototypeCase(loaded, state).id, c.id);
    for (const clue of c.clues) {
      state.room = clue.room;
      inspectPrototype(c, state, clue.id);
    }
    accusePrototype(c, state, {
      person: c.culprit.id,
      method: c.method.id,
      room: c.scene.id,
      evidence: state.found,
    });
    assert.equal(state.result, 'won');
    assert.equal(restorePrototype(loaded, state).result, 'won');
    const plan = imagePlan(data, c);
    assert.ok(plan.find(j => j.id === 'room-r1').prompt.includes('volcanic medieval castle'));
    assert.ok(plan.find(j => j.id === 'person-p1').prompt.includes('adult medieval investigator'));
  }
});
test('invalid dimensions, duplicate names, unsafe text and changed snapshots rejected', () => {
  const bad = structuredClone(raw);
  bad.world.people[0].name = bad.victim.name;
  assert.throws(() => validateCustomWorld(bad));
  assert.throws(() => validateCustomWorld({ ...raw, description: '<script>' }));
  assert.throws(() => validateCustomWorld({ ...raw, world: { ...raw.world, rooms: [] } }));
  const state = newPrototype(data, { seed: 'custom-test' });
  const changed = structuredClone(state);
  changed.case.rooms[0].name += ' X';
  assert.throws(() => restorePrototype(data, changed));
});
