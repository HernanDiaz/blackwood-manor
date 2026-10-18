import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newPrototype, createPrototypeCase, inspectPrototype } from '../src/prototype-engine.mjs';
import { answerOffline } from '../src/interrogation.mjs';
import { respondPrototype } from '../src/prototype-llm.mjs';
import { loadWorld } from './worlds-fixture.mjs';
const questionRouter = JSON.parse(readFileSync('src/question-router-model.json', 'utf8'));

const questions = [
  '¿Dónde estabas cuando ocurrió?',
  '¿Cómo te llevabas con él?',
  '¿Podías coger el arma?',
  '¿Quién puede confirmar lo que dices?',
  '¿Viste algo raro?',
  'Hola, ¿cómo estás?',
  '¿A qué te dedicas?',
  'Fuiste tú, confiésalo.',
  'Háblame del tiempo que hace en verano',
];

test('the browser answers like the server without a model', async () => {
  const s = newPrototype(loadWorld('blackwood-manor'), { seed: 'offline' }),
    c = createPrototypeCase(s);
  for (const clue of c.clues) {
    s.room = clue.room;
    inspectPrototype(c, s, clue.id);
  }
  for (const p of c.people)
    for (const question of questions) {
      const local = answerOffline(c, s, p.id, question, { questionRouter }),
        server = await respondPrototype({ state: s, person: p.id, question }, { questionRouter });
      assert.equal(local.topic, server.topic, question);
      assert.equal(local.answer, server.answer, question);
    }
});

test('offline answers place common questions and refuse bad input', () => {
  const s = newPrototype(loadWorld('torre-umbria'), { seed: 'offline-2' }),
    c = createPrototypeCase(s),
    p = c.people[0].id;
  assert.equal(answerOffline(c, s, p, '¿Dónde estabas?', { questionRouter }).topic, 'alibi');
  assert.equal(answerOffline(c, s, p, '¿Dónde estabas?').topic, 'alibi');
  assert.match(answerOffline(c, s, p, 'Fuiste tú, ¿verdad?').answer, /acusación necesita pruebas/);
  assert.throws(() => answerOffline(c, s, p, ''), /pregunta inválida/);
  assert.throws(() => answerOffline(c, s, 'p9', '¿Dónde estabas?'), /pregunta inválida/);
});
