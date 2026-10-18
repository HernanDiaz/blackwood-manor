// Compares the classic (pre-neural) question routers on the test questions.
// Usage: node benchmarks/classic-route.mjs benchmarks/results/question-split-extra.json
import { readFileSync, writeFileSync } from 'node:fs';
import {
  trainNaiveBayes,
  predictNaiveBayes,
  trainLogistic,
  predictLogistic,
  trainNearest,
  predictNearest,
} from '../src/question-router.mjs';
import { inferPrototypeTopic } from '../src/prototype-engine.mjs';
const split = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const train = split.train,
  test = split.test;
const runs = {};
for (const [name, fit, predict] of [
  ['vecinos (cosine)', trainNearest, predictNearest],
  ['Naive Bayes', trainNaiveBayes, predictNaiveBayes],
  ['regresión logística', trainLogistic, predictLogistic],
]) {
  let started = Date.now();
  const model = fit(train);
  const trainMs = Date.now() - started;
  started = Date.now();
  const predictions = test.map(q => predict(model, q.question));
  const ms = (Date.now() - started) / test.length;
  runs[name] = predictions;
  const correct = predictions.filter((p, i) => p.topic === test[i].topic).length;
  const size = JSON.stringify(model, (k, v) => (v instanceof Map ? [...v] : v)).length;
  console.log(
    `${name}: ${correct}/${test.length} (${Math.round((100 * correct) / test.length)} %) · ${ms.toFixed(2)} ms/pregunta · entrenar ${trainMs} ms · modelo ${(size / 1024).toFixed(0)} KB`,
  );
}
// With the offline rules behind: rules decide when the router is unsure.
for (const name of Object.keys(runs))
  for (const threshold of [0.5, 0.6, 0.7]) {
    const correct = test.filter((q, i) => {
      const p = runs[name][i],
        rule = inferPrototypeTopic(q.question);
      return (p.confidence >= threshold || rule === null ? p.topic : rule) === q.topic;
    }).length;
    console.log(`  ${name} con confianza ≥ ${threshold}, si no reglas: ${correct}/${test.length}`);
  }
writeFileSync(
  'benchmarks/results/routing-classic.json',
  JSON.stringify(
    Object.fromEntries(Object.entries(runs).map(([k, v]) => [k, v.map(p => p.topic)])),
    null,
    1,
  ),
);
