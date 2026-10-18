import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newPrototype,
  createPrototypeCase,
  inspectPrototype,
  presentEvidence,
  restorePrototype,
} from '../src/prototype-engine.mjs';
import { allWorlds, loadWorld } from './worlds-fixture.mjs';

const setup = (world, seed, difficulty = 'medium') => {
  const s = newPrototype(world, { seed, difficulty }),
    c = createPrototypeCase(s);
  return { s, c };
};
const findAll = (c, s) => {
  for (const clue of c.clues) {
    s.room = clue.room;
    inspectPrototype(c, s, clue.id);
  }
};
const variantsOf = (c, person, topic) => {
  const f = c.facts[person].find(x => x.id === topic);
  return f.variants || [f.text];
};

test('shown their own evidence, people answer what it unlocks, in their voice', () => {
  for (const world of allWorlds()) {
    const { s, c } = setup(world, 'show'),
      culprit = c.culprit.id;
    assert.throws(() => presentEvidence(c, s, culprit, c.proof[0][0]), /encontradas/);
    findAll(c, s);
    const motive = presentEvidence(c, s, culprit, c.proof[0][0]);
    assert.ok(variantsOf(c, culprit, 'secret').includes(motive.answer), world.id);
    assert.equal(motive.topic, 'secret');
    const alibi = presentEvidence(c, s, culprit, c.proof[2][0]);
    assert.ok(variantsOf(c, culprit, 'timeline').includes(alibi.answer), world.id);
    const access = presentEvidence(c, s, culprit, c.proof[1][0]);
    assert.equal(access.topic, 'link');
    // Showing it again gives another wording of the same thing.
    const again = presentEvidence(c, s, culprit, c.proof[0][0]);
    if (variantsOf(c, culprit, 'secret').length > 1) assert.notEqual(again.answer, motive.answer);
  }
});

test('evidence about someone else points at that person; the rest is evaded', () => {
  const { s, c } = setup(loadWorld('torre-umbria'), 'other'),
    culprit = c.culprit;
  findAll(c, s);
  const other = c.people.find(
    p => p.id !== culprit.id && !c.facts[p.id].some(f => f.requires === c.proof[0][0]),
  );
  const reply = presentEvidence(c, s, other.id, c.proof[0][0]);
  assert.ok(reply.answer.includes(culprit.name), reply.answer);
  const cause = c.clues.find(x => x.fact.type === 'cause');
  const evaded = presentEvidence(c, s, other.id, cause.id);
  assert.equal(evaded.topic, 'unknown');
  assert.ok(variantsOf(c, other.id, 'unknown').includes(evaded.answer));
});

test('the owner of a misleading object explains it; the chat keeps what was shown', () => {
  const { s, c } = setup(loadWorld('villa-bellavista'), 'herring', 'hard');
  findAll(c, s);
  for (const herring of c.clues.filter(x => x.fact.type === 'herring')) {
    const reply = presentEvidence(c, s, herring.fact.person, herring.id);
    assert.equal(reply.topic, 'object');
  }
  const restored = restorePrototype(JSON.stringify(s));
  assert.ok(restored.chat.some(m => m.evidence && m.question.startsWith('Le enseñas')));
  s.result = 'won';
  assert.throws(() => presentEvidence(c, s, 'p1', c.clues[0].id), /no disponible/);
});
