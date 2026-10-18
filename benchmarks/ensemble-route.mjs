// Combines the classic routers (Naive Bayes, logistic regression, nearest examples, rules).
// The combination is CHOSEN by 5-fold cross-validation on the training questions and only then
// measured once on the test questions, so the test set does not pick the winner.
// Usage: node benchmarks/ensemble-route.mjs
import { writeFileSync } from 'node:fs';
import { trainingQuestions } from '../test/training-questions.mjs';
import {
  trainNaiveBayes,
  predictNaiveBayes,
  trainLogistic,
  predictLogistic,
  trainNearest,
  predictNearest,
  features,
  softmax,
} from '../src/question-router.mjs';
import { inferPrototypeTopic } from '../src/prototype-engine.mjs';

const { train, test } = trainingQuestions();
const topics = [...new Set(train.map(q => q.topic))];
const probs = (scores, temperature = 1) =>
  softmax(topics.map(t => (scores[t] ?? -1e9) / temperature));

// Per-question outputs of every member, for one training set and the questions to label.
function members(trainSet, questions) {
  const nb = trainNaiveBayes(trainSet),
    lr = trainLogistic(trainSet),
    nn = trainNearest(trainSet);
  return questions.map(q => {
    const n = predictNaiveBayes(nb, q.question),
      l = predictLogistic(lr, q.question),
      k = predictNearest(nn, q.question);
    const length = Math.max(1, features(q.question).length);
    return {
      expected: q.topic,
      rule: inferPrototypeTopic(q.question),
      // Naive Bayes sums one log-probability per feature; dividing by their number tempers it.
      nb: probs(n.scores, length / 4),
      lr: probs(l.scores),
      nn: topics.map(t =>
        t === k.topic ? k.confidence : (1 - k.confidence) / (topics.length - 1),
      ),
    };
  });
}
const argmax = p => topics[p.indexOf(Math.max(...p))];
const mix = (row, w) =>
  topics.map((_, i) => w.nb * row.nb[i] + w.lr * row.lr[i] + w.nn * row.nn[i]);
const strategies = {
  'Naive Bayes': r => argmax(r.nb),
  'regresión logística': r => argmax(r.lr),
  vecinos: r => argmax(r.nn),
  'regresión logística + reglas': r =>
    Math.max(...r.lr) >= 0.5 || r.rule === null ? argmax(r.lr) : r.rule,
  'media NB + RL': r => argmax(mix(r, { nb: 0.5, lr: 0.5, nn: 0 })),
  'media NB + RL + vecinos': r => argmax(mix(r, { nb: 1 / 3, lr: 1 / 3, nn: 1 / 3 })),
  'media NB + RL, si dudan reglas': r => {
    const p = mix(r, { nb: 0.5, lr: 0.5, nn: 0 });
    return Math.max(...p) >= 0.5 || r.rule === null ? argmax(p) : r.rule;
  },
  'media NB + RL + vecinos, si dudan reglas': r => {
    const p = mix(r, { nb: 1 / 3, lr: 1 / 3, nn: 1 / 3 });
    return Math.max(...p) >= 0.5 || r.rule === null ? argmax(p) : r.rule;
  },
  'votación NB, RL, vecinos y reglas': r => {
    const votes = {};
    for (const t of [argmax(r.nb), argmax(r.lr), argmax(r.nn), r.rule].filter(Boolean))
      votes[t] = (votes[t] || 0) + 1;
    const best = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    return best.length > 1 && best[0][1] === best[1][1] ? argmax(r.lr) : best[0][0];
  },
};

// 5-fold cross-validation on the training questions.
let state = 11;
const random = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffled = [...train].sort(() => random() - 0.5);
const folds = 5,
  cvRows = [];
for (let f = 0; f < folds; f++) {
  const held = shuffled.filter((_, i) => i % folds === f),
    rest = shuffled.filter((_, i) => i % folds !== f);
  cvRows.push(...members(rest, held));
  process.stdout.write(`pliegue ${f + 1}/${folds} `);
}
console.log('\n\nValidación cruzada (ajuste, ' + cvRows.length + ' preguntas):');
const cv = {};
for (const [name, pick] of Object.entries(strategies)) {
  cv[name] = cvRows.filter(r => pick(r) === r.expected).length / cvRows.length;
  console.log(`  ${name}: ${(100 * cv[name]).toFixed(1)} %`);
}
const chosen = Object.entries(cv).sort((a, b) => b[1] - a[1])[0][0];
console.log(
  `\nElegida por validación cruzada: ${chosen}\n\nPrueba (${test.length} preguntas, una sola medición):`,
);
const testRows = members(train, test),
  report = {};
for (const [name, pick] of Object.entries(strategies)) {
  const correct = testRows.filter(r => pick(r) === r.expected).length;
  report[name] = { crossValidation: cv[name], test: correct };
  console.log(
    `  ${name === chosen ? '→ ' : '  '}${name}: ${correct}/${test.length} (${Math.round((100 * correct) / test.length)} %)`,
  );
}
writeFileSync(
  'benchmarks/results/routing-ensemble.json',
  JSON.stringify({ trainingQuestions: train.length, chosen, report }, null, 2),
);
