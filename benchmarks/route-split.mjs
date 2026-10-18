// Writes the training/test split for the learned classifiers. The test split is always the
// hand-written test groups of question-bank.mjs. Training can add the extra hand-written
// questions and the model rewordings.
// Usage: node benchmarks/route-split.mjs <out.json> [--extra] [--augmented file.json]
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { splitBank, topics } from '../test/question-bank.mjs';
import { trainingQuestions } from '../test/training-questions.mjs';
const args = process.argv.slice(2),
  out = args[0] || 'benchmarks/results/question-split.json',
  augmentedFile = args.includes('--augmented') ? args[args.indexOf('--augmented') + 1] : null;
const { train, test } = args.includes('--extra') ? trainingQuestions() : splitBank();
if (augmentedFile)
  for (const item of JSON.parse(readFileSync(augmentedFile, 'utf8')).items)
    if (item.question)
      train.push({ question: item.question, topic: item.topic, group: 'augmented' });
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ topics, train, test }, null, 2));
console.log(`${out}: ${train.length} de ajuste, ${test.length} de prueba`);
