import { checkRoomMeaning } from '../src/prose-policy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateCustomWorld,
  generateCustomWorld,
  resolvePrototypeWorld,
} from '../src/custom-world.mjs';
import {
  newPrototype,
  createPrototypeCase,
  restorePrototype,
  accusePrototype,
  inspectPrototype,
  prototypeMethods,
} from '../src/prototype-engine.mjs';
import { imagePlan } from '../src/session-images.mjs';
const base = JSON.parse(readFileSync('public/prototype/worlds/medieval.json'));
const raw = {
  ...base,
  custom: true,
  revision: 'custom-v1',
  description: 'Un castillo medieval sobre un volcán',
  visualStyle: 'medieval volcanic castle oil painting',
};
raw.world.people.forEach(
  (p, i) => (p.imagePrompt = 'portrait of adult medieval investigator ' + i),
);
raw.world.rooms.forEach((r, i) => (r.imagePrompt = 'volcanic medieval castle room ' + i));
const data = validateCustomWorld(raw);
test('custom snapshot roundtrip, complete solutions and themed image plans', async () => {
  for (const method of prototypeMethods(data)) {
    const state = newPrototype(data, { seed: 'custom-test', forcedMethodId: method.id }),
      c = createPrototypeCase(data, state);
    assert.equal(state.worldId, 'custom');
    const loaded = await resolvePrototypeWorld(process.cwd(), JSON.parse(JSON.stringify(state)));
    assert.deepEqual(loaded, data);
    assert.equal(createPrototypeCase(loaded, state).id, c.id);
    for (const clue of c.clues) {
      state.room = clue.room;
      inspectPrototype(c, state, clue.id);
    }
    accusePrototype(c, state, {
      person: c.culprit.id,
      method: c.method.id,
      room: c.scene.id,
      evidence: state.found,
    });
    assert.equal(state.result, 'won');
    assert.equal(restorePrototype(loaded, state).result, 'won');
    const plan = imagePlan(data, c);
    assert.ok(plan.find(j => j.id === 'room-r1').prompt.includes('volcanic medieval castle'));
    assert.ok(plan.find(j => j.id === 'person-p1').prompt.includes('adult medieval investigator'));
  }
});
test('invalid dimensions, duplicate names, unsafe text and changed snapshots rejected', () => {
  const bad = structuredClone(raw);
  bad.world.people[0].name = bad.victim.name;
  assert.throws(() => validateCustomWorld(bad));
  assert.throws(() => validateCustomWorld({ ...raw, description: '<script>' }));
  assert.throws(() => validateCustomWorld({ ...raw, world: { ...raw.world, rooms: [] } }));
  const state = newPrototype(data, { seed: 'custom-test' });
  const changed = structuredClone(data);
  changed.world.rooms[0].name += ' X';
  assert.throws(() => restorePrototype(changed, state));
});

function responses() {
  return [
    {
      title: data.world.title,
      technology: 'preindustrial',
      magic: false,
      firearms: false,
      resource: 'grano',
    },
    ...data.world.people.map(p => ({
      ...p,
      imagePrompt: 'portrait of one adult person in medieval clothes',
    })),
    {
      name: data.victim.name,
      role: data.victim.role,
      personality: 'Reservada',
      imagePrompt: 'portrait of one adult person',
    },
    ...data.world.rooms.map(r => ({
      ...r,
      imagePrompt: 'interior of a medieval room with candles',
    })),
  ];
}
test('thirteen small steps retain Spanish display and English instructions', async () => {
  const values = responses();
  let calls = 0;
  const result = await generateCustomWorld(raw.description, {
    request: async messages => {
      calls++;
      assert.ok(messages[0].content.includes('Display fields MUST be natural Spanish'));
      return values.shift();
    },
  });
  assert.equal(calls, 13);
  assert.equal(result.revision, 'custom-v2');
  assert.equal(result.world.people.length, 5);
  assert.equal(result.rules.technology, 'preindustrial');
});
test('retry affects only the failing character', async () => {
  const values = responses();
  let count = 0;
  const result = await generateCustomWorld(raw.description, {
    request: async () => {
      count++;
      if (count === 3) return { ...values[0], name: data.world.people[0].name };
      return values.shift();
    },
  });
  assert.equal(count, 14);
  assert.equal(result.world.people.length, 5);
});
test('model failure is bounded', async () => {
  let count = 0;
  await assert.rejects(
    generateCustomWorld('Marte', {
      maxAttempts: 3,
      request: async () => {
        count++;
        throw Error('offline');
      },
    }),
  );
  assert.equal(count, 3);
});
test('checkpoint resumes completed steps and never calls the model again for them', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises'),
    { tmpdir } = await import('node:os'),
    path = await import('node:path');
  const folder = await mkdtemp(path.join(tmpdir(), 'blackwood-draft-'));
  try {
    const values = responses();
    let calls = 0;
    await assert.rejects(
      generateCustomWorld(raw.description, {
        checkpointDir: folder,
        request: async () => {
          calls++;
          if (calls >= 4) throw Error('interrupted');
          return values.shift();
        },
      }),
    );
    const resumed = await generateCustomWorld(raw.description, {
      checkpointDir: folder,
      request: async () => values.shift(),
    });
    assert.equal(resumed.world.rooms.length, 6);
    await generateCustomWorld(raw.description, {
      checkpointDir: folder,
      request: async () => {
        throw Error('should not regenerate');
      },
    });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test('attempt cap persists counters and resuming uses new seeds without repeating valid cards', async () => {
  const { mkdtemp, rm, readFile } = await import('node:fs/promises'),
    { tmpdir } = await import('node:os'),
    path = await import('node:path');
  const folder = await mkdtemp(path.join(tmpdir(), 'blackwood-retries-'));
  try {
    const values = responses(),
      seeds = [],
      progress = [];
    let count = 0;
    await assert.rejects(
      generateCustomWorld(raw.description, {
        checkpointDir: folder,
        maxAttempts: 2,
        onProgress: p => progress.push(p),
        request: async (...args) => {
          count++;
          seeds.push(args[5]);
          if (count >= 3) throw Error('Choose a different proper name.');
          return values.shift();
        },
      }),
      /tras 2 intentos/,
    );
    assert.equal(count, 4);
    assert.ok(progress.some(p => p.attempt === 2 && p.maxAttempts === 2));
    const firstFailureSeeds = seeds.slice(-2);
    let firstResumedSeed;
    const result = await generateCustomWorld(raw.description, {
      checkpointDir: folder,
      maxAttempts: 5,
      request: async (...args) => {
        firstResumedSeed ??= args[5];
        return values.shift();
      },
    });
    assert.ok(!firstFailureSeeds.includes(firstResumedSeed));
    assert.equal(result.world.rooms.length, 6);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test('room semantics reject the audited contradictions but keep valid concrete interiors', () => {
  for (const room of [
    { name: 'Colonia de Enanos', description: 'Una colonia subterránea' },
    { name: 'Esmalte de la Colina', description: 'Caja de registros' },
    { name: 'Dormitorio de la Colina', description: 'Un espacio de comedor para el desayuno' },
    { name: 'Comedor', description: 'Estancias para dormir' },
    { name: 'Archivo', description: 'La petición entera' },
  ])
    assert.throws(() => checkRoomMeaning(room, 'La petición entera'));
  assert.doesNotThrow(() =>
    checkRoomMeaning(
      {
        name: 'Dormitorio de los Mineros',
        description: 'Estancias para dormir con cama de madera.',
      },
      'Una colonia subterránea',
    ),
  );
});
