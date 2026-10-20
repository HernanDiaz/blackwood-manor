// The English version of the game: worlds, classic cases, the interrogation and the screens.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { worlds } from '../src/prototype-worlds.mjs';
import { normalizeWorld, worldWeapons } from '../src/world-file.mjs';
import { statementKinds, englishVariants, phrasingIssue } from '../src/statements.mjs';
import { validateCaseFile, hydrateCase } from '../src/case-file.mjs';
import {
  newPrototype,
  createPrototypeCase,
  inspectPrototype,
  accusePrototype,
  prototypeResolution,
  presentEvidence,
  retellPrototype,
} from '../src/prototype-engine.mjs';
import { answerOffline } from '../src/interrogation.mjs';
import { nextHint, noteEntry } from '../src/guidance.mjs';
import { predictLogistic } from '../src/question-router.mjs';
import { uiText, deviceLanguage } from '../src/ui-text.mjs';
import { splitBank } from './question-bank.en.mjs';
import { routingQuestions } from './routing-questions.en.mjs';
import { loadWorld } from './worlds-fixture.mjs';

const json = path => JSON.parse(readFileSync(path, 'utf8'));
const english = id => normalizeWorld(json(`public/worlds/${id}.en.json`));
const router = json('src/question-router-model.en.json');
const solve = (c, s) => {
  for (const clue of c.clues) {
    s.room = clue.room;
    inspectPrototype(c, s, clue.id);
  }
};
// Lists of a world or a case keep their lengths and texts keep their placeholders.
function sameShape(a, b, where) {
  if (Array.isArray(a)) {
    assert.ok(Array.isArray(b) && a.length === b.length, where);
    a.forEach((x, i) => sameShape(x, b[i], `${where}[${i}]`));
  } else if (a && typeof a === 'object')
    for (const k of Object.keys(a)) sameShape(a[k], b[k], `${where}.${k}`);
  else if (typeof a === 'string') {
    const marks = t => [...t.matchAll(/\{(\w+)\}/g)].map(m => m[1].toLowerCase()).sort();
    assert.deepEqual(marks(b), marks(a), where);
  }
}

for (const { id } of worlds)
  test(`the English ${id} tells the same cases as the Spanish one`, () => {
    const es = loadWorld(id),
      en = english(id);
    assert.equal(en.lang, 'en');
    sameShape(es, en, id);
    for (const difficulty of ['easy', 'medium', 'hard'])
      for (const seed of ['a', 'b', 'c', 'd']) {
        const a = createPrototypeCase(newPrototype(es, { seed, difficulty })),
          b = createPrototypeCase(newPrototype(en, { seed, difficulty }));
        assert.equal(b.lang, 'en');
        assert.equal(b.culprit.id, a.culprit.id);
        assert.deepEqual(
          b.clues.map(x => [x.id, x.room, x.fact]),
          a.clues.map(x => [x.id, x.room, x.fact]),
        );
        // No Spanish word slips into an English case (names such as "Leonor del Valle" aside).
        const names = [b.victim, ...b.people].map(p => p.name);
        for (const x of b.clues)
          assert.doesNotMatch(
            names.reduce((t, n) => t.split(n).join(''), x.text),
            /\b(el|la|las|los|del|según)\b/,
            x.text,
          );
      }
    for (const weapon of worldWeapons(en)) {
      const s = newPrototype(en, { seed: 'w', forcedMethodId: weapon.method }),
        c = createPrototypeCase(s);
      solve(c, s);
      assert.equal(
        accusePrototype(c, s, {
          person: c.culprit.id,
          method: weapon.method,
          room: c.scene.id,
          evidence: c.proof.map(group => group[0]),
        }),
        'won',
      );
      assert.match(prototypeResolution(c, s), new RegExp('^' + c.culprit.name + ' killed '));
    }
  });

test('a game changes language and keeps its progress', () => {
  const es = loadWorld('villa-bellavista'),
    s = newPrototype(es, { seed: 'x', difficulty: 'hard', previousMethodId: 'knife' }),
    c = createPrototypeCase(s);
  inspectPrototype(c, s, c.clues[0].id);
  s.notes = 'sospecho de alguien';
  const en = newPrototype(english('villa-bellavista'), { ...s.case.origin }).case,
    told = retellPrototype(s, en);
  assert.ok(told);
  assert.equal(createPrototypeCase(told).lang, 'en');
  assert.deepEqual(told.found, s.found);
  assert.equal(told.notes, s.notes);
  // A different case is never taken for a translation.
  const other = newPrototype(english('villa-bellavista'), { seed: 'y' }).case;
  assert.equal(retellPrototype(s, other), null);
});

test('the English classic cases are valid and match the Spanish ones', () => {
  const index = json('public/cases/index.en.json').cases;
  assert.equal(index.length, json('public/cases/index.json').cases.length);
  for (const k of index) {
    const es = json('public/cases/' + k.file),
      en = json('public/cases/' + k.file.replace('.json', '.en.json'));
    sameShape(es, en, k.file);
    const c = hydrateCase(validateCaseFile(en));
    assert.equal(c.lang, 'en');
    assert.equal(c.title, k.title);
    const s = newPrototype(null, { caseFile: es });
    assert.ok(retellPrototype(s, en), k.file);
  }
});

test('the English interrogation, hints and notebook speak English', () => {
  const s = newPrototype(english('blackwood-manor'), { seed: 'talk' }),
    c = createPrototypeCase(s);
  solve(c, s);
  const ask = (person, q) => answerOffline(c, s, person, q, { questionRouter: router });
  assert.equal(ask('p1', 'Where were you when he died?').topic, 'alibi');
  assert.equal(ask('p2', 'Hello, how are you?').topic, 'social');
  assert.equal(ask('p3', 'What is your name?').topic, 'identity');
  assert.match(ask('p4', 'Did you kill him?').answer, /evidence/);
  assert.match(presentEvidence(c, s, 'p1', c.clues[0].id).question, /^You show them/);
  assert.match(nextHint(c, s).text, /notebook/);
  assert.match(noteEntry(c, s, 'p1', 'motive', c.clues[0].id).message, /motive/);
  for (const [kind, spec] of Object.entries(statementKinds)) {
    assert.equal(englishVariants[kind].length, spec.variants.length, kind);
    for (const v of englishVariants[kind]) assert.equal(phrasingIssue(kind, v), null, v);
  }
});

test('the English router places most natural questions', () => {
  const placed = qs => qs.filter(([q, t]) => predictLogistic(router, q).topic === t).length;
  assert.ok(placed(routingQuestions) / routingQuestions.length >= 0.9);
  const held = splitBank().test.map(q => [q.question, q.topic]);
  assert.ok(placed(held) / held.length >= 0.75);
});

test('the screens have every text in both languages', () => {
  const keys = o =>
    Object.entries(o)
      .flatMap(([k, v]) =>
        v && typeof v === 'object' && !Array.isArray(v) ? keys(v).map(x => k + '.' + x) : [k],
      )
      .sort();
  assert.deepEqual(keys(uiText.en), keys(uiText.es));
  assert.equal(deviceLanguage(['es-ES', 'en']), 'es');
  assert.equal(deviceLanguage(['en-GB', 'es']), 'en');
  assert.equal(deviceLanguage(['fr-FR']), 'en');
});
