// Offline rules and the local generative model on the question bank test split.
// Usage: node benchmarks/route-rules-qwen.mjs benchmarks/results/question-split.json benchmarks/results/routing-rules-qwen.json
import { readFileSync, writeFileSync } from 'node:fs';
import { inferPrototypeTopic } from '../src/prototype-engine.mjs';
import { classifyQuestion } from '../src/prototype-llm.mjs';
import { routingQuestions } from '../test/routing-questions.mjs';
const [splitPath, outPath] = process.argv.slice(2);
const split = JSON.parse(readFileSync(splitPath, 'utf8'));
// The rules were tuned on these questions; report them apart.
const tuned = new Set(routingQuestions.map(([q]) => q));
const rows = [];
let modelMs = 0;
for (const { question, topic } of split.test) {
  const rule = inferPrototypeTopic(question) ?? 'unknown';
  const started = Date.now();
  let model;
  try {
    model = await classifyQuestion(question);
  } catch (e) {
    model = 'error';
  }
  modelMs += Date.now() - started;
  rows.push({ question, topic, rule, model, seenByRules: tuned.has(question) });
  process.stdout.write('.');
}
const count = (list, key) => list.filter(r => r[key] === r.topic).length;
const unseen = rows.filter(r => !r.seenByRules);
const summary = {
  questions: rows.length,
  rules: count(rows, 'rule'),
  rulesOnUnseen: `${count(unseen, 'rule')}/${unseen.length}`,
  qwen: count(rows, 'model'),
  rulesThenQwen: rows.filter(r => (r.rule !== 'unknown' ? r.rule : r.model) === r.topic).length,
  qwenMilliseconds: Math.round(modelMs / rows.length),
};
console.log('\n' + JSON.stringify(summary, null, 2));
writeFileSync(outPath, JSON.stringify({ summary, rows }, null, 2));
