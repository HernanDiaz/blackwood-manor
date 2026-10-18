import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  newPrototype,
  createPrototypeCase,
  prototypeMethods,
  inspectPrototype,
  accusePrototype,
  restorePrototype,
} from '../src/prototype-engine.mjs';
import { validateCustomWorld } from '../src/custom-world.mjs';
import { auditPrototype } from '../src/contextual-evidence.mjs';
import { analyzeCase } from '../src/case-file.mjs';
import { createLegacyCase } from '../src/legacy-prototype-case.mjs';
import { imagePlan } from '../src/session-images.mjs';
function customWorld(setting) {
  const file = setting === 'scifi' ? 'world.json' : 'worlds/' + setting + '.json',
    d = JSON.parse(readFileSync('public/prototype/' + file));
  Object.assign(d, {
    custom: true,
    revision: 'custom-v2',
    setting,
    description: 'Un recinto cerrado para pruebas',
    visualStyle: 'oil painting',
    rules: {
      technology:
        setting === 'scifi' ? 'futuristic' : setting === 'noir' ? 'industrial' : 'preindustrial',
      magic: setting === 'fantasy',
      firearms: setting === 'noir',
      resource: setting === 'scifi' ? 'mineral' : 'grano',
    },
  });
  d.world.people.forEach(p => {
    p.imagePrompt = 'portrait of one adult person';
    p.personality = 'Reservada';
  });
  d.world.rooms.forEach(r => {
    r.imagePrompt = 'interior of an enclosed room';
    r.description = 'Un interior cerrado con una sola entrada.';
  });
  d.motives = JSON.parse(readFileSync('public/prototype/worlds/medieval.json')).motives;
  return validateCustomWorld(d);
}
for (const setting of ['medieval', 'fantasy', 'noir', 'scifi'])
  test('deducible cases with era-specific sources: ' + setting, () => {
    const data = customWorld(setting);
    for (const method of prototypeMethods(data))
      for (let i = 0; i < 10; i++) {
        const s = newPrototype(data, { seed: 'proof-' + i, forcedMethodId: method.id }),
          c = createPrototypeCase(data, s),
          analysis = analyzeCase(c.file);
        assert.deepEqual(analysis.errors, []);
        assert.deepEqual(analysis.suspects, [c.culprit.id]);
        assert.equal(analysis.motive.length, 3);
        assert.equal(analysis.access.length, 3);
        assert.equal(analysis.opportunity.length, 2);
        assert.equal(analysis.herrings, 1);
        const texts = c.clues.map(x => x.text).join(' ');
        assert.ok(!/identifica a|culpable|asesin/i.test(texts));
        if (['medieval', 'fantasy'].includes(setting)) {
          assert.ok(!/digital|cámaras|laboratorio|ordenador/i.test(texts));
          assert.ok(
            !prototypeMethods(data).some(m =>
              ['revolver', 'laser', 'medical', 'plasma'].includes(m.id),
            ),
          );
        }
        const plan = imagePlan(data, c),
          testimony = c.clues.find(x => x.fact.type === 'presence' && x.fact.people.length === 2);
        assert.ok(
          plan
            .find(x => x.id === 'clue-' + testimony.id)
            .prompt.includes(
              setting === 'scifi' ? 'station terminal' : setting === 'noir' ? '1930s' : 'parchment',
            ),
        );
        for (const clue of c.clues) {
          s.room = clue.room;
          inspectPrototype(c, s, clue.id);
        }
        assert.equal(
          accusePrototype(c, structuredClone(s), {
            person: c.culprit.id,
            method: c.method.id,
            room: c.scene.id,
            evidence: c.proof.map(group => group[0]),
          }),
          'won',
        );
        const suspect = analysis.motive.find(p => p !== c.culprit.id);
        assert.equal(
          accusePrototype(c, structuredClone(s), {
            person: suspect,
            method: c.method.id,
            room: c.scene.id,
            evidence: s.found,
          }),
          'lost',
        );
        assert.equal(restorePrototype(data, s).caseId, c.id);
      }
  });
test('legacy custom saves keep their case, progress and verdict after conversion', () => {
  const data = customWorld('medieval');
  for (const method of prototypeMethods(data)) {
    const old = createLegacyCase(data, { seed: 'old-save', forcedMethodId: method.id });
    assert.equal(auditPrototype(old).uniqueSolution, true);
    const save = {
      version: 1,
      worldId: 'custom',
      customWorld: data,
      revision: data.revision,
      seed: 'old-save',
      previousMethodId: '',
      previousPersonId: '',
      forcedMethodId: method.id,
      caseId: old.id,
      openingSeen: true,
      imageSet: old.id,
      room: old.scene.id,
      found: old.clues.map(x => x.id),
      pinned: ['c1'],
      notes: 'Mis notas',
      chat: [{ person: 'p1', question: 'q', answer: 'a' }],
      result: null,
    };
    const state = restorePrototype(data, save),
      c = createPrototypeCase(null, state);
    assert.equal(state.version, 2);
    assert.equal(c.legacyId, old.id);
    assert.equal(state.imageSet, old.id);
    assert.deepEqual(state.found, save.found);
    assert.equal(state.notes, 'Mis notas');
    assert.equal(c.culprit.id, old.culprit.id);
    assert.equal(
      accusePrototype(c, state, {
        person: old.culprit.id,
        method: old.method.id,
        room: old.scene.id,
        evidence: old.clues.filter(x => x.person === old.culprit.id).map(x => x.id),
      }),
      'won',
    );
    const corrupted = structuredClone(old);
    const innocent = old.people.find(p => p.id !== old.culprit.id);
    corrupted.clues.filter(x => x.person === innocent.id).forEach(x => (x.effect = 'supports'));
    assert.throws(() => auditPrototype(corrupted));
  }
});
