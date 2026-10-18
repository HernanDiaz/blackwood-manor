import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from './worlds-fixture.mjs';
import { statementKinds, phrasingIssue, fillStatement } from '../src/statements.mjs';
import {
  newPrototype,
  createPrototypeCase,
  prototypeFacts,
  inspectPrototype,
} from '../src/prototype-engine.mjs';
import { respondPrototype } from '../src/prototype-llm.mjs';
const villa = loadWorld('villa-bellavista');

test('every default wording is valid for its kind', () => {
  for (const [kind, spec] of Object.entries(statementKinds))
    for (const text of spec.variants) assert.equal(phrasingIssue(kind, text), null, text);
});

test('a wording cannot drop, invent or hard-code a fact', () => {
  assert.match(phrasingIssue('alibi.pair', 'Estuve en {place} de {from} a {to}.'), /partner/);
  assert.match(phrasingIssue('alibi.claim', 'Estuve en {place} de 21:00 a {to}.'), /from/);
  assert.match(
    phrasingIssue('alibi.alone', 'Estuve en {place} de {from} a {to} con {sister}.'),
    /sister/,
  );
  assert.match(phrasingIssue('link.none', 'No tengo la llave de las 3 salas: {access}.'), /cifras/);
  assert.equal(phrasingIssue('timeline.pair', '{Guardian} nos vio; pregúntele.'), null);
  assert.equal(
    fillStatement('{Guardian} nos vio en {place}.', { guardian: 'el mayordomo', place: '{r2}' }),
    'El mayordomo nos vio en {r2}.',
  );
});

test('a world can give each character its own voice, and invalid wordings are ignored', () => {
  const world = structuredClone(villa),
    own = 'Querido, en esta casa nadie ve nada. Yo tampoco.';
  world.people[0].voice = {
    ...world.people[0].voice,
    'seen.nothing': [own],
    'link.none': ['Ni sabía que existía.'],
    'link.access': ['Ni sabía que existía.'],
  };
  let checked = 0;
  for (let i = 0; i < 20; i++) {
    const c = createPrototypeCase(newPrototype(world, { seed: 'voices-' + i })),
      seen = c.facts.p1.find(f => f.kind === 'seen.nothing'),
      link = c.facts.p1.find(f => f.id === 'link');
    if (seen) {
      assert.deepEqual(seen.variants, [own]);
      checked++;
    }
    // The custom link wordings omit {access}, so the other wordings stay.
    assert.ok(link.variants.length > 0);
    assert.ok(link.variants.every(v => !v.includes('Ni sabía')));
  }
  assert.ok(checked > 0);
});

test('generated statements keep their facts in every wording', () => {
  for (let i = 0; i < 20; i++) {
    const c = createPrototypeCase(newPrototype(villa, { seed: 'wording-' + i }));
    for (const alibi of c.alibis) {
      const fact = c.facts[alibi.person].find(f => f.id === 'alibi');
      assert.ok(fact.variants.length >= 2);
      for (const text of fact.variants) {
        assert.ok(text.includes(alibi.claim.match(/\d\d:\d\d/)[0]), text);
        assert.ok(!/\{|\}/.test(text), text);
      }
    }
  }
});

test('choose mode rotates authored wordings, hides locked facts and only asks the model to classify', async () => {
  const s = newPrototype(villa, { seed: 'choose' }),
    c = createPrototypeCase(s),
    person = c.culprit.id,
    calls = [];
  const request = async messages => {
    calls.push(messages[0].content);
    return { id: 'alibi' };
  };
  const answers = [];
  for (let i = 0; i < 3; i++) {
    const r = await respondPrototype(
      { state: s, person, question: 'Cuéntame otra vez lo de esa noche' },
      { useModel: true, request },
    );
    assert.equal(r.mode, 'prototype-choice');
    assert.equal(r.topic, 'alibi');
    answers.push(r.answer);
    s.chat.push({ person, question: 'x', answer: r.answer, topic: r.topic });
  }
  const variants = c.facts[person].find(f => f.id === 'alibi').variants;
  assert.ok(answers.every(a => variants.includes(a)));
  assert.equal(new Set(answers.slice(0, variants.length)).size, Math.min(3, variants.length));
  assert.ok(calls.every(prompt => prompt.startsWith('Clasifica')));
  const locked = await respondPrototype(
    { state: s, person, question: '¿Qué ocultas sobre el documento?' },
    { useModel: false },
  );
  const secret = c.facts[person].find(f => f.id === 'secret');
  assert.ok(!secret.variants.includes(locked.answer));
  assert.ok(c.facts[person].find(f => f.id === 'unknown').variants.includes(locked.answer));
  for (const clue of c.clues) {
    s.room = clue.room;
    inspectPrototype(c, s, clue.id);
  }
  assert.ok(prototypeFacts(c, s, person).some(f => f.id === 'secret'));
  const unlocked = await respondPrototype(
    { state: s, person, question: '¿Qué ocultas sobre el documento?' },
    { useModel: false },
  );
  assert.ok(secret.variants.includes(unlocked.answer));
});
