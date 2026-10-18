// Generates the illustrations of the worlds with the image tool of Codex (the ChatGPT account
// signed in to the local Codex CLI) and saves them as WebP where each world file expects them.
//   node tools/generate-art.mjs [world-id ...] [--force] [--jobs 3]
// Images that already exist are kept unless --force. Codex writes a PNG into work/art/<world>/;
// Pillow (from .venv-images) converts it. CODEX_IMAGE_MODEL picks the Codex model.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeWorld } from '../src/world-file.mjs';
import { worlds } from '../src/prototype-worlds.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2),
  force = args.includes('--force'),
  jobs = Number(args[args.indexOf('--jobs') + 1]) || 3,
  chosen = args.filter(a => worlds.some(w => w.id === a)),
  model = process.env.CODEX_IMAGE_MODEL || 'gpt-6-astra',
  python = path.join(root, '.venv-images/Scripts/python.exe');

// Portraits and objects are square; places are wide, as the game shows them.
function plan(world) {
  const item = (kind, a, shape, width) => ({ world: world.id, kind, ...a, shape, width });
  return [
    ...world.people.map(p => item('retrato', p, 'square', 768)),
    ...world.rooms.map(r => item('lugar', r, 'landscape (3:2)', 1280)),
    ...world.weapons.map(w => item('arma', w, 'square', 640)),
    ...world.items.map(i => item('objeto', i, 'square', 640)),
    ...Object.values(world.clueArt).map(c => item('pista', c, 'square', 640)),
  ].map(a => ({ ...a, style: world.art.style }));
}
function run(command, list, options, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, list, { ...options, windowsHide: true });
    child.stdin.end(input ?? '');
    let output = '';
    child.stdout?.on('data', d => (output += d));
    child.stderr?.on('data', d => (output += d));
    child.on('error', reject);
    child.on('close', code =>
      code === 0 ? resolve(output) : reject(Error(output.trim().split('\n').slice(-3).join(' '))),
    );
  });
}
async function generate(a) {
  const target = path.join(root, 'public', a.image),
    work = path.join(root, 'work/art', a.world),
    name = path.basename(a.image, '.webp') + '.png',
    png = path.join(work, name);
  mkdirSync(path.dirname(target), { recursive: true });
  mkdirSync(work, { recursive: true });
  if (force || !existsSync(png)) {
    const prompt = `Use your image generation tool to create exactly one image, ${a.shape}, with the prompt below. Save it as ${name} in the current directory and reply only with the saved path. Do not create any other file.\n\nPrompt: ${a.imagePrompt}\nStyle: ${a.style}\nNo text, letters, captions, signatures or watermarks anywhere in the image.`;
    // The prompt goes through stdin: the Windows shell would break its quotes and lines.
    await run(
      'codex',
      ['exec', '--skip-git-repo-check', '-s', 'workspace-write', '-m', model, '-'],
      { cwd: work, shell: true },
      prompt,
    );
    if (!existsSync(png)) throw Error('Codex no guardó ' + name);
  }
  await run(python, [
    '-I',
    '-c',
    `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
w = int(sys.argv[3])
if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
im.save(sys.argv[2], 'WEBP', quality=82, method=6)`,
    png,
    target,
    String(a.width),
  ]);
}

const all = (chosen.length ? chosen : worlds.map(w => w.id)).flatMap(id =>
  plan(normalizeWorld(JSON.parse(readFileSync(path.join(root, 'public/worlds', id + '.json'))))),
);
const pending = all.filter(a => force || !existsSync(path.join(root, 'public', a.image)));
console.log(`${pending.length} de ${all.length} ilustraciones por generar (modelo ${model}).`);
let done = 0,
  failed = 0;
async function worker() {
  for (let a = pending.shift(); a; a = pending.shift()) {
    try {
      await generate(a);
      done++;
      console.log(`ok ${a.image}`);
    } catch (e) {
      failed++;
      console.log(`ERROR ${a.image}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: jobs }, worker));
console.log(`Hecho: ${done} generadas, ${failed} con error.`);
process.exitCode = failed ? 1 : 0;
