// Case editor: load a case file, change it, check that it can still be solved, and download
// or play it. The form covers names and places; the JSON covers everything else
// (format in docs/EXPEDIENTES.md).
import { worlds, worldFile } from '/src/prototype-worlds.mjs';
import { normalizeWorld } from '/src/world-file.mjs';
import { difficulties } from '/src/case-generator.mjs';
import { normalizeCaseFile, analyzeCase, hydrateCase } from '/src/case-file.mjs';
import { newPrototype, exportCaseFile, restorePrototype } from '/src/prototype-engine.mjs';
import { uiText, deviceLanguage } from '/src/ui-text.mjs';
import { saveFile } from '/save-file.mjs';

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
  classics = [],
  labels = {};
// The editor speaks the language chosen in the game, and generates and opens cases in it.
let lang = null;
try {
  lang = JSON.parse(localStorage.getItem('mundos-idioma'));
} catch {}
if (!uiText[lang]) lang = deviceLanguage(navigator.languages || [navigator.language || '']);
const T = uiText[lang],
  E = T.editor;
document.documentElement.lang = lang;
document.title = E.pageTitle;

async function loadWorld(id) {
  const r = await fetch('/' + worldFile(id, lang));
  if (!r.ok) throw Error(T.loadWorldFailed);
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
  app.innerHTML = `<header><a class="brand" href="/" aria-label="${E.back}"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="13" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M20 20l8 8" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg><span>BLACKWOOD<br><small>${E.tagline}</small></span></a><div class="save"><a class="small" href="/">${E.backToGame}</a></div></header><main class="editor">${message ? `<div class="notice" role="status">${esc(message)}</div>` : ''}<section class="editor-load"><h2>${E.choose}</h2><div class="editor-row"><button id="from-save" class="small">${E.fromSave}</button><label class="small file">${E.openFile}<input id="from-file" type="file" accept=".json,application/json"></label></div><div class="editor-row"><select id="classic">${classics.map(k => `<option value="${esc(k.file)}">${esc(k.title)}</option>`).join('')}</select><button id="from-classic" class="small">${E.openClassic}</button></div><div class="editor-row"><select id="world">${worlds.map(w => `<option value="${w.id}">${esc(labels[w.id] || w.label)}</option>`).join('')}</select><select id="difficulty">${difficulties.map(d => `<option value="${d.id}" ${d.id === 'medium' ? 'selected' : ''}>${T.difficulties[d.id]}</option>`).join('')}</select><button id="generate" class="small">${E.generate}</button></div></section>${file ? editor() : ''}</main>`;
  bind();
}
function editor() {
  return `<section class="editor-form"><h2>${esc(file.title)}</h2><p class="hint">${esc(E.placeholders)}</p><div class="fields">${field('title', E.title, file.title, 120)}${field('victim.name', E.victim, file.victim.name)}${field('victim.role', E.victimRole, file.victim.role)}</div><h3>${E.people}</h3><div class="fields">${file.people.map((p, i) => field(`people.${i}.name`, E.name(p.id), p.name) + field(`people.${i}.role`, E.role(p.id), p.role)).join('')}</div><h3>${E.rooms}</h3><div class="fields">${file.rooms.map((r, i) => field(`rooms.${i}.name`, E.name(r.id), r.name, 60)).join('')}</div><h3>${E.fullFile}</h3><textarea id="json" spellcheck="false">${esc(JSON.stringify(file, null, 2))}</textarea><div class="editor-row"><button id="apply-json" class="small">${E.applyJson}</button><button id="download" class="small">${E.download}</button><button id="play" class="danger">${E.play}</button></div></section>${verdict()}`;
}
function verdict() {
  if (!report) return '';
  if (!report.ok)
    return `<section class="editor-report bad"><h3>${E.cannotPlay}</h3><ul>${report.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></section>`;
  return `<section class="editor-report"><h3>${E.solvable}</h3><p>${E.summary(esc(report.culprit), esc(report.motive.join(', ')), esc(report.access.join(', ')), esc(report.open.join(', ')))}</p><details><summary>${E.asPlayer}</summary><ul>${report.clues.map(x => `<li><strong>${esc(x.title)}</strong> ${esc(x.text)}</li>`).join('')}</ul></details></section>`;
}
function bind() {
  document.querySelector('#from-save').onclick = () => {
    try {
      use(exportCaseFile(restorePrototype(localStorage.getItem(saveKey))), E.saveCase);
    } catch {
      message = E.noSave;
      render();
    }
  };
  document.querySelector('#from-file').onchange = async e => {
    try {
      const raw = JSON.parse(await e.target.files[0].text());
      use(raw.format === 'mundos-partida' ? raw.case : raw, E.fileOpened);
    } catch (err) {
      message = E.openFailed(err.message);
      render();
    }
  };
  document.querySelector('#from-classic').onclick = async () => {
    const name = document.querySelector('#classic').value;
    const path = lang === 'en' ? name.replace(/\.json$/, '.en.json') : name;
    use(await (await fetch('/cases/' + path)).json(), E.classicOpened);
  };
  document.querySelector('#generate').onclick = async () => {
    const world = await loadWorld(document.querySelector('#world').value),
      state = newPrototype(world, { difficulty: document.querySelector('#difficulty').value });
    use(exportCaseFile(state), E.generated);
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
      message = E.jsonApplied;
    } catch (e) {
      message = E.badJson(e.message);
    }
    check();
    render();
  };
  document.querySelector('#download').onclick = async () => {
    try {
      await saveFile(JSON.stringify(file, null, 2), 'mundos-expediente.json', E.download);
    } catch (e) {
      message = T.exportFailed(e.message);
      render();
    }
  };
  document.querySelector('#play').onclick = () => {
    try {
      const state = newPrototype(null, { caseFile: file });
      const previous = localStorage.getItem(saveKey);
      if (previous) localStorage.setItem(saveKey + '-copia-' + Date.now(), previous);
      localStorage.setItem(saveKey, JSON.stringify(state));
      location.href = '/';
    } catch (e) {
      message = E.playFailed(e.message);
      render();
    }
  };
}

try {
  classics =
    (await (await fetch(lang === 'en' ? '/cases/index.en.json' : '/cases/index.json')).json())
      .cases || [];
} catch {}
// The worlds by their name in this language.
for (const w of worlds)
  try {
    labels[w.id] = (await loadWorld(w.id)).label;
  } catch {}
render();
