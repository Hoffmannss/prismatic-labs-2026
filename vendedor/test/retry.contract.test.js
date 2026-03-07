const test = require('node:test');
const assert = require('node:assert/strict');
const { withRetry } = require('../src/utils/retry');

test('withRetry succeeds after transient failures', async () => {
  let attempts = 0;
  const result = await withRetry(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error('transient');
    return 'ok';
  }, {
    attempts: 3,
    baseDelayMs: 1,
    label: 'transient-task'
  });

  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
});

test('withRetry throws contextualized error after exhausting attempts', async () => {
  await assert.rejects(async () => {
    await withRetry(async () => {
      throw new Error('permanent');
    }, {
      attempts: 2,
      baseDelayMs: 1,
      label: 'permanent-task'
    });
  }, /permanent-task failed after 2 attempts/);
});
