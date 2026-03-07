const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_GUARDRAILS } = require('../src/domain/guardrails');
const { inferDispatchQuotaKind, evaluateDispatchReadiness } = require('../src/core/tracker');

function fakeStore() {
  return {
    updated_at: '2026-03-07T10:00:00.000Z',
    days: {
      '2026-03-07': {
        sends: 25,
        followups: 39,
        autopilot_runs: 1,
        analyzed_leads: 8,
        last_events: []
      }
    }
  };
}

const date = new Date('2026-03-07T12:00:00.000Z');

test('tracker dispatch inference separates send and followup', () => {
  assert.equal(inferDispatchQuotaKind({ primeira_mensagem_enviada: false, followups_enviados: 0 }), 'send');
  assert.equal(inferDispatchQuotaKind({ primeira_mensagem_enviada: true, followups_enviados: 0 }), 'followup');
});

test('tracker readiness blocks first touch when daily send quota is exhausted', () => {
  const result = evaluateDispatchReadiness({
    status_canonical: 'qa_approved',
    score: 90,
    primeira_mensagem_enviada: false,
    followups_enviados: 0
  }, {
    guardrails: DEFAULT_GUARDRAILS,
    quotaStore: fakeStore(),
    date
  });

  assert.equal(result.dispatch_kind, 'send');
  assert.equal(result.ok, false);
  assert.equal(result.quotaCheck.limit, 25);
});

test('tracker readiness allows followup while followup quota remains', () => {
  const result = evaluateDispatchReadiness({
    status_canonical: 'sent',
    score: 90,
    primeira_mensagem_enviada: true,
    followups_enviados: 1
  }, {
    guardrails: DEFAULT_GUARDRAILS,
    quotaStore: fakeStore(),
    date
  });

  assert.equal(result.dispatch_kind, 'followup');
  assert.equal(result.ok, true);
  assert.equal(result.quotaCheck.remaining, 1);
});
