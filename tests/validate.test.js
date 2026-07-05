import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDataset } from '../scripts/lib/validate.js';
import { STATUS } from '../scripts/lib/classify.js';

function validDataset() {
  return {
    generatedAt: '2026-07-05T00:00:00.000Z',
    summary: { totalApps: 1, shutdownCount: 0, freshCount: 1, staleCount: 0, abandonedCount: 0 },
    apps: [{ appId: '1', appName: 'Test App', status: STATUS.FRESH }],
    hallOfShame: [],
  };
}

test('a well-formed dataset is valid', () => {
  const { valid, errors } = validateDataset(validDataset());
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test('a missing generatedAt is invalid', () => {
  const data = validDataset();
  delete data.generatedAt;
  const { valid, errors } = validateDataset(data);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('generatedAt')));
});

test('an empty apps array is invalid', () => {
  const data = validDataset();
  data.apps = [];
  const { valid, errors } = validateDataset(data);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('apps')));
});

test('an app with an invalid status is invalid', () => {
  const data = validDataset();
  data.apps[0].status = 'not-a-real-status';
  const { valid, errors } = validateDataset(data);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('status')));
});

test('a null element in apps is invalid instead of throwing', () => {
  const data = validDataset();
  data.apps.push(null);
  const { valid, errors } = validateDataset(data);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('apps[1]')));
});

test('a non-array hallOfShame is invalid', () => {
  const data = validDataset();
  data.hallOfShame = null;
  const { valid, errors } = validateDataset(data);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('hallOfShame')));
});
