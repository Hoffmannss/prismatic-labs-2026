const test = require('node:test');
const assert = require('node:assert/strict');
const { buildQuotaSnapshot, checkQuota } = require('../src/domain/quota-policy');
const { DEFAULT_GUARDRAILS } = require('../src/domain/guardrails');

function fakeStore() {
  return {
    updated_at: '2026-03-07T10:00:00.000Z',
    days: {
      '2026-03-07': {
        sends: 24,
        followups: 39,
        autopilot_runs: 1,
        analyzed_leads: 8,
        last_events: []
      }
    }
  };
}

const date = new Date('2026-03-07T12:00:00.000Z');

test('quota snapshot exposes daily usage and remaining capacity', () => {
  const snapshot = buildQuotaSnapshot(fakeStore(), DEFAULT_GUARDRAILS, date);
  assert.equal(snapshot.usage.sends, 24);
  assert.equal(snapshot.usage.followups, 39);
  assert.equal(snapshot.remaining.sends, 1);
  assert.equal(snapshot.remaining.followups, 1);
});

test('send quota blocks when requested amount exceeds daily limit', () => {
  const result = checkQuota('send', 2, DEFAULT_GUARDRAILS, fakeStore(), date);
  assert.equal(result.ok, false);
  assert.equal(result.limit, 25);
  assert.equal(result.next, 26);
});

test('followup quota allows operation when inside daily limit', () => {
  const result = checkQuota('followup', 1, DEFAULT_GUARDRAILS, fakeStore(), date);
  assert.equal(result.ok, true);
  assert.equal(result.remaining, 1);
});
