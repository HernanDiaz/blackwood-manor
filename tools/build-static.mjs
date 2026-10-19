// Builds dist/: the worlds game as static files that work without a server and, once loaded,
// without a connection (a service worker keeps every file). It is what a phone app
// (for example with Capacitor) or any static host would serve.
//   node tools/build-static.mjs [--serve [port]]
// With --serve it also serves dist/ on http://127.0.0.1:4174 to try it.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  dist = path.join(root, 'dist'),
  from = (...p) => path.join(root, ...p),
  to = (...p) => path.join(dist, ...p);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// The page, its styles and the content.
for (const f of [
  'app.mjs',
  'editor.mjs',
  'editor.html',
  'mundos.css',
  'style.css',
  'fonts.css',
])
  cpSync(from('public', f), to(f), { recursive: true });
for (const dir of ['worlds', 'cases', 'icons'])
  if (existsSync(from('public', dir))) cpSync(from('public', dir), to(dir), { recursive: true });

// The engine: every module the page imports, followed through their imports.
const modules = new Set();
function follow(file) {
  const source = readFileSync(file, 'utf8');
  for (const [, spec] of source.matchAll(/(?:from|import)\s*['"]([^'"]+\.(?:mjs|json))['"]/g)) {
    const target = spec.startsWith('/src/')
      ? from(spec.slice(1))
      : path.resolve(path.dirname(file), spec);
    if (!target.startsWith(from('src')) || modules.has(target)) continue;
    modules.add(target);
    if (target.endsWith('.mjs')) follow(target);
  }
}
follow(from('public/app.mjs'));
follow(from('public/editor.mjs'));
modules.add(from('src/question-router-model.json'));
for (const file of modules) cpSync(file, to(path.relative(root, file)));

// The page links the manifest and starts the service worker.
const page = readFileSync(from('public/index.html'), 'utf8').replace(
  '</head>',
  '<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#101b23"><script type="module" src="/register-sw.mjs"></script></head>',
);
writeFileSync(to('index.html'), page);
writeFileSync(
  to('manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'Mundos · Blackwood Manor',
      short_name: 'Mundos',
      lang: 'es',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#101b23',
      theme_color: '#101b23',
      icons: [192, 512].map(size => ({
        src: `/icons/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
    },
    null,
    2,
  ),
);
writeFileSync(
  to('register-sw.mjs'),
  "if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});\n",
);

// The service worker keeps every file of this build; a new build replaces the cache.
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files.push('/' + path.relative(dist, full).split(path.sep).join('/'));
  }
})(dist);
const version = createHash('sha256')
  .update(files.map(f => f + readFileSync(to(f.slice(1))).length).join('\n'))
  .digest('hex')
  .slice(0, 12);
writeFileSync(
  to('sw.js'),
  `const CACHE = 'mundos-${version}';
const FILES = ${JSON.stringify(['/', ...files])};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
`,
);
const bytes = files.reduce((n, f) => n + statSync(to(f.slice(1))).size, 0);
console.log(
  `dist/: ${files.length + 1} archivos, ${(bytes / 1048576).toFixed(1)} MB (${modules.size} del motor).`,
);

if (process.argv.includes('--serve')) {
  const port = Number(process.argv[process.argv.indexOf('--serve') + 1]) || 4174;
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.webp': 'image/webp',
    '.png': 'image/png',
  };
  http
    .createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost'),
        file = path.resolve(dist, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      if (!file.startsWith(dist + path.sep) || !existsSync(file) || statSync(file).isDirectory())
        return res.writeHead(404).end();
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.end(readFileSync(file));
    })
    .listen(port, '127.0.0.1', () => console.log(`Sirviendo dist/ en http://127.0.0.1:${port}`));
}
