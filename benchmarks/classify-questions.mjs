// Measures question routing: offline rules, the local model, and both combined
// (rules first, model for the questions the rules cannot place).
// Needs the local model on 127.0.0.1:1235 (PILOTO.cmd). Usage:
//   node benchmarks/classify-questions.mjs [holdout|tuned]
import { writeFileSync, mkdirSync } from 'node:fs';
import { inferPrototypeTopic } from '../src/prototype-engine.mjs';
import { classifyQuestion } from '../src/prototype-llm.mjs';
import { routingQuestions } from '../test/routing-questions.mjs';
import { holdoutQuestions } from '../test/routing-holdout.mjs';

const name = process.argv[2] === 'tuned' ? 'tuned' : 'holdout',
  set = name === 'tuned' ? routingQuestions : holdoutQuestions;
const rows = [];
for (const [question, expected] of set) {
  const started = Date.now(),
    rule = inferPrototypeTopic(question);
  let model;
  try {
    model = await classifyQuestion(question);
  } catch (e) {
    model = 'error: ' + e.message;
  }
  rows.push({
    question,
    expected,
    rule: rule ?? 'unknown',
    ruleDecided: rule !== null,
    model,
    combined: rule ?? model,
    milliseconds: Date.now() - started,
  });
  process.stdout.write('.');
}
const score = key => rows.filter(r => r[key] === r.expected).length;
const summary = {
  set: name,
  questions: rows.length,
  rules: score('rule'),
  rulesDecided: rows.filter(r => r.ruleDecided).length,
  rulesCorrectWhenDecided: rows.filter(r => r.ruleDecided && r.rule === r.expected).length,
  model: score('model'),
  combined: score('combined'),
  modelMilliseconds: Math.round(rows.reduce((t, r) => t + r.milliseconds, 0) / rows.length),
};
console.log('\n' + JSON.stringify(summary, null, 2));
for (const r of rows.filter(r => r.combined !== r.expected))
  console.log(
    `✗ ${r.question} → ${r.combined} (esperado ${r.expected}; reglas ${r.rule}, modelo ${r.model})`,
  );
mkdirSync('benchmarks/results', { recursive: true });
writeFileSync(
  `benchmarks/results/routing-${name}.json`,
  JSON.stringify({ summary, rows }, null, 2),
);
