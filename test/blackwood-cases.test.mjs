// The five hand-written Blackwood Manor cases as case files (public/cases/blackwood-N.json):
// valid, faithful to the original solutions and winnable in the Mundos engine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCaseFile } from '../src/case-file.mjs';
import { cases } from '../src/cases.mjs';
import {
  newPrototype,
  createPrototypeCase,
  inspectPrototype,
  prototypeFacts,
  accusePrototype,
} from '../src/prototype-engine.mjs';

const load = n =>
  JSON.parse(readFileSync(new URL(`../public/cases/blackwood-${n}.json`, import.meta.url)));
const files = [1, 2, 3, 4, 5].map(load);
const personOf = { elena: 'p1', victor: 'p2', clara: 'p3', arthur: 'p4', julian: 'p5' };
const roomOf = {
  study: 'r1',
  library: 'r2',
  dining: 'r3',
  kitchen: 'r4',
  greenhouse: 'r5',
  hall: 'r6',
};
const spoilers = readFileSync(new URL('../docs/CASE-SPOILERS.md', import.meta.url), 'utf8');

function play(file) {
  const s = newPrototype(null, { caseFile: file }),
    c = createPrototypeCase(s);
  for (const r of c.rooms) {
    s.room = r.id;
    for (const clue of c.clues.filter(x => x.room === r.id)) inspectPrototype(c, s, clue.id);
  }
  return { c, s };
}

test('the five Blackwood case files are valid and hand-written', () => {
  for (const raw of files) {
    const file = validateCaseFile(raw);
    assert.equal(file.world, 'blackwood-manor');
    assert.equal(file.origin.generator, 'a-mano');
    assert.equal(file.clues.length, 18);
    assert.equal(file.people.length, 5);
    assert.equal(file.rooms.length, 6);
  }
});

test('each case keeps the title and solution of its original variant', () => {
  assert.match(spoilers, /Víctor Hale mató a Edmund con acónito en el té, en el despacho/);
  assert.equal(files[0].crime.culprit, 'p2');
  assert.equal(files[0].crime.scene, 'r1');
  files.forEach((file, i) => {
    const original = cases[i];
    assert.equal(file.title, original.title);
    assert.equal(file.crime.culprit, personOf[original.solution.person]);
    assert.equal(file.crime.scene, roomOf[original.solution.room]);
    assert.equal(file.crime.method, 'drink');
    const wine = original.solution.weapon === 'wine';
    assert.equal(/vino/.test(file.crime.weapon), wine);
  });
});

test('each case can be won in the Mundos engine with its proof', () => {
  for (const file of files) {
    const { c, s } = play(file);
    assert.deepEqual(c.analysis.suspects, [file.crime.culprit]);
    assert.equal(s.found.length, c.clues.length);
    // Every statement can be unlocked once all the clues are found.
    for (const p of c.people)
      assert(
        prototypeFacts(c, s, p.id).some(f => f.id === 'timeline'),
        p.id,
      );
    const evidence = c.proof.map(group => group[0]);
    assert.equal(
      accusePrototype(c, s, {
        person: c.culprit.id,
        method: c.method.id,
        room: c.scene.id,
        evidence,
      }),
      'won',
    );
  }
});

test('a wrong culprit loses', () => {
  for (const file of files) {
    const { c, s } = play(file),
      other = c.people.find(p => p.id !== c.culprit.id);
    assert.equal(
      accusePrototype(c, s, {
        person: other.id,
        method: c.method.id,
        room: c.scene.id,
        evidence: c.proof.map(group => group[0]),
      }),
      'lost',
    );
  }
});
