const LEAD_STATUS = Object.freeze({
  DISCOVERED: 'discovered',
  ENRICHED: 'enriched',
  QUALIFIED: 'qualified',
  MESSAGE_READY: 'message_ready',
  QA_APPROVED: 'qa_approved',
  SENT: 'sent',
  ENGAGED: 'engaged',
  FOLLOWUP_DUE: 'followup_due',
  OPPORTUNITY: 'opportunity',
  WON: 'won',
  LOST: 'lost',
  BLOCKED: 'blocked'
});

const TERMINAL_STATUSES = new Set([
  LEAD_STATUS.WON,
  LEAD_STATUS.LOST,
  LEAD_STATUS.BLOCKED
]);

module.exports = {
  LEAD_STATUS,
  TERMINAL_STATUSES
};
