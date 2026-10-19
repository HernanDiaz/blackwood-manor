import { placePhrase } from '/src/spanish-prose.mjs';
import { worlds, worldFile, selectWorld } from '/src/prototype-worlds.mjs';
import { normalizeWorld } from '/src/world-file.mjs';
import { difficulties } from '/src/case-generator.mjs';
import { answerOffline } from '/src/interrogation.mjs';
import {
  newPrototype,
  restorePrototype,
  createPrototypeCase,
  worldWeapons,
  inspectPrototype,
  presentEvidence,
  prototypeFacts,
  accusePrototype,
  prototypeResolution,
  CASE_FORMAT,
  SAVE_FORMAT,
  clock,
} from '/src/prototype-engine.mjs';
import { conditions, noteEntry, clearEntry, notebookSuspects, nextHint } from '/src/guidance.mjs';
const key = 'mundos-partida',
  app = document.querySelector('#app');
const esc = s =>
  String(s).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
// Illustrations still to be made are hidden instead of showing a broken image.
document.addEventListener(
  'error',
  e => e.target.tagName === 'IMG' && e.target.classList.add('missing'),
  true,
);
const cache = new Map();
async function loadWorld(id) {
  if (!cache.has(id)) {
    const r = await fetch('/' + worldFile(id));
    if (!r.ok) throw Error('No se pudo cargar el mundo');
    cache.set(id, normalizeWorld(await r.json()));
  }
  return cache.get(id);
}
let routerModel = null,
  serverModel = false,
  // Hand-written cases that come with the game (public/cases/).
  classics = [];
const worldLabel = id => worlds.find(w => w.id === id)?.label || 'Caso importado';

// Small things this browser remembers: they may be missing (private mode) and that is fine.
const remembered = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const remember = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
let history = remembered('mundos-historial', []),
  speaking = remembered('mundos-voz', false) === true;
if (!Array.isArray(history)) history = [];
// Reading aloud with the voice of the system: no download, works offline.
const canSpeak = 'speechSynthesis' in globalThis;
function speak(text, who) {
  if (!speaking || !canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text),
    voices = speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith('es')),
    actor = c?.people.find(p => p.id === who);
  u.lang = 'es-ES';
  u.voice = voices.find(v => v.lang === 'es-ES') || voices[0] || null;
  if (actor) {
    // A different pitch and pace for each person, so they do not all sound alike.
    const n = Number(actor.id.slice(1));
    u.pitch = (actor.gender === 'f' ? 1.15 : 0.8) + (n % 3) * 0.08;
    u.rate = 0.95 + (n % 2) * 0.1;
  }
  speechSynthesis.speak(u);
}
function record() {
  const weapon = c.weapons.find(w => w.method === c.method.id);
  history = [
    {
      date: new Date().toISOString().slice(0, 10),
      world: worldLabel(state.world),
      title: c.title,
      difficulty: difficulties.find(d => d.id === c.file.origin?.difficulty)?.label || '',
      culprit: c.culprit.name,
      weapon: weapon?.label || '',
      hints: state.help.used,
      attempts: state.attempts,
    },
    ...history,
  ].slice(0, 50);
  remember('mundos-historial', history);
}
// The difficulty is a preference of this browser.
let difficulty = remembered('mundos-dificultad', 'medium');
if (!difficulties.some(d => d.id === difficulty)) difficulty = 'medium';
let setupWorld = worlds[0].id,
  preview,
  state = null,
  c,
  tab = 'setup',
  person = 'p1',
  message = '',
  busy = false,
  storageOK = true,
  hint = null,
  noteMessage = null,
  // On a phone the header actions fold into a menu.
  menuOpen = false;
try {
  for (const w of worlds) await loadWorld(w.id);
  // The statistical router answers questions in the browser; without it the rules still do.
  try {
    routerModel = await (await fetch('/src/question-router-model.json')).json();
  } catch {}
  try {
    classics = (await (await fetch('/cases/index.json')).json()).cases || [];
  } catch {}
  // A local server with a model can place the questions nothing else can (see server.mjs).
  fetch('/api/prototype/status', { signal: AbortSignal.timeout(2000) })
    .then(r => (r.ok ? r.json() : {}))
    .then(status => (serverModel = status.model === true))
    .catch(() => {});
  preview = cache.get(setupWorld);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      state = restorePrototype(saved);
      c = createPrototypeCase(state);
      if (cache.has(state.world)) {
        setupWorld = state.world;
        preview = cache.get(setupWorld);
      }
    } catch {
      message =
        'La partida guardada no es compatible con esta versión del juego. Expórtala si quieres conservarla antes de crear otra investigación.';
      state = null;
    }
  }
  render();
} catch (e) {
  console.error(e);
  app.innerHTML =
    '<h1>No se pudo abrir el juego.</h1><p>Comprueba que el servidor sigue activo y recarga la página.</p>';
}
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    storageOK = true;
  } catch {
    storageOK = false;
    message = 'No se pudo guardar en este navegador. Guarda una copia de tu partida desde el menú.';
  }
}
function exportSave() {
  download(
    state ? JSON.stringify(state, null, 2) : localStorage.getItem(key),
    'mundos-partida.json',
  );
}
function download(raw, name) {
  if (!raw) return;
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function img(src, alt, cls = '') {
  return src ? `<img ${cls ? `class="${cls}" ` : ''}src="${esc(src)}" alt="${esc(alt)}">` : '';
}
// Papers (reports, statements, registers, documents) share a few generic pictures per world,
// which repeat within a case; they show what kind of paper they are instead. Pictures stay for
// what is unique to the case: the weapon and the objects.
const papers = {
  report: [
    'Informe',
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M12 9v6M9 12h6"/>',
  ],
  testimony: ['Declaración', '<circle cx="12" cy="8" r="3"/><path d="M6 20c0-3 3-5 6-5s6 2 6 5"/>'],
  ledger: [
    'Registro',
    '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  ],
  document: [
    'Documento',
    '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 7l9 6 9-6"/>',
  ],
};
function clueHead(clue) {
  const kind = clue.image
    ? clue.image.match(/\/clue-(report|testimony|ledger|document)\.webp$/)?.[1]
    : 'document';
  if (!kind) return img(clue.image, clue.title + ', ilustración', 'clue-art');
  const [label, paths] = papers[kind];
  return `<div class="paper paper-${kind}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg><span>${label}</span></div>`;
}
function card(clue, accusation = false, checked = false) {
  return `<article class="clue">${clueHead(clue)}<span class="eyebrow">${esc(c.rooms.find(r => r.id === clue.room).name)}</span><h3>${esc(clue.title)}</h3><p>${esc(clue.text)}</p>${accusation ? `<label><input type="checkbox" name="evidence" value="${clue.id}" ${checked ? 'checked' : ''}> Adjuntar prueba</label>` : `<button class="small" data-pin="${clue.id}">${state.pinned.includes(clue.id) ? 'Retirar del tablero' : 'Fijar en el tablero'}</button>`}</article>`;
}
function render() {
  const playing = state && !['setup', 'opening'].includes(tab),
    label = tab === 'setup' ? preview.label : worldLabel(state.world),
    title = tab === 'setup' ? preview.title : c.title,
    cover = tab === 'setup' ? preview.rooms[0].image : c.scene.image;
  // The screen is a class of the page, so the phone layout can change per screen.
  app.className = 'screen-' + tab;
  app.innerHTML = `<header><a class="brand" href="/">O<span>MUNDOS<br><small>DETECTIVE STORIES</small></span></a><button id="menu-toggle" class="small menu-toggle" aria-expanded="${menuOpen}" aria-controls="actions">${menuOpen ? 'Cerrar' : 'Menú'}</button><div class="save ${menuOpen ? 'open' : ''}" id="actions">${state && tab !== 'setup' ? `<button class="small go-new" ${busy ? 'disabled' : ''}>Volver al inicio</button>` : ''}${state && !['setup', 'opening'].includes(tab) ? `<button class="small go-opening" ${busy ? 'disabled' : ''}>Releer el prólogo</button>` : ''}${canSpeak ? `<button id="voice" class="small" aria-pressed="${speaking}">Leer en voz alta: ${speaking ? 'sí' : 'no'}</button>` : ''}${state ? '<button id="export" class="small" title="Descarga tu partida para continuarla en otro dispositivo">Guardar una copia</button>' : ''}<label class="small file" title="Una copia de una partida o un caso">Abrir una copia<input id="import" type="file" accept="application/json" ${busy ? 'disabled' : ''}></label><a class="small" href="/editor.html">Editor de casos</a></div></header>${tab !== 'opening' ? `<section class="intro"><div><span class="eyebrow">${esc(label)}</span><h1>${esc(title)}</h1><p>${tab === 'setup' ? esc(preview.premise) : 'Cinco sospechosos. Varios con motivos y acceso al arma.<br>Solo una persona reúne móvil, acceso y ocasión.'}</p></div><div class="manor illustrated">${img(cover, title)}<span>MUNDOS<br>INVESTIGACIÓN</span></div></section>` : ''}${playing ? `<section class="brief"><span class="seal">!</span><p><strong>${esc(c.victim.name)} ha muerto en ${esc(placePhrase(c.scene))}.</strong> El hallazgo se registra a las ${clock(c.timing.discoveryMinute)}. Investiga la causa, el móvil y las coartadas.</p><strong>${state.found.length}<small> / ${c.clues.length} PISTAS</small></strong></section>` : ''}${
    playing && !state.result
      ? `<nav aria-label="Investigación">${[
          ['explore', 'Explorar'],
          ['talk', 'Interrogar'],
          ['board', 'Tablero'],
          ['inventory', 'Inventario'],
          ['accuse', 'Acusar'],
        ]
          .map(
            ([id, label]) =>
              `<button data-tab="${id}" class="${tab === id ? 'active' : ''}" ${tab === id ? 'aria-current="page"' : ''}>${tabIcons[id]}<span>${label}</span></button>`,
          )
          .join('')}</nav>`
      : ''
  }<main>${message ? `<div class="notice" role="status">${esc(message)}</div>` : ''}${playing && !state.result ? helpBar() : ''}${tab === 'setup' ? setup() : tab === 'opening' ? openingScreen() : state.result ? ending() : content()}</main><footer>MUNDOS · ${storageOK ? 'Partida guardada en este navegador' : 'Sin guardado local: guarda una copia desde el menú'}</footer>`;
  bind();
}
// The start screen: the game in progress, a new case in a world, or a classic case.
function setup() {
  const current = state
      ? `<section class="continue"><div><span class="eyebrow">PARTIDA EN CURSO · ${esc(worldLabel(state.world))}</span><h2>${esc(c.title)}</h2><p class="hint">${state.result === 'won' ? 'Resuelto' : `${state.found.length} de ${c.clues.length} pistas encontradas`}</p></div><button id="continue-case" ${busy ? 'disabled' : ''}>Continuar →</button></section>`
      : '',
    first = text => text.match(/^[^.!?]+[.!?]/)?.[0] || text,
    card = (id, label, title, line, image) =>
      `<button class="world-card" data-world="${id}" ${busy ? 'disabled' : ''}><span class="world-art">${image ? img(image, '') : '<span class="world-dice">?</span>'}</span><span><strong>${esc(label)}</strong><em>${esc(title)}</em><small>${esc(line)}</small></span></button>`;
  return `${current}<section class="new-case"><span class="eyebrow">CASO NUEVO</span><h2>Pulsa un mundo para empezar.</h2><p class="hint">El caso se inventa al empezar: en cada partida cambian el culpable, el arma, la escena, los móviles y las coartadas. Puedes jugar en el mismo mundo tantas veces como quieras.</p><div class="difficulty" role="radiogroup" aria-label="Dificultad"><span>Dificultad</span>${difficulties.map(d => `<button class="small ${difficulty === d.id ? 'selected' : ''}" role="radio" aria-checked="${difficulty === d.id}" data-difficulty="${d.id}">${d.label}</button>`).join('')}</div><p class="hint">${{ easy: 'Dos personas con motivo y dos con acceso al arma. Una coartada puede caer por un testigo.', medium: 'Tres personas con motivo y tres con acceso al arma.', hard: 'Cuatro personas con motivo, cuatro con acceso al arma y dos pistas engañosas.' }[difficulty]}</p><div class="world-cards">${worlds
    .map(w => {
      const world = cache.get(w.id);
      return card(w.id, w.label, world.title, first(world.premise), world.rooms[0].image);
    })
    .join(
      '',
    )}${card('random', 'Al azar', 'Sorpresa', 'El mundo se elige al crear el caso.', null)}</div>${state ? '<p class="hint">Empezar otro caso sustituye la partida en curso. Si quieres conservarla, guarda una copia desde el menú.</p>' : ''}</section>${
    classics.length
      ? `<section class="classic-cases"><span class="eyebrow">CASOS CLÁSICOS DE BLACKWOOD</span><h2>Cinco casos escritos a mano.</h2><p class="hint">Los casos originales de Blackwood Manor, en 1924. Son siempre iguales y tienen una historia más trabajada.</p><ul>${classics.map(k => `<li><span><strong>${esc(k.title)}</strong>${k.hook ? `<small>${esc(k.hook)}</small>` : ''}</span><button class="small" data-classic="${esc(k.file)}" ${busy ? 'disabled' : ''}>Jugar</button></li>`).join('')}</ul></section>`
      : ''
  }${
    history.length
      ? `<details class="history"><summary>Casos resueltos: ${history.length}</summary><ul>${history
          .slice(0, 12)
          .map(
            h =>
              `<li><strong>${esc(h.title)}</strong> · ${esc(h.world)}${h.difficulty ? ' · ' + esc(h.difficulty) : ''}<small>${esc(h.date)} · ${esc(h.culprit)}, ${esc(h.weapon.toLocaleLowerCase('es'))} · ${h.attempts ? h.attempts + (h.attempts === 1 ? ' acusación fallida' : ' acusaciones fallidas') : 'a la primera'} · ${h.hints ? h.hints + (h.hints === 1 ? ' pista' : ' pistas') : 'sin pistas'}</small></li>`,
          )
          .join('')}</ul></details>`
      : ''
  }`;
}
function openingScreen() {
  return `<section class="opening-panel"><span class="eyebrow">PRÓLOGO · ${esc(c.title)}</span><h2>Antes de la primera pregunta.</h2>${img(c.scene.image, c.scene.name, 'scene-image')}<div class="opening-prose"><p>${esc(c.opening.arrival)}</p><p class="opening-fact">A las ${clock(c.timing.discoveryMinute)} llega el aviso: han encontrado sin vida a ${esc(c.victim.name)} en ${esc(placePhrase(c.scene))}. La causa y las circunstancias todavía están por esclarecer.</p><p>${esc(c.opening.tension)}</p></div>${speaking ? '<button id="listen-opening" class="secondary">Escuchar el prólogo</button> ' : ''}<button id="begin-investigation">${state.result ? 'Volver al desenlace →' : 'Comenzar la investigación →'}</button></section>`;
}
function enterCase({ replay = false } = {}) {
  tab = (state.result && !replay) || state.openingSeen ? 'explore' : 'opening';
  render();
}
// Icons of the tabs, shown on phones where the tabs are buttons with an icon and a label.
const icon = paths =>
  `<svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const tabIcons = {
  explore: icon('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  talk: icon('<path d="M4 5h16v11H10l-5 4v-4H4z"/>'),
  board: icon('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  inventory: icon('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3"/>'),
  accuse: icon('<path d="M12 4v10"/><circle cx="12" cy="19" r="1"/>'),
};
function helpBar() {
  return `<div class="help-bar"><button id="ask-hint" class="small">${hint && !hint.last ? 'Otra pista más concreta' : 'Pedir una pista'}</button>${hint ? `<p role="status">${esc(hint.text)}</p>` : '<p>¿Atascado? Pide una pista: cada vez será más concreta.</p>'}</div>`;
}
// The notebook: one row per person; each cell holds the clue that proves the condition.
function notebook() {
  const found = c.clues.filter(x => state.found.includes(x.id)),
    suspects = notebookSuspects(c, state),
    labels = { motive: 'Motivo', access: 'Acceso al arma', alibi: 'Coartada' },
    cell = (p, condition) => {
      const entry = state.notebook[p.id]?.[condition];
      if (entry) {
        const clue = c.clues.find(x => x.id === entry.clue),
          mark =
            condition !== 'alibi'
              ? 'Sí'
              : entry.verdict === 'refuted'
                ? 'Desmentida'
                : 'Confirmada';
        return `<td data-label="${labels[condition]}" class="${entry.verdict === 'confirmed' ? 'clear' : 'proven'}"><strong>${mark}</strong><small>${esc(clue.title)}</small><button class="small" data-unnote="${p.id}:${condition}" aria-label="Borrar anotación">×</button></td>`;
      }
      return `<td data-label="${labels[condition]}"><select data-note="${p.id}:${condition}" aria-label="${labels[condition]} de ${esc(p.name)}"><option value="">Anotar prueba…</option>${found.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select></td>`;
    };
  return `<section class="notebook"><h3>Cuaderno de deducción</h3><p class="hint">Anota la prueba que demuestra cada cosa. Solo se guarda si la prueba lo demuestra de verdad. La persona culpable tiene motivo, acceso al arma y una coartada desmentida.</p><div class="notebook-scroll"><table><thead><tr><th>Persona</th>${conditions.map(k => `<th>${labels[k]}</th>`).join('')}</tr></thead><tbody>${c.people.map(p => `<tr class="${suspects.includes(p.id) ? 'suspect' : ''}"><th>${esc(p.name)}<small>${suspects.includes(p.id) ? 'Reúne las tres condiciones' : esc(p.role)}</small>${noteMessage?.person === p.id ? `<p class="note-message" role="status">${esc(noteMessage.text)}</p>` : ''}</th>${conditions.map(k => cell(p, k)).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
function ending() {
  return `<section class="ending"><span class="eyebrow">${state.result === 'won' ? 'CASO RESUELTO' : 'REVISIÓN NECESARIA'}</span><h2>${state.result === 'won' ? 'La verdad sale a la luz.' : 'Faltan piezas.'}</h2><p>${esc(prototypeResolution(c, state))}</p>${state.help.used ? `<p class="hint">Has pedido ${state.help.used === 1 ? 'una pista' : state.help.used + ' pistas'} de ayuda.</p>` : ''}${state.result === 'lost' ? '<button id="reopen">Reabrir investigación</button>' : ''}<button id="end-new" class="secondary">Otra investigación</button></section>`;
}
function content() {
  if (tab === 'explore') {
    const room = c.rooms.find(r => r.id === state.room);
    return `<h2>Registra los escenarios.</h2><div class="exploration"><aside class="rooms">${c.rooms.map(r => `<button data-room="${r.id}" class="${r.id === room.id ? 'selected' : ''}"><strong>${esc(r.name)}</strong><small>${c.clues.filter(x => x.room === r.id && state.found.includes(x.id)).length}/${c.clues.filter(x => x.room === r.id).length}</small></button>`).join('')}</aside><section class="room-detail"><span class="eyebrow">ESCENA / ${esc(room.name)}</span><h2>${esc(room.name)}</h2>${img(room.image, room.name, 'scene-image')}<p>${esc(room.description)}</p><div class="search-grid">${c.clues
      .filter(x => x.room === room.id)
      .map(
        x =>
          `<button data-search="${x.id}" ${state.found.includes(x.id) ? 'disabled' : ''}><strong>${esc(x.title)}</strong><small>${state.found.includes(x.id) ? 'En tu expediente' : 'Inspeccionar'}</small></button>`,
      )
      .join('')}</div></section></div><div class="cards">${c.clues
      .filter(x => x.room === room.id && state.found.includes(x.id))
      .map(x => card(x))
      .join('')}</div>`;
  }
  if (tab === 'talk') {
    const actor = c.people.find(p => p.id === person),
      labels = {
        alibi: 'Tu coartada',
        motive: 'Tu relación con la víctima',
        secret: 'El documento sobre ti',
        link: 'Tu acceso al arma',
        timeline: 'Quién confirma tu coartada',
        seen: 'Lo que viste',
        object: 'El objeto junto a la puerta',
      };
    return `<h2>Cinco versiones. Contrasta cada una.</h2><div class="suspects">${c.people.map(p => `<button data-person="${p.id}" class="${p.id === person ? 'selected' : ''}" ${busy ? 'disabled' : ''}><span class="avatar">${img(p.image, '')}</span><strong>${esc(p.name)}</strong><small>${esc(p.role)}</small></button>`).join('')}</div><section class="conversation"><div class="interview-portrait">${img(actor.image, actor.name)}<span>${esc(actor.name)}<small>${esc(actor.role)}</small></span></div><h3>${esc(actor.name)}</h3><p class="hint">Pregunta con tus palabras y contrasta las respuestas con las pruebas que encuentres. Los secretos requieren descubrir su documento.</p><div class="messages" aria-live="polite">${
      state.chat
        .filter(m => m.person === person)
        .map(
          m =>
            `<div class="question">${esc(m.question)}</div><div class="reply">${esc(m.answer)}</div>`,
        )
        .join('') || '<p class="empty">Empieza por su coartada.</p>'
    }</div><div class="prompts">${prototypeFacts(c, state, person)
      .map(
        f =>
          `<button class="small" data-prompt="${f.id}" ${busy ? 'disabled' : ''}>${labels[f.id]}</button>`,
      )
      .join('')}</div>${
      state.found.length
        ? `<form id="show" class="show-evidence"><select name="clue" aria-label="Prueba para enseñar" ${busy ? 'disabled' : ''}><option value="">Enseñar una prueba…</option>${c.clues
            .filter(x => state.found.includes(x.id))
            .map(x => `<option value="${x.id}">${esc(x.title)}</option>`)
            .join(
              '',
            )}</select><button class="small" ${busy ? 'disabled' : ''}>Enseñar</button></form>`
        : ''
    }<form id="ask"><input name="question" aria-label="Tu pregunta" maxlength="1000" placeholder="¿Dónde estabas cuando ocurrió?" required ${busy ? 'disabled' : ''}><button ${busy ? 'disabled' : ''}>${busy ? 'Escuchando…' : 'Preguntar →'}</button></form></section>`;
  }
  if (tab === 'board')
    return `<h2>Tu tablero de investigación.</h2>${notebook()}<h3>Pistas fijadas</h3><p class="hint">Las pistas fijadas no se pierden al cambiar de habitación.</p><div class="cards">${
      c.clues
        .filter(x => state.pinned.includes(x.id))
        .map(x => card(x))
        .join('') || '<p>No hay pistas fijadas todavía.</p>'
    }</div><label class="notes">Notas del detective<textarea id="notes" maxlength="10000">${esc(state.notes)}</textarea></label>`;
  if (tab === 'inventory')
    return `<h2>Objetos y documentos.</h2><div class="cards">${
      c.clues
        .filter(x => state.found.includes(x.id))
        .map(x => card(x))
        .join('') || '<p>Explora los escenarios para recoger pruebas.</p>'
    }</div>`;
  const proven = notebookSuspects(c, state).flatMap(id =>
    conditions.map(k => state.notebook[id][k].clue),
  );
  return `<h2>La acusación final.</h2><p>Identifica persona, arma y escena. Adjunta una prueba de su móvil, una de su acceso al arma y una que desmienta su coartada. Si fallas podrás reabrir el caso.</p><form id="accuse"><div class="fields">${[
    ['person', 'Culpable', c.people],
    ['method', 'Arma', c.weapons.map(w => ({ id: w.method, name: w.label }))],
    ['room', 'Lugar', c.rooms],
  ]
    .map(
      ([id, label, list]) =>
        `<label>${label}<select name="${id}" aria-label="${label}" required><option value="">Seleccionar…</option>${list.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>`,
    )
    .join('')}</div><h3>Adjunta al menos tres pruebas</h3><div class="cards">${c.clues
    .filter(x => state.found.includes(x.id))
    .map(x => card(x, true, proven.includes(x.id)))
    .join(
      '',
    )}</div><button class="danger" ${busy ? 'disabled' : ''}>Presentar acusación</button></form>`;
}
function bind() {
  document.querySelector('#menu-toggle').onclick = () => {
    menuOpen = !menuOpen;
    render();
  };
  document.querySelector('#export')?.addEventListener('click', exportSave);
  document.querySelector('#voice')?.addEventListener('click', () => {
    speaking = !speaking;
    remember('mundos-voz', speaking);
    if (!speaking) speechSynthesis.cancel();
    render();
  });
  document
    .querySelector('#listen-opening')
    ?.addEventListener('click', () =>
      speak(
        [
          c.opening.arrival,
          `A las ${clock(c.timing.discoveryMinute)} llega el aviso: han encontrado sin vida a ${c.victim.name} en ${placePhrase(c.scene)}.`,
          c.opening.tension,
        ].join(' '),
      ),
    );
  document.querySelector('#import').onchange = async e => {
    if (busy) return;
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1000000) throw Error('Archivo demasiado grande');
      const raw = JSON.parse(await file.text());
      // A case file starts a fresh investigation; a save continues where it was left.
      if (raw.format === CASE_FORMAT) state = newPrototype(null, { caseFile: raw });
      else if (raw.format === SAVE_FORMAT) state = restorePrototype(raw);
      else throw Error('No es un expediente ni una partida de Mundos');
      c = createPrototypeCase(state);
      person = c.people[0].id;
      hint = null;
      noteMessage = null;
      if (cache.has(state.world)) {
        setupWorld = state.world;
        preview = cache.get(setupWorld);
      }
      save();
      message = raw.format === CASE_FORMAT ? 'Caso importado.' : 'Partida importada.';
      enterCase();
      return;
    } catch (e) {
      message = 'No se pudo importar: ' + e.message;
    }
    render();
  };
  document.querySelectorAll('[data-difficulty]').forEach(
    b =>
      (b.onclick = () => {
        difficulty = b.dataset.difficulty;
        remember('mundos-dificultad', difficulty);
        render();
      }),
  );
  // A game half played is only replaced if the player says so.
  const replaceCurrent = () =>
    !state || state.result || confirm('Empezar otro caso sustituye la partida en curso. ¿Seguir?');
  document.querySelectorAll('[data-world]').forEach(
    b =>
      (b.onclick = () => {
        if (busy || !replaceCurrent()) return;
        setupWorld = b.dataset.world;
        startCase();
      }),
  );
  function startCase() {
    try {
      const world = cache.get(selectWorld(setupWorld));
      preview = world;
      state = newPrototype(world, {
        previousMethodId: c?.method.id,
        previousPersonId: c?.culprit.id,
        difficulty,
      });
      c = createPrototypeCase(state);
      person = c.people[0].id;
      hint = null;
      noteMessage = null;
      message = '';
      save();
      enterCase();
    } catch (e) {
      message = 'No se ha creado la investigación: ' + e.message;
      render();
    }
  }
  document.querySelectorAll('[data-classic]').forEach(
    b =>
      (b.onclick = async () => {
        const file = b.dataset.classic;
        if (busy || !classics.some(k => k.file === file) || !replaceCurrent()) return;
        busy = true;
        try {
          const caseFile = await (await fetch('/cases/' + file)).json();
          state = newPrototype(null, { caseFile });
          c = createPrototypeCase(state);
          person = c.people[0].id;
          hint = null;
          noteMessage = null;
          message = '';
          save();
          busy = false;
          enterCase();
        } catch (e) {
          busy = false;
          message = 'No se pudo abrir el caso: ' + e.message;
          render();
        }
      }),
  );
  document.querySelector('#continue-case')?.addEventListener('click', () => {
    if (busy) return;
    message = '';
    enterCase();
  });
  document.querySelectorAll('.go-opening').forEach(
    b =>
      (b.onclick = () => {
        if (busy) return;
        menuOpen = false;
        tab = 'opening';
        render();
      }),
  );
  document.querySelector('#begin-investigation')?.addEventListener('click', () => {
    state.openingSeen = true;
    tab = 'explore';
    save();
    render();
  });
  document.querySelectorAll('.go-new, #end-new').forEach(
    b =>
      (b.onclick = () => {
        if (busy) return;
        menuOpen = false;
        tab = 'setup';
        message = '';
        render();
      }),
  );
  document.querySelector('#reopen')?.addEventListener('click', () => {
    state.result = null;
    tab = 'explore';
    save();
    render();
  });
  document.querySelectorAll('[data-tab]').forEach(
    b =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        menuOpen = false;
        message = '';
        render();
      }),
  );
  document.querySelectorAll('[data-room]').forEach(
    b =>
      (b.onclick = () => {
        state.room = b.dataset.room;
        save();
        render();
      }),
  );
  document.querySelectorAll('[data-search]').forEach(
    b =>
      (b.onclick = () => {
        inspectPrototype(c, state, b.dataset.search);
        save();
        render();
      }),
  );
  document.querySelectorAll('[data-pin]').forEach(
    b =>
      (b.onclick = () => {
        const id = b.dataset.pin;
        state.pinned = state.pinned.includes(id)
          ? state.pinned.filter(x => x !== id)
          : [...state.pinned, id];
        save();
        render();
      }),
  );
  document.querySelectorAll('[data-person]').forEach(
    b =>
      (b.onclick = () => {
        if (busy) return;
        person = b.dataset.person;
        render();
      }),
  );
  document.querySelector('#ask-hint')?.addEventListener('click', () => {
    hint = nextHint(c, state);
    save();
    render();
  });
  document.querySelectorAll('[data-note]').forEach(
    select =>
      (select.onchange = () => {
        if (!select.value) return;
        const [who, condition] = select.dataset.note.split(':');
        // The answer shows in that person's row, where the player is looking.
        noteMessage = {
          person: who,
          text: noteEntry(c, state, who, condition, select.value).message,
        };
        save();
        render();
      }),
  );
  document.querySelectorAll('[data-unnote]').forEach(
    b =>
      (b.onclick = () => {
        const [who, condition] = b.dataset.unnote.split(':');
        clearEntry(state, who, condition);
        noteMessage = null;
        save();
        render();
      }),
  );
  document.querySelector('#notes')?.addEventListener('input', e => {
    state.notes = e.target.value;
    save();
  });
  const questions = {
    alibi: '¿Dónde estabas durante el crimen?',
    motive: '¿Cómo era tu relación con la víctima?',
    secret: '¿Qué dices del documento que encontré sobre ti?',
    link: '¿Podías llegar al arma del crimen?',
    timeline: '¿Quién puede confirmar tu coartada?',
    seen: '¿Viste u oíste algo fuera de lo normal?',
    object: '¿Es tuyo el objeto que apareció junto a la puerta?',
  };
  document
    .querySelectorAll('[data-prompt]')
    .forEach(b => (b.onclick = () => ask(questions[b.dataset.prompt])));
  document.querySelector('#show')?.addEventListener('submit', e => {
    e.preventDefault();
    const clue = new FormData(e.target).get('clue');
    if (busy || !clue) return;
    const reply = presentEvidence(c, state, person, clue);
    speak(reply.answer, person);
    save();
    render();
    document.querySelector('.messages')?.scrollTo(0, 999999);
  });
  document.querySelector('#ask')?.addEventListener('submit', e => {
    e.preventDefault();
    ask(new FormData(e.target).get('question'));
  });
  document.querySelector('#accuse')?.addEventListener('submit', e => {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.target);
    try {
      if (
        accusePrototype(c, state, {
          person: f.get('person'),
          method: f.get('method'),
          room: f.get('room'),
          evidence: f.getAll('evidence'),
        }) === 'won'
      )
        record();
      message = '';
      save();
      render();
    } catch (error) {
      // Shown next to the button the player just pressed (on a phone it is far below the form's top).
      const form = e.target,
        note = form.querySelector('.accuse-error') || document.createElement('p');
      note.className = 'accuse-error';
      note.setAttribute('role', 'alert');
      note.textContent = error.message + '.';
      form.querySelector('.danger').before(note);
      note.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
}
async function ask(question) {
  if (busy || !question?.trim() || state.result) return;
  const current = state.caseId,
    target = person;
  message = '';
  let result;
  try {
    result = answerOffline(c, state, target, question, { questionRouter: routerModel });
  } catch (e) {
    message = e.message;
    render();
    return;
  }
  if (result.unplaced && serverModel) {
    busy = true;
    render();
    try {
      const response = await fetch('/api/prototype/interrogate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(28000),
          body: JSON.stringify({
            state: { ...state, notes: '', chat: state.chat.slice(-4) },
            person: target,
            question,
          }),
        }),
        remote = await response.json();
      if (response.ok) result = remote;
    } catch {
      // The offline answer stands.
    }
  }
  if (state.caseId === current && !state.result) {
    state.chat.push({ person: target, question, ...result });
    speak(result.answer, target);
    save();
  }
  busy = false;
  render();
  document.querySelector('.messages')?.scrollTo(0, 999999);
}
