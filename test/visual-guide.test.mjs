import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { visualGuide, validateVisualGuide, guidedImagePlan } from '../src/visual-guide.mjs';
import { imagePlan } from '../src/session-images.mjs';
import { newPrototype, createPrototypeCase } from '../src/prototype-engine.mjs';
const data = JSON.parse(await readFile('public/prototype/worlds/medieval.json'));
data.custom = true;
data.description = 'Una colonia de enanos en las profundidades de una montaña';
data.rules = { technology: 'preindustrial', magic: false };
const guide = {
  population: 'adult fantasy dwarf, braided beard and leather clothes',
  architecture: 'underground dwarven mountain halls, carved stone arches',
  materials: 'stone, iron and leather',
  lighting: 'warm amber torchlight',
};
test('visual guide preserves species, geography and world restrictions', () => {
  assert.deepEqual(validateVisualGuide(guide, data), guide);
  for (const bad of [
    { population: 'adult human man' },
    { architecture: 'a modern city house' },
    { materials: 'laser and electronic panels' },
    { lighting: 'magical enchanted glow' },
  ])
    assert.throws(() => validateVisualGuide({ ...guide, ...bad }, data));
});
test('visual guide retries invalid direction then caches it without altering the world', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'visual-guide-')),
    original = JSON.stringify(data);
  let calls = 0;
  try {
    const g = await visualGuide(root, data, {
      request: async () => {
        calls++;
        return calls === 1 ? { ...guide, population: 'adult man' } : guide;
      },
    });
    assert.equal(calls, 2);
    assert.deepEqual(
      await visualGuide(root, data, {
        request: () => {
          throw Error('must reuse');
        },
      }),
      g,
    );
    assert.equal(JSON.stringify(data), original);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('shared direction reaches every image while evidence subject stays unchanged', () => {
  const c = createPrototypeCase(data, newPrototype(data, { seed: 'visual-test' })),
    before = imagePlan(data, c),
    after = guidedImagePlan(data, before, guide);
  assert.equal(after.length, before.length);
  for (const j of after) {
    assert.ok(j.prompt.includes(guide.lighting));
    if (j.id.startsWith('person-')) assert.ok(j.prompt.includes(guide.population));
    if (j.id.startsWith('room-')) assert.ok(j.prompt.startsWith(guide.architecture));
  }
  const proof = c.clues.find(x => x.fact.type === 'weapon');
  assert.ok(after.find(j => j.id === 'clue-' + proof.id).prompt.includes(c.method.imagePrompt));
  assert.deepEqual(guidedImagePlan(data, before, null), before);
});
test('visual guide gives up after three invalid attempts without silently accepting them', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'visual-bounded-'));
  let calls = 0;
  try {
    await assert.rejects(
      visualGuide(root, data, {
        request: async () => {
          calls++;
          return { ...guide, population: 'adult human man' };
        },
      }),
      /guía visual coherente/,
    );
    assert.equal(calls, 3);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
