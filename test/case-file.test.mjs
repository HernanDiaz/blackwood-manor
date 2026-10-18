import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newPrototype,
  restorePrototype,
  createPrototypeCase,
  exportCaseFile,
  accusePrototype,
} from '../src/prototype-engine.mjs';
import {
  normalizeCaseFile,
  analyzeCase,
  validateCaseFile,
  hydrateCase,
  resolveText,
} from '../src/case-file.mjs';
import { loadWorld } from './worlds-fixture.mjs';
const villa = loadWorld('villa-bellavista');
const sample = () => exportCaseFile(newPrototype(villa, { seed: 'case-file-test' }));
const errorsOf = file => analyzeCase(normalizeCaseFile(file)).errors.join(' ');
const play = file => hydrateCase(normalizeCaseFile(file));

test('an exported case starts the same investigation when imported, without its world', () => {
  const state = newPrototype(villa, { seed: 'case-file-test' }),
    file = JSON.parse(JSON.stringify(exportCaseFile(state)));
  assert.equal(file.id, undefined);
  assert.equal(file.world, 'villa-bellavista');
  assert.equal(file.crime.culprit, createPrototypeCase(state).culprit.id);
  const imported = newPrototype(null, { caseFile: file });
  assert.equal(imported.caseId, state.caseId);
  assert.deepEqual(imported.found, []);
  assert.equal(restorePrototype(JSON.stringify(imported)).caseId, state.caseId);
  const c = createPrototypeCase(imported);
  assert.ok(c.opening.arrival && c.opening.tension);
  assert.ok(c.weapons.some(w => w.method === c.method.id));
  assert.ok(c.method.phrase && c.method.weapon);
});

test('an imported case can be solved with the accusation it offers', () => {
  const state = newPrototype(null, { caseFile: sample() }),
    c = createPrototypeCase(state);
  state.found = c.clues.map(x => x.id);
  assert.equal(
    accusePrototype(c, state, {
      person: c.culprit.id,
      method: c.method.id,
      room: c.scene.id,
      evidence: c.proof.map(group => group[0]),
    }),
    'won',
  );
});

test('hand-edited cases are checked for a single deducible culprit', () => {
  const file = sample(),
    c = play(file),
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
  const unarmed = structuredClone(file);
  unarmed.weapons = unarmed.weapons.filter(w => w.method !== file.crime.method);
  assert.match(errorsOf(unarmed), /no está entre las de la acusación/);
  assert.throws(() => validateCaseFile(ambiguous), /Expediente incoherente/);
});

test('a fall needs a scene with height', () => {
  const file = sample(),
    flat = file.rooms.find(r => !r.tags.includes('elevated'));
  file.crime.method = 'fall';
  file.crime.scene = flat.id;
  assert.match(errorsOf(file), /no se puede usar en la escena/);
});

test('imported files only keep known fields and safe image paths', () => {
  const file = sample();
  file.people[0].image = 'https://example.com/x.webp';
  assert.throws(() => normalizeCaseFile(file), /Imagen no permitida/);
  const extra = sample();
  extra.people[0].script = 'x';
  extra.unknown = true;
  const normalized = normalizeCaseFile(extra);
  assert.equal(normalized.people[0].script, undefined);
  assert.equal(normalized.unknown, undefined);
  const markup = sample();
  markup.clues[0].text = '<img src=x>';
  assert.throws(() => normalizeCaseFile(markup), /caracteres no válidos/);
  assert.throws(() => normalizeCaseFile({ ...sample(), format: 'otro' }), /compatible/);
  assert.throws(() => normalizeCaseFile({ ...sample(), version: 2 }), /compatible/);
});

test('saves of another format are refused', () => {
  const state = newPrototype(villa, { seed: 'save' });
  assert.throws(() => restorePrototype({ ...state, format: 'otro' }), /compatible/);
  assert.throws(() => restorePrototype({ ...state, caseId: 'case-0' }), /no coincide/);
});

test('renaming a person or the victim in a case file updates every text', () => {
  const file = sample(),
    before = play(file),
    oldVictim = file.victim.name,
    oldName = file.people[2].name;
  file.victim.name = 'Ramiro Castell';
  file.people[2].name = 'Olga Brandt';
  const after = play(file),
    texts = [
      after.motive,
      ...after.clues.flatMap(x => [x.title, x.text]),
      ...after.alibis.map(a => a.claim),
      ...Object.values(after.facts).flatMap(list => list.map(f => f.text)),
    ].join(' ');
  assert.ok(!texts.includes(oldVictim));
  assert.ok(!texts.includes(oldName));
  assert.ok(texts.includes('Ramiro Castell'));
  assert.ok(texts.includes('Olga Brandt'));
  assert.notEqual(after.id, before.id);
  assert.ok(!/\{(victim|p\d|r\d)\}/.test(texts));
});

test('articles contract only between whole words', () => {
  const file = sample();
  file.victim.name = 'Gonzalo de Umbría';
  assert.equal(
    resolveText('Debe a {victim} el precio.', file),
    'Debe a Gonzalo de Umbría el precio.',
  );
  assert.equal(
    resolveText('Pregunte a el portero de el castillo.', file),
    'Pregunte al portero del castillo.',
  );
});
