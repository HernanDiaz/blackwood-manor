import { respondPrototype } from './src/prototype-llm.mjs';
import { classifyWithLaya } from './src/question-classifier.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'",
  );
  try {
    // The game answers in the browser; it only asks here when a local model can do better.
    if (req.url === '/api/prototype/status' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ model: process.env.BLACKWOOD_LOCAL_LLM === '1' }));
      return;
    }
    if (req.url === '/api/prototype/interrogate' && req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 400000) {
          res.writeHead(413).end();
          return;
        }
      }
      res.setHeader('Content-Type', 'application/json');
      const payload = JSON.parse(raw);
      const result = await respondPrototype(payload, {
        useModel: process.env.BLACKWOOD_LOCAL_LLM === '1',
        // BLACKWOOD_FREE_DIALOGUE=1 lets the model write replies instead of choosing them.
        dialogue: process.env.BLACKWOOD_FREE_DIALOGUE === '1' ? 'free' : 'choose',
        // BLACKWOOD_CLASSIFIER=0 turns off the learned question classifier.
        classifier: process.env.BLACKWOOD_CLASSIFIER === '0' ? null : classifyWithLaya,
      });
      res.end(JSON.stringify(result));
      return;
    }
    if (req.method !== 'GET') {
      res.writeHead(405).end();
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    let relative =
      url.pathname === '/'
        ? 'public/index.html'
        : url.pathname.startsWith('/src/')
          ? url.pathname.slice(1)
          : 'public' + url.pathname;
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) throw Error('Invalid path');
    const data = await readFile(file);
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    // Local game under development: always revalidate, so an edit shows on the next load.
    res.setHeader('Cache-Control', 'no-cache');
    res.end(data);
  } catch (e) {
    res
      .writeHead(req.url.startsWith('/api/') ? 400 : 404, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ error: req.url.startsWith('/api/') ? e.message : 'No encontrado' }));
  }
});
if (process.argv[1] === fileURLToPath(import.meta.url))
  server.listen(port, '127.0.0.1', () => console.log(`Blackwood: http://localhost:${port}`));
