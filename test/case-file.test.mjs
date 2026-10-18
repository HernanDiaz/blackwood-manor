import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  newPrototype,
  restorePrototype,
  createPrototypeCase,
  exportCaseFile,
  worldFromCase,
  accusePrototype,
} from '../src/prototype-engine.mjs';
import { normalizeCaseFile, analyzeCase, validateCaseFile } from '../src/case-file.mjs';
import { createLegacyCase } from '../src/legacy-prototype-case.mjs';
const noir = JSON.parse(readFileSync('public/prototype/worlds/noir.json'));
const sample = () => exportCaseFile(newPrototype(noir, { seed: 'case-file-test' }));
const errorsOf = file => analyzeCase(normalizeCaseFile(file)).errors.join(' ');

test('an exported case starts the same investigation when imported', () => {
  const state = newPrototype(noir, { seed: 'case-file-test' }),
    file = JSON.parse(JSON.stringify(exportCaseFile(state)));
  assert.equal(file.id, undefined);
  assert.equal(file.crime.culprit, createPrototypeCase(noir, state).culprit.id);
  const imported = newPrototype(worldFromCase(file), { caseFile: file, worldId: 'file' });
  assert.equal(imported.caseId, state.caseId);
  assert.deepEqual(imported.found, []);
  assert.equal(restorePrototype(null, JSON.stringify(imported)).caseId, state.caseId);
});

test('hand-edited cases are checked for a single deducible culprit', () => {
  const file = sample(),
    c = createPrototypeCase(null, { case: file }),
    analysis = analyzeCase(normalizeCaseFile(file)),
    // An innocent with a motive and no confirmed alibi: giving them access makes two suspects.
    rival = analysis.motive.find(p => p !== c.culprit.id && analysis.opportunity.includes(p));
  const ambiguous = structuredClone(file);
  ambiguous.clues.find(x => x.fact.type === 'access').fact.people.push(rival);
  assert.match(errorsOf(ambiguous), /ambigua/);
  const unproven = structuredClone(file);
  for (const clue of unproven.clues.filter(x => c.proof[2].includes(x.id)))
    clue.fact = { type: 'note' };
  assert.match(errorsOf(unproven), /desmiente la coartada/);
  const unexplained = structuredClone(file);
  unexplained.clues.find(x => x.fact.type === 'explains').fact = { type: 'note' };
  assert.match(errorsOf(unexplained), /engañosa sin explicación/);
  const impossible = structuredClone(file);
  impossible.crime.discoveryMinute = impossible.crime.exitMinute - 1;
  assert.match(errorsOf(impossible), /cronología/);
  const innocentLie = structuredClone(file);
  const pair = innocentLie.clues.find(x => x.fact.type === 'presence' && x.fact.exclusive);
  pair.fact.people = pair.fact.people.slice(1);
  assert.match(errorsOf(innocentLie), /inocente|confirman y desmienten|no permiten/);
  assert.throws(() => validateCaseFile(ambiguous), /Expediente incoherente/);
});

test('imported files only keep known fields and safe image paths', () => {
  const file = sample();
  file.people[0].image = 'https://example.com/x.webp';
  assert.throws(() => normalizeCaseFile(file), /Imagen no permitida/);
  const extra = sample();
  extra.people[0].script = '<script>';
  extra.unknown = true;
  const normalized = normalizeCaseFile(extra);
  assert.equal(normalized.people[0].script, undefined);
  assert.equal(normalized.unknown, undefined);
  assert.throws(() => normalizeCaseFile({ ...sample(), format: 'otro' }), /compatible/);
});

test('old saves from a prepared world become case files with the same progress', () => {
  const old = createLegacyCase(noir, { seed: 'old-noir' }),
    save = {
      version: 1,
      worldId: 'noir',
      revision: noir.revision,
      seed: 'old-noir',
      caseId: old.id,
      room: old.scene.id,
      found: old.clues.slice(0, 7).map(x => x.id),
      pinned: [],
      notes: '',
      chat: [],
      result: null,
    },
    state = restorePrototype(noir, save),
    c = createPrototypeCase(null, state);
  assert.equal(state.version, 2);
  assert.equal(state.worldId, 'noir');
  assert.deepEqual(state.found, save.found);
  assert.equal(c.culprit.id, old.culprit.id);
  assert.ok(c.timing.discoveryMinute > c.timing.exitMinute);
  assert.equal(
    accusePrototype(
      c,
      { ...state, found: old.clues.map(x => x.id) },
      {
        person: old.culprit.id,
        method: old.method.id,
        room: old.scene.id,
        evidence: old.clues.filter(x => x.person === old.culprit.id).map(x => x.id),
      },
    ),
    'won',
  );
  assert.throws(() => restorePrototype(noir, { ...save, caseId: 'orbital-00000000' }));
});
