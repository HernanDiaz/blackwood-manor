import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newPrototype,
  restorePrototype,
  createPrototypeCase,
  inspectPrototype,
} from '../src/prototype-engine.mjs';
import {
  conditions,
  checkEntry,
  noteEntry,
  clearEntry,
  notebookSuspects,
  nextHint,
} from '../src/guidance.mjs';
import { allWorlds, loadWorld } from './worlds-fixture.mjs';

const findAll = (c, s) => {
  for (const clue of c.clues) {
    s.room = clue.room;
    inspectPrototype(c, s, clue.id);
  }
};
// Notes every entry that some found clue proves.
const noteEverything = (c, s) => {
  for (const p of c.people)
    for (const condition of conditions)
      for (const id of s.found) if (noteEntry(c, s, p.id, condition, id).ok) break;
};

test('a complete notebook points at the culprit and nobody else, in every world', () => {
  for (const world of allWorlds())
    for (const seed of ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']) {
      const s = newPrototype(world, { seed }),
        c = createPrototypeCase(s);
      findAll(c, s);
      noteEverything(c, s);
      assert.deepEqual(notebookSuspects(c, s), [c.culprit.id], `${world.id} ${seed}`);
    }
});

test('the notebook keeps only what a found clue proves', () => {
  const s = newPrototype(loadWorld('villa-bellavista'), { seed: 'notes' }),
    c = createPrototypeCase(s),
    motive = c.proof[0][0];
  assert.match(checkEntry(c, s, c.culprit.id, 'motive', motive).message, /encontrado/);
  findAll(c, s);
  const other = c.people.find(p => p.id !== c.culprit.id).id;
  const wrong = noteEntry(c, s, other, 'motive', motive);
  assert.equal(wrong.ok, false);
  assert.match(wrong.message, /no muestra ningún motivo/);
  assert.equal(s.notebook[other]?.motive, undefined);
  assert.ok(noteEntry(c, s, c.culprit.id, 'motive', motive).ok);
  const refuted = noteEntry(c, s, c.culprit.id, 'alibi', c.proof[2][0]);
  assert.equal(refuted.verdict, 'refuted');
  assert.match(refuted.message, /desmiente/);
  clearEntry(s, c.culprit.id, 'motive');
  assert.equal(s.notebook[c.culprit.id].motive, undefined);
});

test('a saved notebook keeps its correct entries and drops forged ones', () => {
  const s = newPrototype(loadWorld('torre-umbria'), { seed: 'save-notes' }),
    c = createPrototypeCase(s);
  findAll(c, s);
  noteEverything(c, s);
  const other = c.people.find(p => p.id !== c.culprit.id).id;
  const forged = structuredClone(s);
  forged.notebook[other] = { alibi: { clue: c.proof[2][0], verdict: 'refuted' } };
  forged.help = { stage: 'alibi', level: 99, used: 4 };
  const restored = restorePrototype(JSON.stringify(forged));
  assert.equal(restored.notebook[other]?.alibi, undefined);
  assert.deepEqual(notebookSuspects(c, restored), [c.culprit.id]);
  assert.equal(restored.help.level, 3);
  assert.equal(restored.help.used, 4);
});

test('hints go stage by stage, get more concrete and finally name the clue', () => {
  for (const world of allWorlds()) {
    const s = newPrototype(world, { seed: 'hints' }),
      c = createPrototypeCase(s),
      stages = [];
    // A player who follows every hint to its last level and then reads that clue.
    for (let i = 0; i < 40 && s.help.stage !== 'accuse'; i++) {
      const h = nextHint(c, s);
      if (!stages.includes(s.help.stage)) stages.push(s.help.stage);
      assert.ok(!h.text.includes(c.culprit.name), `${world.id}: ${h.text}`);
      const named = c.clues.find(x => h.text.includes('«' + x.title + '»'));
      if (h.last && named) {
        s.room = named.room;
        inspectPrototype(c, s, named.id);
      }
      if (s.help.stage === 'notebook' && h.last) {
        findAll(c, s);
        noteEverything(c, s);
      }
    }
    assert.deepEqual(
      stages,
      ['cause', 'motive', 'access', 'alibi', 'notebook', 'accuse'],
      world.id,
    );
    assert.ok(s.help.used >= 6);
  }
});
