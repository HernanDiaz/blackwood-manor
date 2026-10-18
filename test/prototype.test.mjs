import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  newPrototype,
  restorePrototype,
  createPrototypeCase,
  prototypeMethods,
  inspectPrototype,
  prototypeFacts,
  prototypeOptions,
  accusePrototype,
} from '../src/prototype-engine.mjs';
import { methodRoomPairs } from '../src/method-catalog.mjs';
import { respondPrototype } from '../src/prototype-llm.mjs';
const data = JSON.parse(
  await fs.readFile(new URL('../public/prototype/world.json', import.meta.url), 'utf8'),
);
function full(methodId, seed = 'test-' + methodId) {
  const s = newPrototype(data, { seed, forcedMethodId: methodId }),
    c = createPrototypeCase(data, s);
  for (const r of c.rooms) {
    s.room = r.id;
    for (const clue of c.clues.filter(x => x.room === r.id)) inspectPrototype(c, s, clue.id);
  }
  return { c, s };
}
test('orbital playable prototype instantiates all fifteen methods with compatible scenes and stable definitions', () => {
  assert.equal(prototypeMethods(data).length, 15);
  for (const m of prototypeMethods(data)) {
    const { s, c } = full(m.id);
    assert.equal(c.method.id, m.id);
    assert.equal(s.found.length, c.clues.length);
    assert(
      methodRoomPairs('scifi', c.rooms).some(p => p.methodId === m.id && p.roomId === c.scene.id),
    );
    assert.deepEqual(createPrototypeCase(data, s), c);
    assert(c.timing.deathMinute > c.timing.crimeMinute);
    assert(c.timing.discoveryMinute > c.timing.exitMinute);
    assert.equal(c.proof.length, 3);
    assert(c.proof.every(group => group.length));
  }
});
test('secrets and material/timeline admissions require the current actor proof, not a clue from another actor', () => {
  const s = newPrototype(data, { seed: 'gates' }),
    c = createPrototypeCase(data, s),
    actor = c.culprit.id;
  assert.deepEqual(
    prototypeFacts(c, s, actor).map(f => f.id),
    ['alibi', 'motive', 'seen'],
  );
  const other = c.clues.find(x => x.fact.type === 'motive' && x.fact.person !== actor);
  s.found = [other.id];
  assert(!prototypeFacts(c, s, actor).some(f => f.id === 'secret'));
  for (const [group, topic] of [
    [0, 'secret'],
    [1, 'link'],
    [2, 'timeline'],
  ]) {
    s.found = [c.proof[group][0]];
    assert(prototypeFacts(c, s, actor).some(f => f.id === topic));
  }
});
test('save/import preserves case, weapon, evidence, notes and chat and rejects rerolls or foreign cases', () => {
  const { c, s } = full('knife');
  s.notes = 'Una teoría';
  s.pinned = [s.found[0]];
  s.chat = [{ person: 'p1', question: 'coartada', answer: 'Texto guardado' }];
  assert.deepEqual(restorePrototype(data, JSON.stringify(s)), s);
  const edited = structuredClone(s);
  edited.case.crime.motive = 'Otro móvil.';
  assert.throws(() => restorePrototype(data, edited));
  assert.throws(() => restorePrototype(data, { ...s, caseId: 'foreign' }));
  assert.throws(() =>
    inspectPrototype(createPrototypeCase(data, newPrototype(data, { seed: 'different' })), s, 'c1'),
  );
  const loaded = restorePrototype(data, s);
  assert.equal(createPrototypeCase(data, loaded).method.id, c.method.id);
});
test('6750 accusation combinations identify one solution for every supported method and require all proof categories', () => {
  let checked = 0;
  for (const m of prototypeMethods(data)) {
    const { c, s } = full(m.id),
      proof = c.proof.map(group => group[0]);
    let wins = 0;
    for (const p of c.people)
      for (const weapon of prototypeMethods(data))
        for (const r of c.rooms) {
          const state = structuredClone(s),
            won =
              accusePrototype(c, state, {
                person: p.id,
                method: weapon.id,
                room: r.id,
                evidence: proof,
              }) === 'won';
          assert.equal(
            won,
            p.id === c.culprit.id && weapon.id === c.method.id && r.id === c.scene.id,
          );
          wins += Number(won);
          checked++;
        }
    assert.equal(wins, 1);
    for (const group of c.proof) {
      const state = structuredClone(s),
        evidence = s.found.filter(id => !group.includes(id));
      assert.equal(
        accusePrototype(c, state, {
          person: c.culprit.id,
          method: m.id,
          room: c.scene.id,
          evidence,
        }),
        'lost',
      );
    }
  }
  assert.equal(checked, 6750);
});
test('new surprise cases prefer a different weapon family and culprit while forced tests remain explicit', () => {
  let s = newPrototype(data, { seed: 'first' }),
    c = createPrototypeCase(data, s);
  for (let i = 0; i < 50; i++) {
    const next = newPrototype(data, {
        seed: 'next-' + i,
        previousMethodId: c.method.id,
        previousPersonId: c.culprit.id,
      }),
      nc = createPrototypeCase(data, next);
    assert.notEqual(nc.method.family, c.method.family);
    assert.notEqual(nc.culprit.id, c.culprit.id);
    c = nc;
  }
  assert.throws(() => newPrototype(data, { seed: 'forced', forcedMethodId: 'artifact' }));
});
test('orbital interrogator does not leak locked facts and rejects unsupported generated text', async () => {
  const s = newPrototype(data, { seed: 'dialogue' }),
    c = createPrototypeCase(data, s),
    person = c.culprit.id;
  const locked = await respondPrototype(
    data,
    { state: s, person, question: '¿Qué ocultas?' },
    { useModel: false },
  );
  const secret = c.facts[person].find(f => f.id === 'secret').text;
  assert(!locked.answer.includes(secret));
  s.found = [c.proof[0][0]];
  const unlocked = await respondPrototype(
    data,
    { state: s, person, question: '¿Qué ocultas?' },
    { useModel: false },
  );
  assert(unlocked.answer.includes(secret));
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"text":"El culpable es un personaje inventado."}' } }],
      }),
    });
    const r = await respondPrototype(
      data,
      { state: s, person, question: '¿Dónde estabas?' },
      { useModel: true },
    );
    assert(prototypeOptions(c, s, person, 'alibi').includes(r.answer));
    assert.equal(r.mode, 'prototype-engine');
  } finally {
    globalThis.fetch = original;
  }
});
test('method illustrations are immutable and available for every selectable weapon', async () => {
  const folder = new URL('../public/prototype/assets/', import.meta.url),
    manifest = JSON.parse(await fs.readFile(new URL('manifest.json', folder), 'utf8'));
  assert(manifest.finalized);
  assert.equal(manifest.assets.length, 15);
  for (const method of prototypeMethods(data)) {
    const asset = manifest.assets.find(x => x.id === method.id);
    assert(asset);
    const bytes = await fs.readFile(new URL(asset.file, folder));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  }
});
