import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { statementKinds, phrasingIssue, fillStatement } from '../src/statements.mjs';
import {
  newPrototype,
  createPrototypeCase,
  prototypeFacts,
  inspectPrototype,
} from '../src/prototype-engine.mjs';
import { respondPrototype } from '../src/prototype-llm.mjs';
const noir = JSON.parse(readFileSync('public/prototype/worlds/noir.json'));

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
  const world = structuredClone(noir);
  world.voices = {
    p1: {
      'seen.nothing': ['Querido, en esta casa nadie ve nada. Yo tampoco.'],
      'link.none': ['Ni sabía que existía.'],
    },
  };
  const c = createPrototypeCase(world, newPrototype(world, { seed: 'voices' })),
    seen = c.facts.p1.find(f => f.kind === 'seen.nothing'),
    link = c.facts.p1.find(f => f.id === 'link');
  if (seen) assert.deepEqual(seen.variants, ['Querido, en esta casa nadie ve nada. Yo tampoco.']);
  // The custom link wording omits {access}, so the defaults stay.
  assert.ok(link.variants.every(v => !v.includes('Ni sabía')));
});

test('generated statements keep their facts in every wording', () => {
  for (let i = 0; i < 20; i++) {
    const c = createPrototypeCase(noir, newPrototype(noir, { seed: 'wording-' + i }));
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
  const s = newPrototype(noir, { seed: 'choose' }),
    c = createPrototypeCase(noir, s),
    person = c.culprit.id,
    calls = [];
  const request = async messages => {
    calls.push(messages[0].content);
    return { id: 'alibi' };
  };
  const answers = [];
  for (let i = 0; i < 3; i++) {
    const r = await respondPrototype(
      noir,
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
    noir,
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
    noir,
    { state: s, person, question: '¿Qué ocultas sobre el documento?' },
    { useModel: false },
  );
  assert.ok(secret.variants.includes(unlocked.answer));
});
