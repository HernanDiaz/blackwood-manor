import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyProgress,
  restoreProgress,
  unlockedFacts,
  discoverClue,
  judgeAccusation,
} from '../src/investigation.mjs';

const view = {
  people: [{ id: 'a' }, { id: 'b' }],
  rooms: [{ id: 'r1' }, { id: 'r2' }],
  startRoom: 'r1',
  methods: ['knife', 'rope'],
  clues: [
    { id: 'm', room: 'r1' },
    { id: 'l', room: 'r1' },
    { id: 'o', room: 'r2' },
    { id: 'x', room: 'r2' },
  ],
  facts: {
    a: [
      { id: 'alibi', text: 'Estuve fuera.' },
      { id: 'secret', text: 'Lo admito.', requires: 'm' },
    ],
  },
  solution: { person: 'a', method: 'knife', room: 'r2', proof: [['m'], ['l'], ['o']] },
  messages: {
    closed: 'closed',
    closedAccusation: 'closed-accusation',
    outOfReach: 'out-of-reach',
    incomplete: 'incomplete',
    evidence: 'evidence',
  },
};
const fresh = () => ({ ...emptyProgress('r1') });
const allFound = () => ({ ...fresh(), found: ['m', 'l', 'o', 'x'] });

test('facts stay locked until their clue is found', () => {
  const s = fresh();
  assert.deepEqual(unlockedFacts(view, s, 'a'), [{ id: 'alibi', text: 'Estuve fuera.' }]);
  assert.deepEqual(unlockedFacts(view, s, 'nobody'), []);
  discoverClue(view, s, 'm');
  assert.deepEqual(
    unlockedFacts(view, s, 'a').map(f => f.id),
    ['alibi', 'secret'],
  );
});

test('clues are found only in the current room, once, and not after closing', () => {
  const s = fresh();
  assert.throws(() => discoverClue(view, s, 'o'), /out-of-reach/);
  discoverClue(view, s, 'm');
  discoverClue(view, s, 'm');
  assert.deepEqual(s.found, ['m']);
  s.result = 'lost';
  assert.throws(() => discoverClue(view, s, 'l'), /^Error: closed$/);
});

test('an accusation wins only with the right answer and one clue per proof group', () => {
  const right = { person: 'a', method: 'knife', room: 'r2' };
  assert.equal(judgeAccusation(view, allFound(), { ...right, evidence: ['m', 'l', 'o'] }), 'won');
  assert.equal(judgeAccusation(view, allFound(), { ...right, evidence: ['m', 'l', 'x'] }), 'lost');
  // Each clue has to prove its own condition, and no more than three are accepted.
  assert.equal(judgeAccusation(view, allFound(), { ...right, evidence: ['l', 'm', 'o'] }), 'lost');
  assert.throws(
    () => judgeAccusation(view, allFound(), { ...right, evidence: ['m', 'l', 'o', 'x'] }),
    /evidence/,
  );
  assert.equal(
    judgeAccusation(view, allFound(), { ...right, room: 'r1', evidence: ['m', 'l', 'o'] }),
    'lost',
  );
  assert.throws(
    () => judgeAccusation(view, allFound(), { ...right, method: 'gun', evidence: ['m', 'l', 'o'] }),
    /incomplete/,
  );
  assert.throws(
    () => judgeAccusation(view, allFound(), { ...right, evidence: ['m', 'm', 'm'] }),
    /evidence/,
  );
  assert.throws(
    () =>
      judgeAccusation(view, { ...fresh(), found: ['m'] }, { ...right, evidence: ['m', 'l', 'o'] }),
    /evidence/,
  );
  const closed = { ...allFound(), result: 'won' };
  assert.throws(() => judgeAccusation(view, closed, right), /closed-accusation/);
});

test('restoring progress drops unknown and duplicated data', () => {
  const restored = restoreProgress(view, {
    room: 'void',
    found: ['m', 'm', 'ghost'],
    pinned: ['m', 'm', 'l'],
    notes: 'n'.repeat(12000),
    chat: [
      { person: 'a', question: 'q', answer: 'r' },
      { person: 'ghost', question: 'q', answer: 'r' },
      { person: 'b', question: 1, answer: 'r' },
    ],
    result: 'maybe',
  });
  assert.deepEqual(restored, {
    room: 'r1',
    found: ['m'],
    pinned: ['m'],
    notes: 'n'.repeat(10000),
    chat: [{ person: 'a', question: 'q', answer: 'r' }],
    result: null,
  });
});
