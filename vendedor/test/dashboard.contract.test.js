const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDashboardStatsPayload } = require('../src/services/dashboard-contract');

test('dashboard payload keeps structured tracker, learning and quota contracts', () => {
  const payload = buildDashboardStatsPayload({
    db: {
      leads: [
        { username: 'alpha', prioridade: 'hot' },
        { username: 'beta', prioridade: 'warm' },
        { username: 'gamma', prioridade: 'cold' }
      ]
    },
    pipeline: {
      total_leads: 3,
      por_status_canonico: { qa_approved: 1, sent: 1, won: 1 },
      tracker: {
        counts: { converteu: 1 },
        response_rate: 33.3,
        total_value: 2500
      }
    },
    learning: {
      versao: 4,
      score_medio: 82,
      total_amostras: 18,
      taxa_resposta_real: 22,
      eventos_recentes: { MESSAGE_SENT: 4 },
      insights_eventos: ['QA aprovado correlaciona com envio seguro.']
    },
    quotas: {
      date: '2026-03-07',
      usage: { sends: 4, followups: 7, autopilot_runs: 1, analyzed_leads: 8 },
      limits: { sends: 25, followups: 40 },
      remaining: { sends: 21, followups: 33 }
    },
    guardrails: {
      allow_autopilot_trigger: true,
      max_qtd_per_run: 30,
      max_analyze_per_run: 10,
      min_score_to_send: 70,
      require_qa_approved_for_send: true,
      max_followups_per_lead: 3,
      daily_send_quota: 25,
      daily_followup_quota: 40,
      retry_max_attempts: 3,
      retry_base_delay_ms: 1500
    }
  });

  assert.equal(payload.total, 3);
  assert.deepEqual(payload.byPriority, { hot: 1, warm: 1, cold: 1 });
  assert.equal(payload.pipeline.por_status_canonico.qa_approved, 1);
  assert.equal(payload.tracker.counts.converteu, 1);
  assert.equal(payload.learning.versao, 4);
  assert.equal(payload.learning.eventos_recentes.MESSAGE_SENT, 4);
  assert.equal(payload.guardrails.min_score_to_send, 70);
  assert.equal(payload.guardrails.daily_send_quota, 25);
  assert.equal(payload.quotas.remaining.followups, 33);
});
