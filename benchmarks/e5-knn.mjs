// Classifies test questions by their nearest training examples, using multilingual-e5-small
// embeddings from a llama-server started with --embedding on port 1236.
// Usage: node benchmarks/e5-knn.mjs benchmarks/results/question-split.json benchmarks/results/routing-e5.json
import { readFileSync, writeFileSync } from 'node:fs';
const [splitPath, outPath] = process.argv.slice(2);
const split = JSON.parse(readFileSync(splitPath, 'utf8'));

async function embed(texts) {
  const response = await fetch('http://127.0.0.1:1236/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // e5 expects the "query: " prefix it was trained with.
    body: JSON.stringify({ input: texts.map(t => 'query: ' + t) }),
  });
  if (!response.ok) throw Error('embedding server: HTTP ' + response.status);
  const data = await response.json();
  return data.data.map(d => {
    const norm = Math.hypot(...d.embedding);
    return d.embedding.map(x => x / norm);
  });
}
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

const started = Date.now();
const train = await embed(split.train.map(q => q.question));
const embedMs = (Date.now() - started) / split.train.length;
const test = await embed(split.test.map(q => q.question));
const results = {};
for (const k of [1, 3, 5, 7]) {
  const predictions = test.map(vector => {
    const near = split.train
      .map((q, i) => ({ topic: q.topic, score: dot(vector, train[i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    const votes = {};
    for (const n of near) votes[n.topic] = (votes[n.topic] || 0) + n.score;
    const [topic] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    return { topic, similarity: near[0].score };
  });
  results['k' + k] = {
    correct: predictions.filter((p, i) => p.topic === split.test[i].topic).length,
    predictions,
  };
  console.log(`k=${k}: ${results['k' + k].correct}/${split.test.length}`);
}
writeFileSync(
  outPath,
  JSON.stringify(
    { model: 'multilingual-e5-small q8_0, k nearest training examples', embedMs, results },
    null,
    2,
  ),
);
console.log(`~${embedMs.toFixed(1)} ms por pregunta (GPU, en lote)`);
