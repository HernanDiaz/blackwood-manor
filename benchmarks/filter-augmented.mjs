// Keeps only the model rewordings that stay close to their source question, measured with
// multilingual-e5-small embeddings (llama-server --embedding on port 1236).
// Usage: node benchmarks/filter-augmented.mjs <augmented.json> <out.json> [threshold]
import { readFileSync, writeFileSync } from 'node:fs';
const [input, output, thresholdArg] = process.argv.slice(2);
const items = JSON.parse(readFileSync(input, 'utf8')).items.filter(i => i.question);
async function embed(texts) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += 128) {
    const response = await fetch('http://127.0.0.1:1236/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: texts.slice(i, i + 128).map(t => 'query: ' + t) }),
    });
    if (!response.ok) throw Error('embedding server: HTTP ' + response.status);
    for (const d of (await response.json()).data) {
      const norm = Math.hypot(...d.embedding);
      vectors.push(d.embedding.map(x => x / norm));
    }
  }
  return vectors;
}
const a = await embed(items.map(i => i.question)),
  b = await embed(items.map(i => i.source));
const scored = items.map((item, n) => ({
  ...item,
  similarity: a[n].reduce((s, x, k) => s + x * b[n][k], 0),
}));
const sorted = scored.map(s => s.similarity).sort((x, y) => x - y);
const quantile = q => sorted[Math.floor(q * (sorted.length - 1))].toFixed(3);
console.log(
  'similitud: p10',
  quantile(0.1),
  'p25',
  quantile(0.25),
  'p50',
  quantile(0.5),
  'p75',
  quantile(0.75),
);
const threshold = Number(thresholdArg || quantile(0.5));
const kept = scored.filter(s => s.similarity >= threshold);
writeFileSync(output, JSON.stringify({ threshold, items: kept }, null, 2));
console.log(`umbral ${threshold}: ${kept.length} de ${scored.length}`);
for (const s of scored.sort((x, y) => x.similarity - y.similarity).slice(0, 6))
  console.log(`  descartada ${s.similarity.toFixed(3)}: ${s.source} -> ${s.question}`);
