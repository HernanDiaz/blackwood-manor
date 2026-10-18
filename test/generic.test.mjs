import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateMystery, candidates } from '../benchmarks/test-generic-generation.mjs';
const mystery = JSON.parse(
  await fs.readFile(
    new URL('../benchmarks/generic-pilot/reviewed/mystery.json', import.meta.url),
    'utf8',
  ),
);
test('generic pilot has independent characters, six rooms, fifteen discoverable proofs and a single solution', () => {
  assert.deepEqual(validateMystery(mystery), []);
  assert.equal(mystery.world.people.length, 5);
  assert.equal(mystery.world.rooms.length, 6);
  assert.equal(mystery.clues.length, 15);
  assert.equal(
    new Set([...mystery.world.people.map(p => p.name), mystery.plot.victim.name]).size,
    6,
  );
  assert.deepEqual(
    candidates(
      mystery,
      mystery.clues.map(c => c.id),
    ),
    [mystery.plot.culprit],
  );
  const found = mystery.world.rooms.flatMap(r =>
    mystery.clues.filter(c => c.room === r.id).map(c => c.id),
  );
  assert.equal(new Set(found).size, 15);
});
test('generic validator rejects victim/suspect collision, missing introduction, duplicate clues and self-witnesses', () => {
  for (const corrupt of [
    m => (m.plot.victim.name = m.world.people[0].name),
    m => (m.world.premise = ''),
    m => (m.clues[1].id = m.clues[0].id),
    m => {
      const a = m.alibis.find(a => a.person !== m.plot.culprit);
      a.witness = a.person;
    },
  ]) {
    const m = structuredClone(mystery);
    corrupt(m);
    assert(validateMystery(m).length > 0);
  }
});
test('generic evidence graph cannot accept multiple culprits or omit a required category', () => {
  const m = structuredClone(mystery),
    innocent = m.world.people.find(p => p.id !== m.plot.culprit).id;
  m.plan.filter(p => p.person === innocent).forEach(p => (p.effect = 'supports'));
  assert(validateMystery(m).includes('Las pruebas no conducen a una única solución.'));
  for (const category of ['motive', 'link', 'opportunity'])
    assert.deepEqual(
      candidates(
        mystery,
        mystery.plan.filter(p => p.category !== category).map(p => p.id),
      ),
      [],
    );
  let wins = 0;
  for (const p of mystery.world.people)
    for (const r of mystery.world.rooms)
      for (const method of [mystery.plot.method, 'otra causa', 'otro método'])
        wins += Number(
          candidates(
            mystery,
            mystery.clues.map(c => c.id),
          ).includes(p.id) &&
            r.id === mystery.plot.crimeRoom &&
            method === mystery.plot.method,
        );
  assert.equal(wins, 1);
});
test('review preserves forensic facts and removes observed presentation failures', async () => {
  const before = JSON.parse(
    await fs.readFile(
      new URL('../benchmarks/generic-pilot/guided/mystery.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(mystery.plot.culprit, before.plot.culprit);
  assert.equal(mystery.plot.method, before.plot.method);
  assert.deepEqual(mystery.plan, before.plan);
  for (const c of mystery.clues)
    assert.equal(
      c.text,
      before.clues
        .find(x => x.id === c.id)
        .text.replaceAll('Quedón de Recuperación', 'Enfermería orbital')
        .replaceAll('Cama y Sueño', mystery.world.rooms[5].name),
    );
  assert(!mystery.world.people[2].personality.includes('Elena'));
  assert(mystery.world.premise.includes(mystery.plot.victim.name));
  assert.equal(new Set(mystery.clues.map(c => c.imagePrompt)).size, 15);
});
test('26 generic pilot images are bound to their frozen case and content hashes', async () => {
  const dir = new URL('../benchmarks/generic-pilot/images/' + mystery.id + '/', import.meta.url),
    manifest = JSON.parse(await fs.readFile(new URL('manifest.json', dir), 'utf8'));
  assert.equal(manifest.caseId, mystery.id);
  assert.equal(manifest.finalized, true);
  assert.equal(manifest.assets.length, 26);
  for (const asset of manifest.assets) {
    const bytes = await fs.readFile(new URL(asset.file, dir));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  }
});
