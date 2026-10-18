import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { imagePlan, imageStatus } from '../src/session-images.mjs';
import { worlds } from '../src/prototype-worlds.mjs';
import { newPrototype, restorePrototype, createPrototypeCase } from '../src/prototype-engine.mjs';
for (const w of worlds)
  test('session illustration plan ' + w.id, () => {
    const data = JSON.parse(readFileSync('public/prototype/' + w.file)),
      state = newPrototype(data, { seed: 'images-test' }),
      c = createPrototypeCase(data, state),
      plan = imagePlan(data, c);
    assert.equal(plan.length, 5 + c.rooms.length + c.clues.length);
    assert.equal(new Set(plan.map(j => j.id)).size, plan.length);
    assert.ok(
      plan.every(j => j.prompt.length > 40 && /^(person-p[1-5]|room-r[1-6]|clue-c\d+)$/.test(j.id)),
    );
    assert.equal(
      plan
        .find(j => j.id === 'clue-' + c.clues.find(x => x.fact.type === 'weapon').id)
        .prompt.includes(c.method.imagePrompt),
      true,
    );
    state.imageSet = c.id;
    assert.equal(restorePrototype(data, state).imageSet, c.id);
    state.imageSet = 'other';
    assert.equal(restorePrototype(data, state).imageSet, undefined);
  });
test('image status rejects untrusted paths', async () => {
  await assert.rejects(imageStatus(process.cwd(), '../world.json'));
});
