import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { worlds, worldFile, selectWorld } from '../src/prototype-worlds.mjs';
import { normalizeWorld, worldWeapons } from '../src/world-file.mjs';
import { statementKinds } from '../src/statements.mjs';
import {
  newPrototype,
  restorePrototype,
  createPrototypeCase,
  inspectPrototype,
  accusePrototype,
} from '../src/prototype-engine.mjs';
import { loadWorld } from './worlds-fixture.mjs';
const raw = id => JSON.parse(readFileSync(`public/worlds/${id}.json`, 'utf8'));

for (const { id } of worlds)
  test('every weapon of ' + id + ' gives a case that can be completed and restored', () => {
    const world = loadWorld(id);
    assert.equal(world.id, id);
    for (const weapon of worldWeapons(world))
      for (const seed of ['a', 'b', 'c']) {
        const s = newPrototype(world, { seed, forcedMethodId: weapon.method }),
          c = createPrototypeCase(s);
        for (const clue of c.clues) {
          s.room = clue.room;
          inspectPrototype(c, s, clue.id);
        }
        assert.equal(
          accusePrototype(c, s, {
            person: c.culprit.id,
            method: weapon.method,
            room: c.scene.id,
            evidence: s.found,
          }),
          'won',
        );
        const restored = restorePrototype(JSON.stringify(s));
        assert.equal(restored.world, id);
        assert.equal(restored.caseId, c.id);
        assert.equal(restored.result, 'won');
      }
  });

test('the worlds are complete: every voice and an illustration for everything', () => {
  for (const world of worlds.map(w => loadWorld(w.id))) {
    for (const p of world.people)
      for (const kind of Object.keys(statementKinds))
        assert.ok(p.voice?.[kind]?.length, `${world.id} ${p.name} ${kind}`);
    const art = [
      ...world.people,
      ...world.rooms,
      ...world.weapons,
      ...world.items,
      ...Object.values(world.clueArt),
    ];
    for (const a of art) {
      assert.ok(a.image?.startsWith(`/worlds/${world.id}/`), `${world.id} ${a.image}`);
      assert.ok(a.imagePrompt, `${world.id} ${a.image}`);
    }
    // Whoever keeps watch is not one of the suspects.
    assert.ok(!world.people.some(p => world.staff.guardian.endsWith(p.role)), world.id);
  }
});

test('every world sets its atmosphere and a case carries it', () => {
  for (const { id } of worlds) {
    const world = loadWorld(id);
    assert.ok(world.look && world.night?.length && world.epilogues?.length, id);
    assert.ok(
      world.rooms.every(r => r.ambience?.length),
      id,
    );
    const c = createPrototypeCase(newPrototype(world, { seed: 'atmo' }));
    assert.deepEqual(c.file.look, world.look);
    assert.ok(c.file.night.length && c.rooms.every(r => r.ambience?.length));
    assert.ok(c.epilogue.includes(c.culprit.name), id);
    assert.ok(!/\{(culprit|scene|victim|p\d|r\d)\}/.test(c.epilogue), id);
  }
});

test('world files are validated before use', () => {
  const base = raw('torre-umbria');
  assert.throws(() => normalizeWorld({ ...base, format: 'otro' }), /compatible/);
  const anachronism = structuredClone(base);
  anachronism.weapons[0].method = 'phaser';
  assert.throws(() => normalizeWorld(anachronism), /Método desconocido/);
  const flat = structuredClone(base);
  for (const r of flat.rooms) r.tags = [];
  assert.throws(() => normalizeWorld(flat), /Ningún lugar permite/);
  const badVoice = structuredClone(base);
  badVoice.people[0].voice['alibi.claim'] = ['Estuve allí toda la noche.'];
  assert.throws(() => normalizeWorld(badVoice), /falta el marcador/);
  const handTime = structuredClone(base);
  handTime.motives[0] = 'Había robado a las doce y 5 minutos. {victim} lo sabía.';
  assert.throws(() => normalizeWorld(handTime), /horas ni cifras/);
  const unknownMark = structuredClone(base);
  unknownMark.documents.weak[0].text = 'Nota de {victim} para {culprit}.';
  assert.throws(() => normalizeWorld(unknownMark), /marcador desconocido/);
  const badLook = structuredClone(base);
  badLook.look.effect = 'fireworks';
  assert.throws(() => normalizeWorld(badLook), /Efecto de fondo desconocido/);
  const gendered = structuredClone(base);
  gendered.epilogues[0] = '{culprit} sale con {detective}.';
  assert.throws(() => normalizeWorld(gendered), /marcador desconocido/);
});

test('random world is resolved once; unknown world paths rejected', () => {
  assert.equal(
    selectWorld('random', () => 0),
    worlds[0].id,
  );
  assert.equal(
    selectWorld('random', () => 0.99),
    worlds.at(-1).id,
  );
  assert.throws(() => worldFile('../world'));
  assert.equal(worldFile('torre-umbria'), 'worlds/torre-umbria.json');
});
