const path = require('path');
const { loadJSON } = require('../utils/file-store');

const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const GUARDRAILS_FILE = path.join(VENDEDOR_ROOT, 'config', 'guardrails.json');

const DEFAULT_GUARDRAILS = Object.freeze({
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
});

function loadGuardrails() {
  return {
    ...DEFAULT_GUARDRAILS,
    ...(loadJSON(GUARDRAILS_FILE, {}) || {})
  };
}

function inferDispatchKindFromLead(lead = {}) {
  return lead.primeira_mensagem_enviada || Number(lead.followups_enviados || 0) > 0 ? 'followup' : 'send';
}

function validateAutopilotPayload(payload = {}, guardrails = loadGuardrails()) {
  const qtd = Number(payload.qtd);
  const maxAnalyze = Number(payload.maxAnalyze);
  const sanitized = {
    nicho: payload.nicho || 'api-automacao',
    qtd: Number.isFinite(qtd) && qtd > 0 ? qtd : guardrails.max_qtd_per_run,
    maxAnalyze: Number.isFinite(maxAnalyze) && maxAnalyze > 0 ? maxAnalyze : guardrails.max_analyze_per_run
  };

  const errors = [];
  if (!guardrails.allow_autopilot_trigger) errors.push('Autopilot bloqueado pelos guardrails operacionais.');
  if (sanitized.qtd > guardrails.max_qtd_per_run) {
    errors.push(`Qtd solicitada acima do limite (${sanitized.qtd} > ${guardrails.max_qtd_per_run}).`);
  }
  if (sanitized.maxAnalyze > guardrails.max_analyze_per_run) {
    errors.push(`Max analyze acima do limite (${sanitized.maxAnalyze} > ${guardrails.max_analyze_per_run}).`);
  }
  if (sanitized.maxAnalyze > sanitized.qtd) {
    errors.push(`maxAnalyze nao pode ser maior que qtd (${sanitized.maxAnalyze} > ${sanitized.qtd}).`);
  }

  return {
    ok: errors.length === 0,
    errors,
    sanitized,
    guardrails
  };
}

function evaluateSendGuardrails(lead, guardrails = loadGuardrails(), options = {}) {
  const errors = [];
  const canonicalStatus = lead?.status_canonical || lead?.status || null;
  const score = Number(lead?.score || 0);
  const followups = Number(lead?.followups_enviados || 0);
  const dispatchKind = options.dispatchKind || inferDispatchKindFromLead(lead);

  if (dispatchKind === 'send') {
    if (guardrails.require_qa_approved_for_send && canonicalStatus !== 'qa_approved') {
      errors.push(`Lead precisa estar em qa_approved antes do envio. Status atual: ${canonicalStatus || 'desconhecido'}.`);
    }
  } else {
    if (!lead?.primeira_mensagem_enviada) {
      errors.push('Follow-up exige primeira mensagem previamente enviada.');
    }
    if (['won', 'lost', 'blocked'].includes(canonicalStatus)) {
      errors.push(`Follow-up nao permitido para status final ${canonicalStatus}.`);
    }
    if (followups >= guardrails.max_followups_per_lead) {
      errors.push(`Lead excedeu o limite de followups (${followups} >= ${guardrails.max_followups_per_lead}).`);
    }
  }

  if (score < guardrails.min_score_to_send) {
    errors.push(`Lead abaixo do score minimo (${score} < ${guardrails.min_score_to_send}).`);
  }

  return {
    ok: errors.length === 0,
    errors,
    guardrails,
    dispatch_kind: dispatchKind
  };
}

module.exports = {
  GUARDRAILS_FILE,
  DEFAULT_GUARDRAILS,
  loadGuardrails,
  inferDispatchKindFromLead,
  validateAutopilotPayload,
  evaluateSendGuardrails
};
