function buildDashboardStatsPayload({ db, pipeline, learning, guardrails }) {
  const leads = db?.leads || [];
  const byPriority = { hot: 0, warm: 0, cold: 0 };

  leads.forEach((lead) => {
    if (lead.prioridade in byPriority) byPriority[lead.prioridade] += 1;
  });

  return {
    total: leads.length,
    byPriority,
    pipeline: pipeline || null,
    tracker: pipeline?.tracker || null,
    learning: learning ? {
      versao: learning.versao,
      score_medio: learning.score_medio,
      total_amostras: learning.total_amostras,
      taxa_resposta_real: learning.taxa_resposta_real,
      eventos_recentes: learning.eventos_recentes || {},
      insights_eventos: learning.insights_eventos || []
    } : null,
    guardrails: {
      allow_autopilot_trigger: guardrails.allow_autopilot_trigger,
      max_qtd_per_run: guardrails.max_qtd_per_run,
      max_analyze_per_run: guardrails.max_analyze_per_run,
      min_score_to_send: guardrails.min_score_to_send,
      require_qa_approved_for_send: guardrails.require_qa_approved_for_send,
      max_followups_per_lead: guardrails.max_followups_per_lead
    }
  };
}

module.exports = {
  buildDashboardStatsPayload
};
