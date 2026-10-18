// Question routing without any neural model: cosine similarity between character n-gram
// TF-IDF vectors. Compares the question with (a) the training questions and (b) the authored
// answer wordings of each topic.
// Usage: node benchmarks/lexical-route.mjs benchmarks/results/question-split-extra.json
import { readFileSync } from 'node:fs';
import { statementKinds } from '../src/statements.mjs';
const split = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const normalize = s =>
  ' ' +
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zñ0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() +
  ' ';
const grams = (text, sizes) => {
  const t = normalize(text),
    out = [];
  for (const n of sizes) for (let i = 0; i + n <= t.length; i++) out.push(t.slice(i, i + n));
  return out;
};
function build(documents, sizes) {
  const df = new Map();
  for (const d of documents)
    for (const g of new Set(grams(d, sizes))) df.set(g, (df.get(g) || 0) + 1);
  const idf = g => Math.log((documents.length + 1) / ((df.get(g) || 0) + 1)) + 1;
  const vector = text => {
    const tf = new Map();
    for (const g of grams(text, sizes)) tf.set(g, (tf.get(g) || 0) + 1);
    const v = new Map();
    let norm = 0;
    for (const [g, c] of tf) {
      const w = (1 + Math.log(c)) * idf(g);
      v.set(g, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [g, w] of v) v.set(g, w / norm);
    return v;
  };
  return { vector, vectors: documents.map(vector) };
}
const cosine = (a, b) => {
  let s = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const [g, w] of small) s += w * (large.get(g) || 0);
  return s;
};
function evaluate(label, references, sizes, k) {
  const index = build(
    references.map(r => r.text),
    sizes,
  );
  let correct = 0;
  const started = Date.now();
  for (const q of split.test) {
    const v = index.vector(q.question);
    const near = references
      .map((r, i) => ({ topic: r.topic, score: cosine(v, index.vectors[i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    const votes = {};
    for (const n of near) votes[n.topic] = (votes[n.topic] || 0) + n.score;
    if (Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0] === q.topic) correct++;
  }
  const ms = (Date.now() - started) / split.test.length;
  console.log(
    `${label}: ${correct}/${split.test.length} (${Math.round((100 * correct) / split.test.length)} %), ${ms.toFixed(1)} ms/pregunta`,
  );
}
const examples = split.train.map(q => ({ text: q.question, topic: q.topic }));
const answers = Object.values(statementKinds).flatMap(spec =>
  spec.variants.map(text => ({ text: text.replace(/\{\w+\}/g, ' '), topic: spec.topic })),
);
console.log(
  `ejemplos: ${examples.length} preguntas · respuestas prefijadas: ${answers.length} frases`,
);
for (const [sizes, name] of [
  [[3], 'trigramas'],
  [[3, 4, 5], 'n-gramas 3-5'],
]) {
  for (const k of [1, 5]) evaluate(`preguntas de ejemplo, ${name}, k=${k}`, examples, sizes, k);
  evaluate(`respuestas prefijadas, ${name}`, answers, sizes, 1);
}

// Combination with the offline rules: trust the nearest examples when they are clearly similar.
const { inferPrototypeTopic } = await import('../src/prototype-engine.mjs');
const index = build(
  examples.map(e => e.text),
  [3, 4, 5],
);
const rows = split.test.map(q => {
  const v = index.vector(q.question);
  const near = examples
    .map((e, i) => ({ topic: e.topic, score: cosine(v, index.vectors[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const votes = {};
  for (const n of near) votes[n.topic] = (votes[n.topic] || 0) + n.score;
  const [topic] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  return {
    expected: q.topic,
    lexical: topic,
    top: near[0].score,
    rule: inferPrototypeTopic(q.question),
  };
});
for (const threshold of [0, 0.3, 0.4, 0.5, 0.6]) {
  const correct = rows.filter(
    r => (r.top >= threshold || r.rule === null ? r.lexical : r.rule) === r.expected,
  ).length;
  console.log(`similitud ≥ ${threshold}, si no reglas: ${correct}/${rows.length}`);
}
