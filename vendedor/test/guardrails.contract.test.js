const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_GUARDRAILS,
  validateAutopilotPayload,
  evaluateSendGuardrails
} = require('../src/domain/guardrails');

test('autopilot payload is rejected when above operational limits', () => {
  const result = validateAutopilotPayload({ nicho: 'api-automacao', qtd: 99, maxAnalyze: 20 }, DEFAULT_GUARDRAILS);
  assert.equal(result.ok, false);
  assert.equal(result.errors.length >= 2, true);
  assert.match(result.errors.join(' '), /limite/);
});

test('send guardrails block non-approved or low-score leads', () => {
  const blocked = evaluateSendGuardrails({
    status_canonical: 'message_ready',
    score: 62,
    followups_enviados: 0
  }, DEFAULT_GUARDRAILS);

  assert.equal(blocked.ok, false);
  assert.match(blocked.errors.join(' '), /qa_approved/);
  assert.match(blocked.errors.join(' '), /score minimo/);
});

test('send guardrails allow approved lead with adequate score', () => {
  const allowed = evaluateSendGuardrails({
    status_canonical: 'qa_approved',
    score: 84,
    followups_enviados: 0
  }, DEFAULT_GUARDRAILS);

  assert.equal(allowed.ok, true);
  assert.deepEqual(allowed.errors, []);
});

test('default guardrails expose quotas and retry policy', () => {
  assert.equal(DEFAULT_GUARDRAILS.daily_send_quota, 25);
  assert.equal(DEFAULT_GUARDRAILS.daily_followup_quota, 40);
  assert.equal(DEFAULT_GUARDRAILS.retry_max_attempts, 3);
  assert.equal(DEFAULT_GUARDRAILS.retry_base_delay_ms, 1500);
});
