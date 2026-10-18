import test from 'node:test';
import assert from 'node:assert/strict';
import { worldAttemptLimit, worldIssue, worldStepLabel } from '../src/world-retry-policy.mjs';
test('attempt limit is finite, configurable and defaults to five total attempts', () => {
  assert.equal(worldAttemptLimit(), 5);
  assert.equal(worldAttemptLimit(8), 8);
  for (const v of [0, 9, 2.2, '5', null]) assert.throws(() => worldAttemptLimit(v));
});
test('validation failures are explained in Spanish without model internals', () => {
  assert.equal(worldStepLabel('person-2'), 'el personaje 2');
  assert.ok(worldIssue('Choose a different proper name.').includes('nombre'));
  assert.ok(
    worldIssue('imagePrompt must be a plain English portrait description.').includes('imagen'),
  );
});
