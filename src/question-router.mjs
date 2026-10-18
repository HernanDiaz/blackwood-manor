// Question routing without neural networks: the techniques of conversational systems before
// deep learning, small enough to ship inside a phone game.
//  - Entity slots (text adventure parsers): weapons, personal objects, rooms and times become
//    ARMA, OBJETO, SALA and HORA, so "¿tocaste la daga?" and "¿tocaste la ballesta?" match.
//  - Light Spanish stemming: words are cut to their first letters, so "guardaba" and
//    "guardaste" share a feature.
//  - A statistical classifier (multinomial Naive Bayes or logistic regression) or nearest
//    examples by cosine similarity, trained on labelled example questions.
const weapons =
  'arma armas daga dagas cuchillo cuchillos navaja espada espadas ballesta ballestas virote escopeta escopetas revolver revolveres pistola pistolas rifle veneno venenos frasco frascos vial viales copa copas cordon cordones cuerda soga pisapapeles amuleto laser emisor plasma panel regulador consola compuerta mando capsula pocion preparado barandilla';
const objects =
  'panuelo panuelos guante guantes pluma plumas pitillera rosario broche colgante auricular libreta bolsa anillo reloj boton gafas llavero';
const rooms =
  'biblioteca despacho comedor cocina invernadero vestibulo salon taller forja almacen despensa bodega granero deposito enfermeria botica dispensario refectorio cantina archivo scriptorium dormitorio celda celdas aposentos camarote habitacion cuarto sala torre armeria capilla jardin puente laboratorio galeria pasillo escalera';
const slot = (list, name) => new Map(list.split(' ').map(w => [w, name]));
const slots = new Map([
  ...slot(weapons, 'ARMA'),
  ...slot(objects, 'OBJETO'),
  ...slot(rooms, 'SALA'),
]);
const stop = new Set(
  'el la los las un una unos unas de del al a en y o que te tu tus mi me se lo le les su sus con por para es era fue ha has he este esta eso esa ese aqui alli muy mas pero si no ya'.split(
    ' ',
  ),
);

export function normalizeQuestion(text, { names = [] } = {}) {
  let t = ' ' + String(text).toLowerCase() + ' ';
  for (const name of names) {
    const n = name.toLowerCase().trim();
    if (n.length > 2) t = t.split(n).join(' PERSONA ');
  }
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(
      /\b\d{1,2}[:.]\d{2}\b|\blas (una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\b/g,
      ' HORA ',
    )
    .replace(/[^a-zñA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => slots.get(w) || w)
    .join(' ');
}
const stem = w => (w === w.toUpperCase() ? w : w.length > 5 ? w.slice(0, 5) : w);

export function features(text, options = {}) {
  const words = normalizeQuestion(text, options).split(' ');
  const stems = words.map(stem);
  const out = [];
  for (const w of stems) if (!stop.has(w)) out.push('w:' + w);
  for (let i = 0; i + 1 < stems.length; i++) out.push('b:' + stems[i] + '_' + stems[i + 1]);
  const flat = ' ' + words.join(' ') + ' ';
  for (const n of [3, 4])
    for (let i = 0; i + n <= flat.length; i++) out.push('c:' + flat.slice(i, i + n));
  return out;
}

// Multinomial Naive Bayes with Laplace smoothing.
export function trainNaiveBayes(examples) {
  const topics = [...new Set(examples.map(e => e.topic))],
    counts = {},
    totals = {},
    docs = {},
    vocab = new Set();
  for (const t of topics) {
    counts[t] = {};
    totals[t] = 0;
    docs[t] = 0;
  }
  for (const { question, topic } of examples) {
    docs[topic]++;
    for (const f of features(question)) {
      counts[topic][f] = (counts[topic][f] || 0) + 1;
      totals[topic]++;
      vocab.add(f);
    }
  }
  return {
    kind: 'naive-bayes',
    topics,
    counts,
    totals,
    docs,
    vocabSize: vocab.size,
    n: examples.length,
  };
}
export function predictNaiveBayes(model, question, options) {
  const f = features(question, options);
  const scores = model.topics.map(t => {
    let s = Math.log(model.docs[t] / model.n);
    for (const x of f)
      s += Math.log(((model.counts[t][x] || 0) + 1) / (model.totals[t] + model.vocabSize));
    return s;
  });
  return softmaxPick(model.topics, scores);
}

// Multinomial logistic regression trained with stochastic gradient descent.
export function trainLogistic(examples, { epochs = 30, rate = 0.5, l2 = 1e-5, seed = 7 } = {}) {
  const topics = [...new Set(examples.map(e => e.topic))],
    weights = {},
    bias = topics.map(() => 0);
  const data = examples.map(e => ({
    f: [...new Set(features(e.question))],
    y: topics.indexOf(e.topic),
  }));
  let state = seed;
  const random = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let epoch = 0; epoch < epochs; epoch++) {
    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]];
    }
    const lr = rate / (1 + epoch * 0.2);
    for (const { f, y } of data) {
      const scale = 1 / Math.sqrt(f.length);
      const z = topics.map(
        (_, k) => bias[k] + f.reduce((s, x) => s + (weights[x]?.[k] || 0) * scale, 0),
      );
      const p = softmax(z);
      for (let k = 0; k < topics.length; k++) {
        const g = p[k] - (k === y ? 1 : 0);
        bias[k] -= lr * g;
        for (const x of f) {
          const w = (weights[x] ||= new Array(topics.length).fill(0));
          w[k] -= lr * (g * scale + l2 * w[k]);
        }
      }
    }
  }
  return { kind: 'logistic', topics, weights, bias };
}
export function predictLogistic(model, question, options) {
  const f = [...new Set(features(question, options))],
    scale = 1 / Math.sqrt(f.length || 1);
  const z = model.topics.map(
    (_, k) => model.bias[k] + f.reduce((s, x) => s + (model.weights[x]?.[k] || 0) * scale, 0),
  );
  return softmaxPick(model.topics, z);
}

// Nearest examples by cosine similarity of feature vectors.
export function trainNearest(examples) {
  const df = new Map();
  for (const e of examples)
    for (const f of new Set(features(e.question))) df.set(f, (df.get(f) || 0) + 1);
  const model = { kind: 'nearest', n: examples.length, df };
  model.examples = examples.map(e => ({ topic: e.topic, vector: vectorize(model, e.question) }));
  return model;
}
function vectorize(model, question, options) {
  const tf = new Map();
  for (const f of features(question, options)) tf.set(f, (tf.get(f) || 0) + 1);
  let norm = 0;
  for (const [f, c] of tf) {
    const w = (1 + Math.log(c)) * (Math.log((model.n + 1) / ((model.df.get(f) || 0) + 1)) + 1);
    tf.set(f, w);
    norm += w * w;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [f, w] of tf) tf.set(f, w / norm);
  return tf;
}
export function predictNearest(model, question, options, k = 5) {
  const v = vectorize(model, question, options);
  const near = model.examples
    .map(e => {
      let s = 0;
      for (const [f, w] of v) s += w * (e.vector.get(f) || 0);
      return { topic: e.topic, score: s };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  const votes = {};
  for (const n of near) votes[n.topic] = (votes[n.topic] || 0) + n.score;
  const [topic, score] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  return {
    topic,
    confidence: score / near.reduce((s, n) => s + n.score, 0 || 1),
    similarity: near[0].score,
  };
}

function softmax(z) {
  const m = Math.max(...z),
    e = z.map(x => Math.exp(x - m)),
    s = e.reduce((a, b) => a + b, 0);
  return e.map(x => x / s);
}
function softmaxPick(topics, scores) {
  const p = softmax(scores),
    k = p.indexOf(Math.max(...p));
  return { topic: topics[k], confidence: p[k] };
}
