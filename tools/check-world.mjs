// Checks a world file and prints its texts inside the sentences of the game.
//   node tools/check-world.mjs public/worlds/<id>.json [--voices]
import { readFileSync } from 'node:fs';
import { normalizeWorld } from '../src/world-file.mjs';
import { statementKinds, fillStatement } from '../src/statements.mjs';
import { contract } from '../src/spanish-prose.mjs';

const [file, flag] = process.argv.slice(2);
let w;
try {
  w = normalizeWorld(JSON.parse(readFileSync(file, 'utf8')));
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
}
const cap = s => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);
const low = s => s.charAt(0).toLocaleLowerCase('es') + s.slice(1);
const fix = contract;
const place = r => r.article + ' ' + low(r.name);
const [a, b, c] = w.people.map(p => p.name);
const v = w.victim.name;
const scene = w.rooms[0],
  room = w.rooms[1];
const out = s => console.log('  ' + fix(s));

console.log(`${w.title} (${w.label}) · víctima: ${v}, ${w.victim.role}`);
console.log('\nREPARTO');
for (const p of w.people) console.log(`  ${p.id} ${p.name} — ${p.role}`);
console.log('\nLUGARES');
for (const r of w.rooms)
  console.log(`  ${r.id} ${place(r)} [${r.tags.join(', ')}]: ${r.description}`);
console.log('\nPERSONAL');
out(`Según ${w.staff.guardian}, solo ${a}, ${b} y ${c} tenían acceso a la llave.`);
out(
  `${cap(w.staff.guardian)} vigiló la puerta de ${place(room)} de 21:10 a 21:45: dentro estaban ${a} y ${b}, y nadie más entró ni salió.`,
);
out(
  `${cap(w.staff.record)} de ${place(room)} anota la entrada de ${a} a las 21:10 y su salida a las 21:43.`,
);
out(`[${w.staff.report}]`);
console.log('\nARMAS');
for (const x of w.weapons) {
  console.log(` ${x.method} · ${x.label}`);
  out(`[${w.staff.report}] ${x.cause} Sitúa la muerte hacia las 21:40.`);
  out(
    x.device
      ? `Alguien manipuló a mano ${x.weapon} en ${place(scene)}. No queda ninguna marca que diga quién.`
      : `Junto al cuerpo apareció ${x.weapon}. No estaba en el lugar donde se guarda habitualmente.`,
  );
  out(`Según ${w.staff.guardian}, solo ${a}, ${b} y ${c} tenían acceso a ${x.access}.`);
  out(
    `Anotación de ${w.staff.guardian}: solo ${a}, ${b} y ${c} tenían permiso para usar ${x.access}.`,
  );
  out(
    x.device
      ? `${cap(w.staff.guardian)} revisó ${x.weapon} a las 21:00 y todo estaba en orden.`
      : `${cap(w.staff.guardian)} recuerda haber visto ${x.seen || x.weapon} en su sitio a las 21:00.`,
  );
  out(`${a} mató a ${v} en ${place(scene)} a las 21:30, ${x.phrase}.`);
}
console.log('\nOBJETOS PERDIDOS');
for (const it of w.items) {
  out(
    `Junto a la puerta de ${place(scene)} apareció ${it.gender === 'f' ? 'una' : 'un'} ${it.noun} que pertenece a ${a}.`,
  );
}
console.log('\nMÓVILES');
for (const m of w.motives)
  out(`Carta sin enviar de ${v}: escribe que ${a} ${low(m.replace(/\{victim\}/g, v))}`);
console.log('\nDOCUMENTOS');
const doc = (d, kind) =>
  out(
    `(${kind}) ${d.title.replace(/\{victim\}/g, v).replace(/\{person\}/g, a)} :: ${d.text.replace(/\{victim\}/g, v).replace(/\{person\}/g, a)}`,
  );
w.documents.weak.forEach(d => doc(d, 'débil'));
w.documents.neutral.forEach(d => doc(d, 'neutro'));
console.log('\nPRÓLOGOS');
w.openings.arrivals.forEach(t => out('· ' + t));
w.openings.tensions.forEach(t => out('» ' + t));
const kinds = Object.keys(statementKinds);
console.log('\nVOCES');
for (const p of w.people) {
  const missing = kinds.filter(k => !p.voice?.[k]);
  console.log(
    `  ${p.name}: ${kinds.length - missing.length}/${kinds.length} tipos${missing.length ? ' (faltan: ' + missing.join(', ') + ')' : ''}`,
  );
  if (flag !== '--voices') continue;
  const item = w.items[0];
  const values = {
    victim: v,
    name: p.name,
    role: p.role,
    place: place(room),
    scene: place(scene),
    partner: b,
    from: '21:10',
    to: '21:45',
    time: '21:52',
    access: w.weapons[0].access,
    record: w.staff.record,
    guardian: w.staff.guardian,
    item: (item.gender === 'f' ? 'la ' : 'el ') + item.noun,
    mine: item.gender === 'f' ? 'mía' : 'mío',
    it: item.gender === 'f' ? 'la' : 'lo',
  };
  for (const k of kinds)
    for (const line of p.voice?.[k] || []) out(`   ${k}: ${fillStatement(line, values)}`);
}
console.log('\nOK');
