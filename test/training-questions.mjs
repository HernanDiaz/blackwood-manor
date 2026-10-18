// Every training question: the training groups of the question bank plus all the
// training-only batches. Duplicates and anything that matches a test question (ignoring case,
// accents and punctuation) are dropped here, so batches can be written freely.
import { splitBank } from './question-bank.mjs';
import { extraTraining } from './question-bank-train.mjs';
import { extraTraining2 } from './question-bank-train-2.mjs';
import { extraTraining3 } from './question-bank-train-3.mjs';
import { extraTraining4 } from './question-bank-train-4.mjs';
import { extraTraining5 } from './question-bank-train-5.mjs';
import { extraTraining6 } from './question-bank-train-6.mjs';
import { extraTraining7 } from './question-bank-train-7.mjs';

export const plainQuestion = s =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zñ0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function trainingQuestions() {
  const { train, test } = splitBank();
  const blocked = new Set(test.map(q => plainQuestion(q.question)));
  const seen = new Set(),
    out = [];
  const add = (question, topic, group) => {
    const key = plainQuestion(question);
    if (!key || blocked.has(key) || seen.has(key)) return;
    seen.add(key);
    out.push({ question, topic, group });
  };
  for (const q of train) add(q.question, q.topic, q.group);
  for (const extra of [
    extraTraining,
    extraTraining2,
    extraTraining3,
    extraTraining4,
    extraTraining5,
    extraTraining6,
    extraTraining7,
  ])
    for (const [topic, list] of Object.entries(extra)) for (const q of list) add(q, topic, 'extra');
  return { train: out, test };
}
