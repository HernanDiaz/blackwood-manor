// Case editor: load a case file, change it, check that it can still be solved, and download
// or play it. The form covers names and places; the JSON covers everything else
// (format in docs/EXPEDIENTES.md).
import { worlds, worldFile } from '/src/prototype-worlds.mjs';
import { normalizeWorld } from '/src/world-file.mjs';
import { difficulties } from '/src/case-generator.mjs';
import { normalizeCaseFile, analyzeCase, hydrateCase } from '/src/case-file.mjs';
import { newPrototype, exportCaseFile, restorePrototype } from '/src/prototype-engine.mjs';

const app = document.querySelector('#app'),
  saveKey = 'mundos-partida';
const esc = s =>
  String(s).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
let file = null,
  report = null,
  message = '',
  classics = [];

async function loadWorld(id) {
  const r = await fetch('/' + worldFile(id));
  if (!r.ok) throw Error('No se pudo cargar el mundo');
  return normalizeWorld(await r.json());
}
// Checks the case as the game would, and keeps what the player would see.
function check() {
  try {
    const normalized = normalizeCaseFile(file),
      analysis = analyzeCase(normalized),
      name = id => normalized.people.find(p => p.id === id)?.name || id;
    report = analysis.errors.length
      ? { ok: false, errors: analysis.errors }
      : {
          ok: true,
          culprit: name(normalized.crime.culprit),
          motive: analysis.motive.map(name),
          access: analysis.access.map(name),
          open: analysis.opportunity.map(name),
          clues: hydrateCase(normalized).clues,
        };
  } catch (e) {
    report = { ok: false, errors: [e.message] };
  }
}
function use(next, note) {
  const { id, ...rest } = normalizeCaseFile(next);
  file = rest;
  message = note;
  check();
  render();
}
const field = (path, label, value, max = 80) =>
  `<label>${esc(label)}<input data-path="${esc(path)}" value="${esc(value)}" maxlength="${max}"></label>`;

function render() {
  app.innerHTML = `<header><a class="brand" href="/">O<span>MUNDOS<br><small>EDITOR DE CASOS</small></span></a><div class="save"><a class="small" href="/">Volver al juego</a></div></header><main class="editor">${message ? `<div class="notice" role="status">${esc(message)}</div>` : ''}<section class="editor-load"><h2>Elige un caso para editar.</h2><div class="editor-row"><button id="from-save" class="small">El caso de mi partida</button><label class="small file">Abrir un archivo<input id="from-file" type="file" accept="application/json"></label></div><div class="editor-row"><select id="classic">${classics.map(k => `<option value="${esc(k.file)}">${esc(k.title)}</option>`).join('')}</select><button id="from-classic" class="small">Abrir caso clásico</button></div><div class="editor-row"><select id="world">${worlds.map(w => `<option value="${w.id}">${esc(w.label)}</option>`).join('')}</select><select id="difficulty">${difficulties.map(d => `<option value="${d.id}" ${d.id === 'medium' ? 'selected' : ''}>${d.label}</option>`).join('')}</select><button id="generate" class="small">Generar uno nuevo</button></div></section>${file ? editor() : ''}</main>`;
  bind();
}
function editor() {
  return `<section class="editor-form"><h2>${esc(file.title)}</h2><p class="hint">Los textos usan {victim}, {p1}…{p5} y {r1}…: al cambiar un nombre aquí, cambia en todas las pistas y declaraciones.</p><div class="fields">${field('title', 'Título', file.title, 120)}${field('victim.name', 'Víctima', file.victim.name)}${field('victim.role', 'Cargo de la víctima', file.victim.role)}</div><h3>Personajes</h3><div class="fields">${file.people.map((p, i) => field(`people.${i}.name`, p.id + ' · nombre', p.name) + field(`people.${i}.role`, p.id + ' · oficio', p.role)).join('')}</div><h3>Lugares</h3><div class="fields">${file.rooms.map((r, i) => field(`rooms.${i}.name`, r.id + ' · nombre', r.name, 60)).join('')}</div><h3>Expediente completo</h3><textarea id="json" spellcheck="false">${esc(JSON.stringify(file, null, 2))}</textarea><div class="editor-row"><button id="apply-json" class="small">Aplicar el JSON</button><button id="download" class="small">Descargar expediente</button><button id="play" class="danger">Jugar este caso</button></div></section>${verdict()}`;
}
function verdict() {
  if (!report) return '';
  if (!report.ok)
    return `<section class="editor-report bad"><h3>El caso no se puede jugar así</h3><ul>${report.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></section>`;
  return `<section class="editor-report"><h3>El caso se puede resolver</h3><p>Culpable: <strong>${esc(report.culprit)}</strong>. Con motivo: ${esc(report.motive.join(', '))}. Con acceso al arma: ${esc(report.access.join(', '))}. Sin coartada confirmada: ${esc(report.open.join(', '))}.</p><details><summary>Las pistas como las verá el jugador</summary><ul>${report.clues.map(x => `<li><strong>${esc(x.title)}</strong> ${esc(x.text)}</li>`).join('')}</ul></details></section>`;
}
function bind() {
  document.querySelector('#from-save').onclick = () => {
    try {
      use(exportCaseFile(restorePrototype(localStorage.getItem(saveKey))), 'Caso de tu partida.');
    } catch {
      message = 'No hay ninguna partida guardada en este navegador.';
      render();
    }
  };
  document.querySelector('#from-file').onchange = async e => {
    try {
      const raw = JSON.parse(await e.target.files[0].text());
      use(raw.format === 'mundos-partida' ? raw.case : raw, 'Archivo abierto.');
    } catch (err) {
      message = 'No se pudo abrir: ' + err.message;
      render();
    }
  };
  document.querySelector('#from-classic').onclick = async () => {
    const name = document.querySelector('#classic').value;
    use(await (await fetch('/cases/' + name)).json(), 'Caso clásico abierto.');
  };
  document.querySelector('#generate').onclick = async () => {
    const world = await loadWorld(document.querySelector('#world').value),
      state = newPrototype(world, { difficulty: document.querySelector('#difficulty').value });
    use(exportCaseFile(state), 'Caso nuevo generado.');
  };
  if (!file) return;
  document.querySelectorAll('[data-path]').forEach(
    input =>
      (input.onchange = () => {
        const keys = input.dataset.path.split('.'),
          last = keys.pop();
        keys.reduce((o, k) => o[k], file)[last] = input.value;
        message = '';
        check();
        render();
      }),
  );
  document.querySelector('#apply-json').onclick = () => {
    try {
      file = JSON.parse(document.querySelector('#json').value);
      message = 'JSON aplicado.';
    } catch (e) {
      message = 'El JSON no es válido: ' + e.message;
    }
    check();
    render();
  };
  document.querySelector('#download').onclick = () => {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
      ),
      a = document.createElement('a');
    a.href = url;
    a.download = 'mundos-expediente.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  document.querySelector('#play').onclick = () => {
    try {
      const state = newPrototype(null, { caseFile: file });
      const previous = localStorage.getItem(saveKey);
      if (previous) localStorage.setItem(saveKey + '-copia-' + Date.now(), previous);
      localStorage.setItem(saveKey, JSON.stringify(state));
      location.href = '/';
    } catch (e) {
      message = 'No se puede jugar: ' + e.message;
      render();
    }
  };
}

try {
  classics = (await (await fetch('/cases/index.json')).json()).cases || [];
} catch {}
render();
