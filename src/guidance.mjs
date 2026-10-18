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

// Whether a found clue proves a condition for a person, and with what result.
export function checkEntry(c, state, person, condition, clueId) {
  const clue = clueOf(c, clueId),
    name = nameOf(c, person);
  if (!c.people.some(p => p.id === person) || !conditions.includes(condition))
    return { ok: false, message: 'Anotación no válida.' };
  if (!clue || !state.found.includes(clueId))
    return { ok: false, message: 'Solo puedes anotar pruebas que hayas encontrado.' };
  const fact = clue.fact,
    title = '«' + clue.title + '»';
  if (condition === 'motive')
    return fact.type === 'motive' && fact.person === person
      ? { ok: true, message: `${title} muestra un motivo de ${name}.` }
      : { ok: false, message: `${title} no muestra ningún motivo de ${name}.` };
  if (condition === 'access')
    return fact.type === 'access' && fact.people.includes(person)
      ? { ok: true, message: `${title} demuestra que ${name} podía llegar al arma.` }
      : { ok: false, message: `${title} no demuestra que ${name} pudiera llegar al arma.` };
  if (c.analysis.refutedBy[person]?.includes(clueId))
    return {
      ok: true,
      verdict: 'refuted',
      message: `${title} desmiente la coartada de ${name}.`,
    };
  if (c.analysis.confirmedBy[person]?.includes(clueId))
    return {
      ok: true,
      verdict: 'confirmed',
      message: `${title} confirma la coartada de ${name}.`,
    };
  return {
    ok: false,
    message: `${title} no confirma ni desmiente la coartada de ${name}. Compárala con lo que dice sobre dónde estaba.`,
  };
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
  const seen = ids => ids.some(id => state.found.includes(id)),
    first = ids => clueOf(c, ids[0]),
    cause = c.clues.filter(x => ['cause', 'weapon'].includes(x.fact.type)).map(x => x.id);
  if (!seen(cause)) {
    const clue = first(cause);
    return {
      stage: 'cause',
      hints: [
        `Empieza por la escena del crimen, ${placePhrase(c.scene)}: ahí se ve cómo murió ${c.victim.name}.`,
        `Inspecciona «${clue.title}», en ${where(c, clue)}.`,
      ],
    };
  }
  const [motive, access, alibi] = c.proof;
  if (!seen(motive)) {
    const clue = first(motive);
    return {
      stage: 'motive',
      hints: [
        `Busca quién tenía motivos: cartas, notas y papeles. Varias personas tenían roces con ${c.victim.name}, pero solo alguien tenía algo grave que perder.`,
        `Registra ${where(c, clue)}.`,
        `Lee «${clue.title}», en ${where(c, clue)}.`,
      ],
    };
  }
  if (!seen(access)) {
    const clue = first(access);
    return {
      stage: 'access',
      hints: [
        `Averigua quién podía llegar a ${c.method.weapon}: no todo el mundo tenía acceso.`,
        `Registra ${where(c, clue)}.`,
        `Lee «${clue.title}», en ${where(c, clue)}.`,
      ],
    };
  }
  if (!seen(alibi)) {
    const clue = first(alibi);
    return {
      stage: 'alibi',
      hints: [
        'Pregunta a cada persona dónde estaba durante el crimen y busca registros o testigos que lo confirmen o lo desmientan.',
        `Registra ${where(c, clue)}.`,
        `Lee «${clue.title}», en ${where(c, clue)}, y compárala con la coartada de cada uno.`,
      ],
    };
  }
  if (notebookSuspects(c, state).length !== 1) {
    const clue = first(alibi);
    return {
      stage: 'notebook',
      hints: [
        'Ya tienes las pruebas necesarias. Anota en el cuaderno quién tenía motivo, quién podía llegar al arma y qué coartadas se sostienen.',
        'Solo una persona tiene a la vez motivo, acceso al arma y una coartada desmentida. Las demás fallan en al menos una de las tres.',
        `Fíjate en «${clue.title}»: desmiente la coartada de alguien.`,
      ],
    };
  }
  return {
    stage: 'accuse',
    hints: [
      'Tu cuaderno señala a una sola persona. Ve a Acusar y adjunta una prueba de cada condición.',
    ],
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
