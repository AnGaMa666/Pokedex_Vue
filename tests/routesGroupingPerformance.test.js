import assert from 'node:assert/strict';
import test from 'node:test';
import { mapWithConcurrencySettled } from '../src/utils/locationGrouping.js';

test('limits concurrent metadata and area requests while preserving result order', async () => {
  let active = 0;
  let maximumActive = 0;
  const inputs = Array.from({ length: 18 }, (_, index) => index + 1);

  const results = await mapWithConcurrencySettled(inputs, 4, async (value) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, value % 3));
    active -= 1;
    return value * 2;
  });

  assert.equal(maximumActive <= 4, true);
  assert.deepEqual(results.map((result) => result.status), Array(18).fill('fulfilled'));
  assert.deepEqual(results.map((result) => result.value), inputs.map((value) => value * 2));
});

test('isolates failed detail requests instead of discarding successful results', async () => {
  const results = await mapWithConcurrencySettled([1, 2, 3], 2, async (value) => {
    if (value === 2) throw new Error('Area unavailable');
    return `area-${value}`;
  });

  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[0].value, 'area-1');
  assert.equal(results[1].status, 'rejected');
  assert.match(results[1].reason.message, /Area unavailable/);
  assert.equal(results[2].status, 'fulfilled');
  assert.equal(results[2].value, 'area-3');
});

test('handles empty work queues without starting a request worker', async () => {
  let calls = 0;
  const results = await mapWithConcurrencySettled([], 6, async () => {
    calls += 1;
  });

  assert.deepEqual(results, []);
  assert.equal(calls, 0);
});
