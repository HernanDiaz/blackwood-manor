import { placePhrase } from '/src/spanish-prose.mjs';
import { worlds, worldFile, selectWorld } from '/src/prototype-worlds.mjs';
import { normalizeWorld } from '/src/world-file.mjs';
import { difficulties } from '/src/case-generator.mjs';
import { uiText, deviceLanguage } from '/src/ui-text.mjs';
import { answerOffline } from '/src/interrogation.mjs';
import { setEffect } from '/effects.mjs';
import { setSound, setAmbience, play } from '/sound.mjs';
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
  retellPrototype,
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
// The language of the screens: the one chosen in the menu, or the phone's.
let lang = remembered('mundos-idioma', null);
if (!uiText[lang]) lang = deviceLanguage(navigator.languages || [navigator.language || '']);
let T = uiText[lang];
// Worlds, classic cases and question routers, loaded once per language.
const cache = new Map(),
  routers = {},
  classicLists = {};
const worldKey = (id, l = lang) => l + ':' + id;
async function loadWorld(id, l = lang) {
  if (!cache.has(worldKey(id, l))) {
    const r = await fetch('/' + worldFile(id, l));
    if (!r.ok) throw Error(uiText[l].loadWorldFailed);
    cache.set(worldKey(id, l), normalizeWorld(await r.json()));
  }
  return cache.get(worldKey(id, l));
}
const classicFile = (file, l) => (l === 'en' ? file.replace(/\.json$/, '.en.json') : file);
async function loadLanguage(l) {
  for (const w of worlds) await loadWorld(w.id, l);
  // The statistical router answers questions in the browser; without it the rules still do.
  if (!(l in routers))
    try {
      routers[l] = await (
        await fetch(l === 'en' ? '/src/question-router-model.en.json' : '/src/question-router-model.json')
      ).json();
    } catch {
      routers[l] = null;
    }
  if (!(l in classicLists))
    try {
      classicLists[l] =
        (await (await fetch(l === 'en' ? '/cases/index.en.json' : '/cases/index.json')).json())
          .cases || [];
    } catch {
      classicLists[l] = [];
    }
}
let serverModel = false;
const worldLabel = id => cache.get(worldKey(id))?.label || T.imported;
// The same game in another language: a generated case is made again from its seed, a classic
// case is looked up among the classics of that language. Null when there is no such version.
async function retell(saved, l) {
  const file = saved.case,
    origin = file.origin || {};
  try {
    if (origin.generator === 'mundos-1' && worlds.some(w => w.id === file.world)) {
      const world = await loadWorld(file.world, l),
        { seed, difficulty, previousMethodId, previousPersonId, forcedMethodId } = origin;
      return retellPrototype(
        saved,
        newPrototype(world, { seed, difficulty, previousMethodId, previousPersonId, forcedMethodId })
          .case,
      );
    }
    for (const k of classicLists[l] || []) {
      const other = await (await fetch('/cases/' + classicFile(k.file, l))).json(),
        retold = retellPrototype(saved, other);
      if (retold) return retold;
    }
  } catch {}
  return null;
}
// A game in another language than the screens is told in theirs, when that version exists.
async function matchLanguage() {
  if (!state || c.lang === lang) return;
  const retold = await retell(state, lang);
  if (retold) {
    state = retold;
    c = createPrototypeCase(state);
    hint = null;
    save();
  } else message = T.untranslated;
}
function showLanguage() {
  document.documentElement.lang = lang;
  document.title = T.pageTitle;
}

let history = remembered('mundos-historial', []),
  speaking = remembered('mundos-voz', false) === true;
if (!Array.isArray(history)) history = [];
// Reading aloud with the voice of the system: no download, works offline.
const canSpeak = 'speechSynthesis' in globalThis;
function speak(text, who) {
  if (!speaking || !canSpeak) return;
  speechSynthesis.cancel();
  // The voice speaks the language of the case.
  const tag = uiText[c?.lang || lang].speech,
    u = new SpeechSynthesisUtterance(text),
    voices = speechSynthesis.getVoices().filter(v => v.lang?.startsWith(tag.slice(0, 2))),
    actor = c?.people.find(p => p.id === who);
  u.lang = tag;
  u.voice = voices.find(v => v.lang === tag) || voices[0] || null;
  if (actor) {
    // A different pitch and pace for each person, so they do not all sound alike.
    const n = Number(actor.id.slice(1));
    u.pitch = (actor.gender === 'f' ? 1.15 : 0.8) + (n % 3) * 0.08;
    u.rate = 0.95 + (n % 2) * 0.1;
  }
  speechSynthesis.speak(u);
}
let sounding = remembered('mundos-sonido', false) === true;
setSound(sounding);
// Colours, background effect and ambience of the world on screen.
const lookKeys = {
  bg: '--bg',
  panel: '--panel',
  line: '--line',
  accent: '--gold',
  text: '--text',
  muted: '--muted',
};
let shownLook = null;
function applyLook(look) {
  if (look === shownLook) return;
  shownLook = look;
  const root = document.documentElement.style;
  for (const [key, variable] of Object.entries(lookKeys))
    look ? root.setProperty(variable, look[key]) : root.removeProperty(variable);
  setEffect(look?.effect);
  setAmbience(look?.effect);
}
// A line chosen by the case and the room, so it stays the same on every visit.
const stable = (list, key) =>
  list[[...key].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7) % list.length];
// How far the night has gone: one line per stretch of found clues, with its time.
function nightNow() {
  const lines = c.file.night;
  if (!lines?.length) return '';
  const step = Math.min(
    lines.length - 1,
    Math.floor((state.found.length / c.clues.length) * lines.length),
  );
  return clock(c.timing.discoveryMinute + 10 + step * 25) + ' · ' + lines[step];
}
function record() {
  const weapon = c.weapons.find(w => w.method === c.method.id);
  history = [
    {
      date: new Date().toISOString().slice(0, 10),
      world: worldLabel(state.world),
      title: c.title,
      difficulty: T.difficulties[c.file.origin?.difficulty] || '',
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
  showLanguage();
  await loadLanguage(lang);
  // A local server with a model can place the questions nothing else can (see server.mjs).
  fetch('/api/prototype/status', { signal: AbortSignal.timeout(2000) })
    .then(r => (r.ok ? r.json() : {}))
    .then(status => (serverModel = status.model === true))
    .catch(() => {});
  preview = cache.get(worldKey(setupWorld));
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      state = restorePrototype(saved);
      c = createPrototypeCase(state);
      if (cache.has(worldKey(state.world))) {
        setupWorld = state.world;
        preview = cache.get(worldKey(setupWorld));
      }
      await matchLanguage();
    } catch {
      message = T.incompatibleSave;
      state = null;
    }
  }
  render();
} catch (e) {
  console.error(e);
  app.innerHTML = T.fatal;
}
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    storageOK = true;
  } catch {
    storageOK = false;
    message = T.saveFailed;
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
    'report',
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M12 9v6M9 12h6"/>',
  ],
  testimony: ['testimony', '<circle cx="12" cy="8" r="3"/><path d="M6 20c0-3 3-5 6-5s6 2 6 5"/>'],
  ledger: [
    'ledger',
    '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  ],
  document: [
    'document',
    '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 7l9 6 9-6"/>',
  ],
};
// false: every clue shows its picture, generic ones included (the papers repeat within a case).
// true: papers show their kind over the room where they were found.
const paperHeaders = false;
function clueHead(clue) {
  if (!paperHeaders) return img(clue.image, T.illustration(clue.title), 'clue-art');
  const kind = clue.image
    ? clue.image.match(/\/clue-(report|testimony|ledger|document)\.webp$/)?.[1]
    : 'document';
  if (!kind) return img(clue.image, T.illustration(clue.title), 'clue-art');
  const [label, paths] = papers[kind],
    // The room where it was found, darkened behind the kind of paper, keeps the atmosphere.
    room = c.rooms.find(r => r.id === clue.room);
  return `<div class="paper paper-${kind}">${room?.image ? `<img class="paper-bg" src="${esc(room.image)}" alt="">` : ''}<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg><span>${T.papers[label]}</span></div>`;
}
function card(clue) {
  const number = state.found.indexOf(clue.id) + 1;
  return `<article class="clue">${number ? `<span class="stamp">${T.evidenceNumber(number)}</span>` : ''}${clueHead(clue)}<span class="eyebrow">${esc(c.rooms.find(r => r.id === clue.room).name)}</span><h3>${esc(clue.title)}</h3><p>${esc(clue.text)}</p><button class="small" data-pin="${clue.id}">${state.pinned.includes(clue.id) ? T.unpin : T.pin}</button></article>`;
}
function render() {
  const playing = state && !['setup', 'opening'].includes(tab),
    label = tab === 'setup' ? preview.label : worldLabel(state.world),
    other = T.other,
    title = tab === 'setup' ? preview.title : c.title,
    cover = tab === 'setup' ? preview.rooms[0].image : c.scene.image;
  // The screen is a class of the page, so the phone layout can change per screen.
  app.className = 'screen-' + tab;
  applyLook(tab === 'setup' ? preview.look : c?.file.look);
  app.innerHTML = `<header><a class="brand" href="/" aria-label="${T.home}"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="13" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M20 20l8 8" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg><span>BLACKWOOD<br><small>${T.tagline}</small></span></a><button id="menu-toggle" class="small menu-toggle" aria-expanded="${menuOpen}" aria-controls="actions">${menuOpen ? T.close : T.menu}</button><div class="save ${menuOpen ? 'open' : ''}" id="actions"><button id="lang" class="small" lang="${other.lang}" title="${other.title}" ${busy ? 'disabled' : ''}>${other.label}</button>${state && tab !== 'setup' ? `<button class="small go-new" ${busy ? 'disabled' : ''}>${T.backHome}</button>` : ''}${state && !['setup', 'opening'].includes(tab) ? `<button class="small go-opening" ${busy ? 'disabled' : ''}>${T.rereadPrologue}</button>` : ''}${canSpeak ? `<button id="voice" class="small" aria-pressed="${speaking}">${T.readAloud(speaking)}</button>` : ''}<button id="sound" class="small" aria-pressed="${sounding}">${T.sound(sounding)}</button>${state ? `<button id="export" class="small" title="${T.exportTitle}">${T.exportSave}</button>` : ''}<label class="small file" title="${T.importTitle}">${T.importSave}<input id="import" type="file" accept="application/json" ${busy ? 'disabled' : ''}></label><a class="small" href="/editor.html">${T.editor}</a></div></header>${tab !== 'opening' ? `<section class="intro"><div><span class="eyebrow">${esc(label)}</span><h1>${esc(title)}</h1><p>${tab === 'setup' ? esc(preview.premise) : T.introPlaying}</p></div><div class="manor illustrated">${img(cover, title)}</div></section>` : ''}${playing ? `<section class="brief"><span class="seal">!</span><p><strong>${esc(T.briefDead(c.victim.name, placePhrase(c.scene)))}</strong> ${T.briefFound(clock(c.timing.discoveryMinute))}${nightNow() ? `<em class="night">${esc(nightNow())}</em>` : ''}</p><strong>${state.found.length}<small> / ${c.clues.length} ${T.clues}</small></strong></section>` : ''}${
    playing && !state.result
      ? `<nav aria-label="${T.investigation}">${Object.entries(T.tabs)
          .map(
            ([id, label]) =>
              `<button data-tab="${id}" class="${tab === id ? 'active' : ''}" ${tab === id ? 'aria-current="page"' : ''}>${tabIcons[id]}<span>${label}</span></button>`,
          )
          .join('')}</nav>`
      : ''
  }<main>${message ? `<div class="notice" role="status">${esc(message)}</div>` : ''}${playing && !state.result ? helpBar() : ''}${tab === 'setup' ? setup() : tab === 'opening' ? openingScreen() : state.result ? ending() : content()}</main><footer>BLACKWOOD · ${storageOK ? T.saved : T.notSaved}</footer>`;
  bind();
}
// The start screen: the game in progress, a new case in a world, or a classic case.
function setup() {
  const current = state
      ? `<section class="continue"><div><span class="eyebrow">${T.inProgress} · ${esc(worldLabel(state.world))}</span><h2>${esc(c.title)}</h2><p class="hint">${state.result === 'won' ? T.solved : T.foundOf(state.found.length, c.clues.length)}</p></div><button id="continue-case" ${busy ? 'disabled' : ''}>${T.continue}</button></section>`
      : '',
    first = text => text.match(/^[^.!?]+[.!?]/)?.[0] || text,
    card = (id, label, title, line, image) =>
      `<button class="world-card" data-world="${id}" ${busy ? 'disabled' : ''}><span class="world-art">${image ? img(image, '') : '<span class="world-dice">?</span>'}</span><span><strong>${esc(label)}</strong><em>${esc(title)}</em><small>${esc(line)}</small></span></button>`;
  return `${current}<section class="new-case"><span class="eyebrow">${T.newCase}</span><h2>${T.pickWorld}</h2><p class="hint">${T.newCaseHint}</p><div class="difficulty" role="radiogroup" aria-label="${T.difficulty}"><span>${T.difficulty}</span>${difficulties.map(d => `<button class="small ${difficulty === d.id ? 'selected' : ''}" role="radio" aria-checked="${difficulty === d.id}" data-difficulty="${d.id}">${T.difficulties[d.id]}</button>`).join('')}</div><p class="hint">${T.difficultyHints[difficulty]}</p><div class="world-cards">${worlds
    .map(w => {
      const world = cache.get(worldKey(w.id));
      return card(w.id, world.label, world.title, first(world.premise), world.rooms[0].image);
    })
    .join(
      '',
    )}${card('random', T.random, T.surprise, T.randomLine, null)}</div>${state ? `<p class="hint">${T.replaceHint}</p>` : ''}</section>${
    classics().length
      ? `<section class="classic-cases"><span class="eyebrow">${T.classicsEyebrow}</span><h2>${T.classicsTitle}</h2><p class="hint">${T.classicsHint}</p><ul>${classics().map(k => `<li><span><strong>${esc(k.title)}</strong>${k.hook ? `<small>${esc(k.hook)}</small>` : ''}</span><button class="small" data-classic="${esc(k.file)}" ${busy ? 'disabled' : ''}>${T.play}</button></li>`).join('')}</ul></section>`
      : ''
  }${
    history.length
      ? `<details class="history"><summary>${T.solvedCases(history.length)}</summary><ul>${history
          .slice(0, 12)
          .map(
            h =>
              `<li><strong>${esc(h.title)}</strong> · ${esc(h.world)}${h.difficulty ? ' · ' + esc(h.difficulty) : ''}<small>${esc(h.date)} · ${esc(h.culprit)}, ${esc(h.weapon.toLocaleLowerCase(lang))} · ${T.attempts(h.attempts)} · ${T.hintsUsed(h.hints)}</small></li>`,
          )
          .join('')}</ul></details>`
      : ''
  }`;
}
function openingScreen() {
  return `<section class="opening-panel"><span class="eyebrow">${T.prologue} · ${esc(c.title)}</span><h2>${T.beforeFirst}</h2>${img(c.scene.image, c.scene.name, 'scene-image')}<div class="opening-prose"><p>${esc(c.opening.arrival)}</p><p class="opening-fact">${esc(T.openingFact(clock(c.timing.discoveryMinute), c.victim.name, placePhrase(c.scene)))}</p><p>${esc(c.opening.tension)}</p></div>${speaking ? `<button id="listen-opening" class="secondary">${T.listenPrologue}</button> ` : ''}<button id="begin-investigation">${state.result ? T.backToEnding : T.begin}</button></section>`;
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
  return `<div class="help-bar"><button id="ask-hint" class="small">${hint && !hint.last ? T.moreHint : T.askHint}</button>${hint ? `<p role="status">${esc(hint.text)}</p>` : `<p>${T.stuck}</p>`}</div>`;
}
// The notebook: one row per person; each cell holds the clue that proves the condition.
function notebook() {
  const found = c.clues.filter(x => state.found.includes(x.id)),
    suspects = notebookSuspects(c, state),
    labels = T.conditions,
    cell = (p, condition) => {
      const entry = state.notebook[p.id]?.[condition];
      if (entry) {
        const clue = c.clues.find(x => x.id === entry.clue),
          mark =
            condition !== 'alibi'
              ? T.yes
              : entry.verdict === 'refuted'
                ? T.refuted
                : T.confirmed;
        return `<td data-label="${labels[condition]}" class="${entry.verdict === 'confirmed' ? 'clear' : 'proven'}"><strong>${mark}</strong><small>${esc(clue.title)}</small><button class="small" data-unnote="${p.id}:${condition}" aria-label="${T.deleteNote}">×</button></td>`;
      }
      return `<td data-label="${labels[condition]}"><select data-note="${p.id}:${condition}" aria-label="${esc(T.noteOf(labels[condition], p.name))}"><option value="">${T.noteEvidence}</option>${found.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select></td>`;
    };
  return `<section class="notebook"><h3>${T.notebook}</h3><p class="hint">${T.notebookHint}</p><div class="notebook-scroll"><table><thead><tr><th>${T.person}</th>${conditions.map(k => `<th>${labels[k]}</th>`).join('')}</tr></thead><tbody>${c.people.map(p => `<tr class="${suspects.includes(p.id) ? 'suspect' : ''}"><th>${esc(p.name)}<small>${suspects.includes(p.id) ? T.allThree : esc(p.role)}</small>${noteMessage?.person === p.id ? `<p class="note-message" role="status">${esc(noteMessage.text)}</p>` : ''}</th>${conditions.map(k => cell(p, k)).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
function ending() {
  return `<section class="ending"><span class="eyebrow">${state.result === 'won' ? T.caseSolved : T.needsReview}</span><h2>${state.result === 'won' ? T.truthOut : T.missingPieces}</h2>${state.result === 'won' && c.epilogue ? `<p class="epilogue">${esc(c.epilogue)}</p>` : ''}<p>${esc(prototypeResolution(c, state))}</p>${state.help.used ? `<p class="hint">${T.hintsAsked(state.help.used)}</p>` : ''}${state.result === 'lost' ? `<button id="reopen">${T.reopen}</button>` : ''}<button id="end-new" class="secondary">${T.another}</button></section>`;
}
function content() {
  if (tab === 'explore') {
    const room = c.rooms.find(r => r.id === state.room);
    return `<h2>${T.searchScenes}</h2><div class="exploration"><aside class="rooms">${c.rooms.map(r => `<button data-room="${r.id}" class="${r.id === room.id ? 'selected' : ''}"><strong>${esc(r.name)}</strong><small>${c.clues.filter(x => x.room === r.id && state.found.includes(x.id)).length}/${c.clues.filter(x => x.room === r.id).length}</small></button>`).join('')}</aside><section class="room-detail"><span class="eyebrow">${T.scene} / ${esc(room.name)}</span><h2>${esc(room.name)}</h2>${img(room.image, room.name, 'scene-image')}${room.ambience?.length ? `<p class="ambience">${esc(stable(room.ambience, c.id + room.id))}</p>` : ''}<p>${esc(room.description)}</p><div class="search-grid">${c.clues
      .filter(x => x.room === room.id)
      .map(
        x =>
          `<button data-search="${x.id}" ${state.found.includes(x.id) ? 'disabled' : ''}><strong>${esc(x.title)}</strong><small>${state.found.includes(x.id) ? T.inFile : T.inspect}</small></button>`,
      )
      .join('')}</div></section></div><div class="cards">${c.clues
      .filter(x => x.room === room.id && state.found.includes(x.id))
      .map(x => card(x))
      .join('')}</div>`;
  }
  if (tab === 'talk') {
    const actor = c.people.find(p => p.id === person),
      labels = T.prompts;
    return `<h2>${T.fiveVersions}</h2><div class="suspects">${c.people.map(p => `<button data-person="${p.id}" class="${p.id === person ? 'selected' : ''}" ${busy ? 'disabled' : ''}><span class="avatar">${img(p.image, '')}${esc(p.name.charAt(0))}</span><strong>${esc(p.name)}</strong><small>${esc(p.role)}</small></button>`).join('')}</div><section class="conversation"><div class="interview-portrait">${img(actor.image, actor.name)}<span>${esc(actor.name)}<small>${esc(actor.role)}</small></span></div><h3>${esc(actor.name)}</h3><p class="hint">${T.talkHint}</p><div class="messages" aria-live="polite">${
      state.chat
        .filter(m => m.person === person)
        .map(
          m =>
            `<div class="question">${esc(m.question)}</div><div class="reply">${esc(m.answer)}</div>`,
        )
        .join('') || `<p class="empty">${T.startWithAlibi}</p>`
    }</div><div class="prompts">${prototypeFacts(c, state, person)
      .map(
        f =>
          `<button class="small" data-prompt="${f.id}" ${busy ? 'disabled' : ''}>${labels[f.id]}</button>`,
      )
      .join('')}</div>${
      state.found.length
        ? `<form id="show" class="show-evidence"><select name="clue" aria-label="${T.evidenceToShow}" ${busy ? 'disabled' : ''}><option value="">${T.showEvidence}</option>${c.clues
            .filter(x => state.found.includes(x.id))
            .map(x => `<option value="${x.id}">${esc(x.title)}</option>`)
            .join(
              '',
            )}</select><button ${busy ? 'disabled' : ''}>${T.show}</button></form>`
        : ''
    }<form id="ask"><input name="question" aria-label="${T.yourQuestion}" maxlength="1000" placeholder="${uiText[c.lang].questionPlaceholder}" required ${busy ? 'disabled' : ''}><button ${busy ? 'disabled' : ''}>${busy ? T.listening : T.ask}</button></form></section>`;
  }
  if (tab === 'board')
    return `<h2>${T.boardTitle}</h2>${notebook()}<h3>${T.pinned}</h3><p class="hint">${T.pinnedHint}</p><div class="cards">${
      c.clues
        .filter(x => state.pinned.includes(x.id))
        .map(x => card(x))
        .join('') || `<p>${T.noPinned}</p>`
    }</div><label class="notes">${T.notes}<textarea id="notes" maxlength="10000">${esc(state.notes)}</textarea></label>`;
  if (tab === 'inventory')
    return `<h2>${T.inventoryTitle}</h2><div class="cards">${
      c.clues
        .filter(x => state.found.includes(x.id))
        .map(x => card(x))
        .join('') || `<p>${T.emptyInventory}</p>`
    }</div>`;
  // The scene is known from the start, so only the person and the weapon are named. The proof is
  // one clue per condition; what the notebook already proves for the chosen person comes filled in.
  const found = c.clues.filter(x => state.found.includes(x.id));
  return `<h2>${T.accuseTitle}</h2><p>${T.accuseHint}</p><form id="accuse"><div class="fields">${[
    ['person', T.culprit, c.people],
    ['method', T.weapon, c.weapons.map(w => ({ id: w.method, name: w.label }))],
  ]
    .map(
      ([id, label, list]) =>
        `<label>${label}<select name="${id}" aria-label="${label}" required><option value="">${T.select}</option>${list.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>`,
    )
    .join('')}</div><h3>${T.threeProofs}</h3><div class="fields proof-fields">${conditions
    .map(
      k =>
        `<label>${T.proofLabels[k]}<select name="evidence" data-condition="${k}" aria-label="${T.proofLabels[k]}" required><option value="">${T.chooseEvidence}</option>${found.map(x => `<option value="${x.id}">${T.number(state.found.indexOf(x.id) + 1)} · ${esc(x.title)}</option>`).join('')}</select></label>`,
    )
    .join(
      '',
    )}</div><button class="danger" ${busy ? 'disabled' : ''}>${T.present}</button></form>`;
}
// The classic cases of the language on screen.
function classics() {
  return classicLists[lang] || [];
}
function bind() {
  document.querySelector('#menu-toggle').onclick = () => {
    menuOpen = !menuOpen;
    render();
  };
  document.querySelector('#export')?.addEventListener('click', exportSave);
  document.querySelector('#lang')?.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    lang = T.other.lang;
    T = uiText[lang];
    remember('mundos-idioma', lang);
    showLanguage();
    message = '';
    try {
      await loadLanguage(lang);
      preview = cache.get(worldKey(setupWorld));
      await matchLanguage();
    } catch (e) {
      message = e.message;
    }
    busy = false;
    render();
  });
  document.querySelector('#sound').onclick = () => {
    sounding = !sounding;
    remember('mundos-sonido', sounding);
    setSound(sounding);
    render();
  };
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
          uiText[c.lang].openingSpoken(
            clock(c.timing.discoveryMinute),
            c.victim.name,
            placePhrase(c.scene),
          ),
          c.opening.tension,
        ].join(' '),
      ),
    );
  document.querySelector('#import').onchange = async e => {
    if (busy) return;
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1000000) throw Error(T.fileTooBig);
      const raw = JSON.parse(await file.text());
      // A case file starts a fresh investigation; a save continues where it was left.
      if (raw.format === CASE_FORMAT) state = newPrototype(null, { caseFile: raw });
      else if (raw.format === SAVE_FORMAT) state = restorePrototype(raw);
      else throw Error(T.notBlackwood);
      c = createPrototypeCase(state);
      person = c.people[0].id;
      hint = null;
      noteMessage = null;
      if (cache.has(worldKey(state.world))) {
        setupWorld = state.world;
        preview = cache.get(worldKey(setupWorld));
      }
      save();
      message = raw.format === CASE_FORMAT ? T.caseImported : T.saveImported;
      enterCase();
      return;
    } catch (e) {
      message = T.importFailed(e.message);
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
    !state || state.result || confirm(T.replaceConfirm);
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
      const world = cache.get(worldKey(selectWorld(setupWorld)));
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
      message = T.createFailed(e.message);
      render();
    }
  }
  document.querySelectorAll('[data-classic]').forEach(
    b =>
      (b.onclick = async () => {
        const file = b.dataset.classic;
        if (busy || !classics().some(k => k.file === file) || !replaceCurrent()) return;
        busy = true;
        try {
          const caseFile = await (await fetch('/cases/' + classicFile(file, lang))).json();
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
          message = T.classicFailed(e.message);
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
        if (state.room !== b.dataset.room) play('steps');
        state.room = b.dataset.room;
        save();
        render();
      }),
  );
  document.querySelectorAll('[data-search]').forEach(
    b =>
      (b.onclick = () => {
        inspectPrototype(c, state, b.dataset.search);
        play('paper');
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
    play('chime');
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
  // A prompt is asked in the language of the case, which the router of that language reads.
  document
    .querySelectorAll('[data-prompt]')
    .forEach(b => (b.onclick = () => ask(uiText[c.lang].questions[b.dataset.prompt])));
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
  document.querySelector('#accuse [name="person"]')?.addEventListener('change', e => {
    const notes = state.notebook?.[e.target.value];
    for (const select of e.target.form.querySelectorAll('[data-condition]'))
      select.value = notes?.[select.dataset.condition]?.clue || '';
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
          room: c.scene.id,
          evidence: f.getAll('evidence'),
        }) === 'won'
      )
        record(), play('bell');
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
    result = answerOffline(c, state, target, question, { questionRouter: routers[c.lang] });
  } catch (e) {
    message = e.message;
    render();
    return;
  }
  // The local model of the server speaks Spanish only.
  if (result.unplaced && serverModel && c.lang === 'es') {
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
