// Help for the player, worked out from the facts of the case (see case-file.mjs), so it works
// with any case, generated or written by hand.
//
// The notebook: for each person, the player attaches a clue they have found as proof of a
// motive, of access to the weapon, or of what happened to their alibi. Only correct entries
// are kept, so the notebook never misleads; a wrong one is answered with why it does not fit.
//
// Hints: one stage at a time (how they died, who had a motive, who could reach the weapon,
// whose alibi fails, the notebook, the accusation). Asking again in the same stage gives a more
// concrete hint; the last one names the clue to read.
import { placePhrase } from './spanish-prose.mjs';

export const conditions = ['motive', 'access', 'alibi'];
const nameOf = (c, id) => c.people.find(p => p.id === id)?.name || id;
const clueOf = (c, id) => c.clues.find(x => x.id === id);
const where = (c, clue) => placePhrase(c.rooms.find(r => r.id === clue.room));

// What the notebook and the hints say, in each language; the case decides which.
const words = {
  es: {
    invalid: 'Anotación no válida.',
    onlyFound: 'Solo puedes anotar pruebas que hayas encontrado.',
    quote: title => '«' + title + '»',
    motiveYes: (t, n) => `${t} muestra un motivo de ${n}.`,
    motiveNo: (t, n) => `${t} no muestra ningún motivo de ${n}.`,
    accessYes: (t, n) => `${t} demuestra que ${n} podía llegar al arma.`,
    accessNo: (t, n) => `${t} no demuestra que ${n} pudiera llegar al arma.`,
    refuted: (t, n) => `${t} desmiente la coartada de ${n}.`,
    confirmed: (t, n) => `${t} confirma la coartada de ${n}.`,
    neither: (t, n) =>
      `${t} no confirma ni desmiente la coartada de ${n}. Compárala con lo que dice sobre dónde estaba.`,
    cause: (scene, victim) =>
      `Empieza por la escena del crimen, ${scene}: ahí se ve cómo murió ${victim}.`,
    inspect: (title, where) => `Inspecciona «${title}», en ${where}.`,
    motive: victim =>
      `Busca quién tenía motivos: cartas, notas y papeles. Varias personas tenían roces con ${victim}, pero solo alguien tenía algo grave que perder.`,
    search: where => `Registra ${where}.`,
    read: (title, where) => `Lee «${title}», en ${where}.`,
    access: weapon => `Averigua quién podía llegar a ${weapon}: no todo el mundo tenía acceso.`,
    alibi:
      'Pregunta a cada persona dónde estaba durante el crimen y busca registros o testigos que lo confirmen o lo desmientan.',
    compare: (title, where) =>
      `Lee «${title}», en ${where}, y compárala con la coartada de cada uno.`,
    notebook:
      'Ya tienes las pruebas necesarias. Anota en el cuaderno quién tenía motivo, quién podía llegar al arma y qué coartadas se sostienen.',
    onlyOne:
      'Solo una persona tiene a la vez motivo, acceso al arma y una coartada desmentida. Las demás fallan en al menos una de las tres.',
    look: title => `Fíjate en «${title}»: desmiente la coartada de alguien.`,
    accuse:
      'Tu cuaderno señala a una sola persona. Ve a Acusar y adjunta una prueba de cada condición.',
  },
  en: {
    invalid: 'That entry is not valid.',
    onlyFound: 'You can only note evidence you have found.',
    quote: title => '“' + title + '”',
    motiveYes: (t, n) => `${t} shows a motive for ${n}.`,
    motiveNo: (t, n) => `${t} shows no motive for ${n}.`,
    accessYes: (t, n) => `${t} proves that ${n} could reach the weapon.`,
    accessNo: (t, n) => `${t} does not prove that ${n} could reach the weapon.`,
    refuted: (t, n) => `${t} breaks the alibi of ${n}.`,
    confirmed: (t, n) => `${t} confirms the alibi of ${n}.`,
    neither: (t, n) =>
      `${t} neither confirms nor breaks the alibi of ${n}. Compare it with what they say about where they were.`,
    cause: (scene, victim) =>
      `Start at the scene of the crime, ${scene}: that is where you can see how ${victim} died.`,
    inspect: (title, where) => `Inspect “${title}”, in ${where}.`,
    motive: victim =>
      `Find out who had a motive: letters, notes and papers. Several people had their quarrels with ${victim}, but only one had something serious to lose.`,
    search: where => `Search ${where}.`,
    read: (title, where) => `Read “${title}”, in ${where}.`,
    access: weapon => `Find out who could reach ${weapon}: not everyone had access.`,
    alibi:
      'Ask each person where they were during the crime, and look for registers or witnesses that confirm or break their word.',
    compare: (title, where) => `Read “${title}”, in ${where}, and compare it with each alibi.`,
    notebook:
      'You have the evidence you need. Note in the notebook who had a motive, who could reach the weapon and which alibis hold.',
    onlyOne:
      'Only one person has a motive, access to the weapon and a broken alibi all at once. Everyone else fails on at least one of the three.',
    look: title => `Look closely at “${title}”: it breaks somebody's alibi.`,
    accuse:
      'Your notebook points to a single person. Go to Accuse and attach one piece of evidence for each condition.',
  },
};
const say = c => words[c.lang] || words.es;

// Whether a found clue proves a condition for a person, and with what result.
export function checkEntry(c, state, person, condition, clueId) {
  const clue = clueOf(c, clueId),
    name = nameOf(c, person),
    w = say(c);
  if (!c.people.some(p => p.id === person) || !conditions.includes(condition))
    return { ok: false, message: w.invalid };
  if (!clue || !state.found.includes(clueId)) return { ok: false, message: w.onlyFound };
  const fact = clue.fact,
    title = w.quote(clue.title);
  if (condition === 'motive')
    return fact.type === 'motive' && fact.person === person
      ? { ok: true, message: w.motiveYes(title, name) }
      : { ok: false, message: w.motiveNo(title, name) };
  if (condition === 'access')
    return fact.type === 'access' && fact.people.includes(person)
      ? { ok: true, message: w.accessYes(title, name) }
      : { ok: false, message: w.accessNo(title, name) };
  if (c.analysis.refutedBy[person]?.includes(clueId))
    return { ok: true, verdict: 'refuted', message: w.refuted(title, name) };
  if (c.analysis.confirmedBy[person]?.includes(clueId))
    return { ok: true, verdict: 'confirmed', message: w.confirmed(title, name) };
  return { ok: false, message: w.neither(title, name) };
}
export function noteEntry(c, state, person, condition, clueId) {
  const result = checkEntry(c, state, person, condition, clueId);
  if (result.ok) {
    state.notebook[person] ??= {};
    state.notebook[person][condition] = {
      clue: clueId,
      ...(result.verdict ? { verdict: result.verdict } : {}),
    };
  }
  return result;
}
export function clearEntry(state, person, condition) {
  if (state.notebook[person]) delete state.notebook[person][condition];
}
// People whose row shows a motive, access and a refuted alibi.
export function notebookSuspects(c, state) {
  return c.people
    .map(p => p.id)
    .filter(id => {
      const row = state.notebook[id] || {};
      return row.motive && row.access && row.alibi?.verdict === 'refuted';
    });
}
// A saved notebook keeps only the entries that are still correct.
export function restoreGuidance(c, saved) {
  const notebook = {};
  for (const p of c.people)
    for (const condition of conditions) {
      const entry = saved.notebook?.[p.id]?.[condition];
      if (typeof entry?.clue === 'string' && checkEntry(c, saved, p.id, condition, entry.clue).ok)
        noteEntry(c, { ...saved, notebook }, p.id, condition, entry.clue);
    }
  const help = saved.help || {};
  return {
    notebook,
    help: {
      stage: typeof help.stage === 'string' ? help.stage.slice(0, 20) : '',
      level: Number.isInteger(help.level) ? Math.max(0, Math.min(help.level, 3)) : 0,
      used: Number.isInteger(help.used) ? Math.max(0, Math.min(help.used, 999)) : 0,
    },
  };
}
export const emptyGuidance = () => ({ notebook: {}, help: { stage: '', level: 0, used: 0 } });

// The hints of the stage the player is in, from vague to concrete.
function stageOf(c, state) {
  const w = say(c),
    seen = ids => ids.some(id => state.found.includes(id)),
    first = ids => clueOf(c, ids[0]),
    cause = c.clues.filter(x => ['cause', 'weapon'].includes(x.fact.type)).map(x => x.id);
  if (!seen(cause)) {
    const clue = first(cause);
    return {
      stage: 'cause',
      hints: [w.cause(placePhrase(c.scene), c.victim.name), w.inspect(clue.title, where(c, clue))],
    };
  }
  const [motive, access, alibi] = c.proof;
  if (!seen(motive)) {
    const clue = first(motive);
    return {
      stage: 'motive',
      hints: [
        w.motive(c.victim.name),
        w.search(where(c, clue)),
        w.read(clue.title, where(c, clue)),
      ],
    };
  }
  if (!seen(access)) {
    const clue = first(access);
    return {
      stage: 'access',
      hints: [
        w.access(c.method.weapon),
        w.search(where(c, clue)),
        w.read(clue.title, where(c, clue)),
      ],
    };
  }
  if (!seen(alibi)) {
    const clue = first(alibi);
    return {
      stage: 'alibi',
      hints: [w.alibi, w.search(where(c, clue)), w.compare(clue.title, where(c, clue))],
    };
  }
  if (notebookSuspects(c, state).length !== 1) {
    const clue = first(alibi);
    return {
      stage: 'notebook',
      hints: [w.notebook, w.onlyOne, w.look(clue.title)],
    };
  }
  return {
    stage: 'accuse',
    hints: [w.accuse],
  };
}
// The next hint: the first of a new stage, or a more concrete one in the same stage.
export function nextHint(c, state) {
  const { stage, hints } = stageOf(c, state),
    help = state.help,
    level = help.stage === stage ? Math.min(help.level + 1, hints.length) : 1;
  state.help = { stage, level, used: help.used + 1 };
  return { text: hints[level - 1], level, last: level === hints.length };
}
