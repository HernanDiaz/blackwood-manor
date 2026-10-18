// Trains the classic question router (logistic regression over word, stem, slot and character
// features) on every hand-written training question and writes a compact model the game loads.
// The test split of the question bank is never used. Usage: node scripts/train-question-router.mjs
import { writeFileSync } from 'node:fs';
import { splitBank } from '../test/question-bank.mjs';
import { extraTraining } from '../test/question-bank-train.mjs';
import { extraTraining2 } from '../test/question-bank-train-2.mjs';
import { extraTraining3 } from '../test/question-bank-train-3.mjs';
import { extraTraining4 } from '../test/question-bank-train-4.mjs';
import { trainLogistic, predictLogistic } from '../src/question-router.mjs';

const { train, test } = splitBank();
for (const extra of [extraTraining, extraTraining2, extraTraining3, extraTraining4])
  for (const [topic, list] of Object.entries(extra))
    train.push(...list.map(question => ({ question, topic })));
const model = trainLogistic(train);
// Weights too small to change a decision are dropped and the rest rounded, to keep it small.
const weights = {};
for (const [feature, w] of Object.entries(model.weights)) {
  const rounded = w.map(x => Math.round(x * 1000) / 1000);
  if (rounded.some(x => Math.abs(x) >= 0.02)) weights[feature] = rounded;
}
const compact = { ...model, weights, bias: model.bias.map(x => Math.round(x * 1000) / 1000) };
const correct = test.filter(q => predictLogistic(compact, q.question).topic === q.topic).length;
const file = new URL('../src/question-router-model.json', import.meta.url);
writeFileSync(
  file,
  JSON.stringify({
    ...compact,
    trainingQuestions: train.length,
    testCorrect: `${correct}/${test.length}`,
  }),
);
console.log(
  `${train.length} preguntas de ajuste · ${Object.keys(weights).length} rasgos · prueba ${correct}/${test.length} · ${(JSON.stringify(compact).length / 1024).toFixed(0)} KB`,
);
