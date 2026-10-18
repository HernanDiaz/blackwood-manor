import { placePhrase } from '/src/spanish-prose.mjs';
import { worlds, worldFile, selectWorld } from '/src/prototype-worlds.mjs';
import { normalizeWorld } from '/src/world-file.mjs';
import {
  newPrototype,
  restorePrototype,
  createPrototypeCase,
  worldWeapons,
  inspectPrototype,
  prototypeFacts,
  accusePrototype,
  prototypeResolution,
  exportCaseFile,
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
const worldLabel = id => worlds.find(w => w.id === id)?.label || 'Caso importado';

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
  noteMessage = '';
try {
  for (const w of worlds) await loadWorld(w.id);
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
    message = 'No se pudo guardar. Exporta una copia de tu partida.';
  }
}
function exportSave() {
  download(
    state ? JSON.stringify(state, null, 2) : localStorage.getItem(key),
    'mundos-partida.json',
  );
}
// The case without the player's progress: characters, places, crime, clues and statements.
function exportCase() {
  download(JSON.stringify(exportCaseFile(state), null, 2), 'mundos-expediente.json');
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
function card(clue, accusation = false, checked = false) {
  return `<article class="clue">${img(clue.image, clue.title + ', ilustración', 'clue-art')}<span class="eyebrow">${esc(c.rooms.find(r => r.id === clue.room).name)}</span><h3>${esc(clue.title)}</h3><p>${esc(clue.text)}</p>${accusation ? `<label><input type="checkbox" name="evidence" value="${clue.id}" ${checked ? 'checked' : ''}> Adjuntar prueba</label>` : `<button class="small" data-pin="${clue.id}">${state.pinned.includes(clue.id) ? 'Retirar del tablero' : 'Fijar en el tablero'}</button>`}</article>`;
}
function render() {
  const playing = state && !['setup', 'opening'].includes(tab),
    label = tab === 'setup' ? preview.label : worldLabel(state.world),
    title = tab === 'setup' ? preview.title : c.title,
    cover = tab === 'setup' ? preview.rooms[0].image : c.scene.image;
  app.innerHTML = `<header><a class="brand" href="/">O<span>MUNDOS<br><small>DETECTIVE STORIES</small></span></a><div class="save"><button id="export" class="small">Exportar partida</button>${state ? '<button id="export-case" class="small">Exportar caso</button>' : ''}<button id="reset-prototype" class="small" ${busy ? 'disabled' : ''}>Borrar partida</button><label class="small file">Importar<input id="import" type="file" accept="application/json" ${busy ? 'disabled' : ''}></label></div></header>${tab !== 'opening' ? `<section class="intro"><div><span class="eyebrow">${esc(label)}</span><h1>${esc(title)}</h1><p>${tab === 'setup' ? esc(preview.premise) : 'Cinco sospechosos. Varios con motivos y acceso al arma.<br>Solo una persona reúne móvil, acceso y ocasión.'}</p></div><div class="manor illustrated">${img(cover, title)}<span>MUNDOS<br>INVESTIGACIÓN</span></div></section>` : ''}${playing ? `<section class="brief"><span class="seal">!</span><p><strong>${esc(c.victim.name)} ha muerto en ${esc(placePhrase(c.scene))}.</strong> El hallazgo se registra a las ${clock(c.timing.discoveryMinute)}. Investiga la causa, el móvil y las coartadas.</p><strong>${state.found.length}<small> / ${c.clues.length} PISTAS</small></strong></section>` : ''}${
    playing
      ? `<nav aria-label="Investigación">${[
          ['explore', 'Explorar'],
          ['talk', 'Interrogar'],
          ['board', 'Tablero'],
          ['inventory', 'Inventario'],
          ['accuse', 'Acusar'],
        ]
          .map(
            ([id, label]) =>
              `<button data-tab="${id}" class="${tab === id ? 'active' : ''}">${label}</button>`,
          )
          .join(
            '',
          )}<button id="new-case" ${busy ? 'disabled' : ''}>Otra investigación</button><button id="read-opening" ${busy ? 'disabled' : ''}>Leer el prólogo</button></nav>`
      : ''
  }<main>${message ? `<div class="notice" role="status">${esc(message)}</div>` : ''}${playing && !state.result ? helpBar() : ''}${tab === 'setup' ? setup() : tab === 'opening' ? openingScreen() : state.result ? ending() : content()}</main><footer>MUNDOS · ${storageOK ? 'Partida guardada en este navegador' : 'Sin guardado local: exporta tu partida'}<span><a href="/">Volver a Blackwood</a></span></footer>`;
  bind();
}
function setup() {
  const portrait = setupWorld === 'random' ? null : preview.people[0];
  return `<section class="pilot-panel">${portrait ? img(portrait.image, portrait.name, 'pilot-portrait') : ''}<div><span class="eyebrow">NUEVA INVESTIGACIÓN</span><h2>Elige dónde ocurre el crimen.</h2><p>Cada mundo tiene sus propios personajes y escenarios. En cada investigación cambian el culpable, el arma, la escena, los móviles y las coartadas.</p><label class="dialogue-settings">Mundo<select ${busy ? 'disabled' : ''} id="world-choice" aria-label="Mundo">${[...worlds, { id: 'random', label: 'Al azar' }].map(w => `<option value="${w.id}" ${setupWorld === w.id ? 'selected' : ''}>${esc(w.label)}</option>`).join('')}</select></label><p class="hint">${setupWorld === 'random' ? 'El mundo se elige al crear la investigación.' : esc(preview.people.map(p => p.name).join(', ')) + '.'}</p><label class="dialogue-settings">Arma (solo para probar)<select ${busy ? 'disabled' : ''} id="method-choice" aria-label="Arma para probar"><option value="">Sorpresa</option>${(setupWorld === 'random' ? [] : worldWeapons(preview)).map(w => `<option value="${w.method}">${esc(w.label)}</option>`).join('')}</select></label><p class="hint">Elegir el arma revela esa parte de la solución. Con «Sorpresa», cada investigación intenta usar un arma distinta de la anterior.</p>${state ? '<p class="hint">Crear otra investigación sustituye la partida actual. Puedes exportarla antes; tu partida de Blackwood no se toca.</p>' : ''}<div class="pilot-actions"><button id="start-case" ${busy ? 'disabled' : ''}>Crear investigación →</button>${state ? `<button id="continue-case" ${busy ? 'disabled' : ''}>Continuar la actual</button>` : ''}</div></div></section>`;
}
function openingScreen() {
  return `<section class="opening-panel"><span class="eyebrow">PRÓLOGO · ${esc(c.title)}</span><h2>Antes de la primera pregunta.</h2>${img(c.scene.image, c.scene.name, 'scene-image')}<div class="opening-prose"><p>${esc(c.opening.arrival)}</p><p class="opening-fact">A las ${clock(c.timing.discoveryMinute)} llega el aviso: han encontrado sin vida a ${esc(c.victim.name)} en ${esc(placePhrase(c.scene))}. La causa y las circunstancias todavía están por esclarecer.</p><p>${esc(c.opening.tension)}</p></div><button id="begin-investigation">${state.result ? 'Volver al desenlace →' : 'Comenzar la investigación →'}</button></section>`;
}
function enterCase({ replay = false } = {}) {
  tab = (state.result && !replay) || state.openingSeen ? 'explore' : 'opening';
  render();
}
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
        return `<td class="${entry.verdict === 'confirmed' ? 'clear' : 'proven'}"><strong>${mark}</strong><small>${esc(clue.title)}</small><button class="small" data-unnote="${p.id}:${condition}" aria-label="Borrar anotación">×</button></td>`;
      }
      return `<td><select data-note="${p.id}:${condition}" aria-label="${labels[condition]} de ${esc(p.name)}"><option value="">Anotar prueba…</option>${found.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select></td>`;
    };
  return `<section class="notebook"><h3>Cuaderno de deducción</h3><p class="hint">Anota la prueba que demuestra cada cosa. Solo se guarda si la prueba lo demuestra de verdad. La persona culpable tiene motivo, acceso al arma y una coartada desmentida.</p>${noteMessage ? `<p class="note-message" role="status">${esc(noteMessage)}</p>` : ''}<div class="notebook-scroll"><table><thead><tr><th>Persona</th>${conditions.map(k => `<th>${labels[k]}</th>`).join('')}</tr></thead><tbody>${c.people.map(p => `<tr class="${suspects.includes(p.id) ? 'suspect' : ''}"><th>${esc(p.name)}<small>${suspects.includes(p.id) ? 'Reúne las tres condiciones' : esc(p.role)}</small></th>${conditions.map(k => cell(p, k)).join('')}</tr>`).join('')}</tbody></table></div></section>`;
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
      .join(
        '',
      )}</div><form id="ask"><input name="question" aria-label="Tu pregunta" maxlength="1000" placeholder="¿Dónde estabas cuando ocurrió?" required ${busy ? 'disabled' : ''}><button ${busy ? 'disabled' : ''}>${busy ? 'Escuchando…' : 'Preguntar →'}</button></form></section>`;
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
  document.querySelector('#export').onclick = exportSave;
  document.querySelector('#export-case')?.addEventListener('click', exportCase);
  document.querySelector('#reset-prototype').onclick = () => {
    if (busy) return;
    try {
      const previous = localStorage.getItem(key);
      if (previous) localStorage.setItem(key + '-copia-' + Date.now(), previous);
      localStorage.removeItem(key);
      state = null;
      c = null;
      tab = 'setup';
      message = 'Partida borrada. Se ha guardado una copia de seguridad en este navegador.';
    } catch {
      message = 'No se pudo guardar la copia de seguridad; la partida no se ha borrado.';
    }
    render();
  };
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
      noteMessage = '';
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
  document.querySelector('#world-choice')?.addEventListener('change', e => {
    setupWorld = e.target.value;
    if (setupWorld !== 'random') preview = cache.get(setupWorld);
    render();
  });
  document.querySelector('#start-case')?.addEventListener('click', () => {
    if (busy) return;
    const forcedMethodId = document.querySelector('#method-choice').value;
    try {
      const world = cache.get(selectWorld(setupWorld));
      state = newPrototype(world, {
        previousMethodId: c?.method.id,
        previousPersonId: c?.culprit.id,
        forcedMethodId,
      });
      c = createPrototypeCase(state);
      person = c.people[0].id;
      hint = null;
      noteMessage = '';
      message = '';
      save();
      enterCase();
    } catch (e) {
      message = 'No se ha creado la investigación: ' + e.message;
      render();
    }
  });
  document.querySelector('#continue-case')?.addEventListener('click', () => {
    if (busy) return;
    message = '';
    enterCase();
  });
  document.querySelector('#read-opening')?.addEventListener('click', () => {
    if (busy) return;
    enterCase({ replay: true });
    tab = 'opening';
    render();
  });
  document.querySelector('#begin-investigation')?.addEventListener('click', () => {
    state.openingSeen = true;
    tab = 'explore';
    save();
    render();
  });
  for (const id of ['new-case', 'end-new'])
    document.querySelector('#' + id)?.addEventListener('click', () => {
      if (busy) return;
      tab = 'setup';
      message = '';
      render();
    });
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
        noteMessage = noteEntry(c, state, who, condition, select.value).message;
        save();
        render();
      }),
  );
  document.querySelectorAll('[data-unnote]').forEach(
    b =>
      (b.onclick = () => {
        const [who, condition] = b.dataset.unnote.split(':');
        clearEntry(state, who, condition);
        noteMessage = '';
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
  document.querySelector('#ask')?.addEventListener('submit', e => {
    e.preventDefault();
    ask(new FormData(e.target).get('question'));
  });
  document.querySelector('#accuse')?.addEventListener('submit', e => {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.target);
    try {
      accusePrototype(c, state, {
        person: f.get('person'),
        method: f.get('method'),
        room: f.get('room'),
        evidence: f.getAll('evidence'),
      });
      message = '';
      save();
      render();
    } catch (e) {
      message = e.message;
      const note = document.createElement('p');
      note.role = 'alert';
      note.textContent = message;
      e.target.prepend(note);
    }
  });
}
async function ask(question) {
  if (busy || !question?.trim() || state.result) return;
  busy = true;
  const current = state.caseId,
    target = person;
  message = '';
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
      result = await response.json();
    if (!response.ok) throw Error(result.error);
    if (state.caseId === current && !state.result) {
      state.chat.push({ person: target, question, ...result });
      save();
    }
  } catch {
    message = 'No se pudo completar el interrogatorio. Comprueba el servidor y vuelve a preguntar.';
  }
  busy = false;
  render();
  document.querySelector('.messages')?.scrollTo(0, 999999);
}
