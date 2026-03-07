const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canExecute,
  recordCircuitFailure,
  recordCircuitSuccess
} = require('../src/utils/circuit-breaker');

const tempFile = '/tmp/vendedor-circuit-breaker-test.json';

test('circuit breaker opens after reaching failure threshold', () => {
  recordCircuitFailure('apify-test', {
    file: tempFile,
    policy: { failureThreshold: 2, cooldownMs: 1000 },
    error: new Error('boom')
  });

  const state = recordCircuitFailure('apify-test', {
    file: tempFile,
    policy: { failureThreshold: 2, cooldownMs: 1000 },
    error: new Error('boom-again')
  });

  assert.equal(state.state, 'open');

  const verdict = canExecute('apify-test', { failureThreshold: 2, cooldownMs: 1000 }, undefined, Date.now());
  assert.equal(verdict.ok, false);
});

test('circuit breaker closes after success', () => {
  const closed = recordCircuitSuccess('apify-test', { file: tempFile, metadata: { reset: true } });
  assert.equal(closed.state, 'closed');
  assert.equal(closed.consecutive_failures, 0);
});
