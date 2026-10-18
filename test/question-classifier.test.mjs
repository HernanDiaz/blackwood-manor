import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newPrototype, createPrototypeCase, inspectPrototype } from '../src/prototype-engine.mjs';
import { respondPrototype } from '../src/prototype-llm.mjs';
import { classifyWithLaya } from '../src/question-classifier.mjs';
const noir = JSON.parse(readFileSync('public/prototype/worlds/noir.json'));
function solved() {
  const s = newPrototype(noir, { seed: 'classifier' }),
    c = createPrototypeCase(noir, s);
  for (const clue of c.clues) {
    s.room = clue.room;
    inspectPrototype(c, s, clue.id);
  }
  return { s, c, person: c.culprit.id };
}
const ask = (s, person, question, classifier, questionRouter = null) =>
  respondPrototype(noir, { state: s, person, question }, { classifier, questionRouter });

test('a confident classifier decides the topic and the rules cover its doubts', async () => {
  const { s, person } = solved();
  // The rules read "dónde" as an alibi question; the classifier knows better.
  let r = await ask(s, person, '¿Sabías dónde se guardaba el veneno?', async () => ({
    topic: 'link',
    confidence: 0.97,
  }));
  assert.equal(r.topic, 'link');
  assert.equal(r.router, 'classifier');
  r = await ask(s, person, '¿Dónde estabas?', async () => ({ topic: 'seen', confidence: 0.4 }));
  assert.equal(r.topic, 'alibi');
  assert.equal(r.router, 'rules');
  r = await ask(s, person, '¿Dónde estabas?', async () => null);
  assert.equal(r.topic, 'alibi');
});

test('the classifier cannot open evidence the person cannot discuss yet', async () => {
  const s = newPrototype(noir, { seed: 'classifier' }),
    c = createPrototypeCase(noir, s);
  const r = await respondPrototype(
    noir,
    { state: s, person: c.culprit.id, question: '¿Qué dices de la carta?' },
    { classifier: async () => ({ topic: 'secret', confidence: 0.99 }) },
  );
  assert.equal(r.topic, 'unknown');
  assert.ok(!c.facts[c.culprit.id].find(f => f.id === 'secret').variants.includes(r.answer));
});

test('without the classifier service the game keeps answering', async () => {
  const started = Date.now();
  assert.equal(
    await classifyWithLaya('¿Dónde estabas?', { url: 'http://127.0.0.1:9/classify' }),
    null,
  );
  assert.ok(Date.now() - started < 2000);
});

test('without the neural classifier the statistical router places natural questions', async () => {
  const { s, person } = solved();
  const { default: model } = await import('../src/question-router-model.json', {
    with: { type: 'json' },
  });
  for (const [question, topic] of [
    ['¿Dónde te metiste después de cenar?', 'alibi'],
    ['¿Quién puede confirmar lo que dices?', 'timeline'],
    ['¿Podías coger el veneno del armario?', 'link'],
    ['Hola, buenas noches.', 'social'],
  ]) {
    const r = await ask(s, person, question, null, model);
    assert.equal(r.topic, topic, question);
  }
});
