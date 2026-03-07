const LEAD_EVENTS = Object.freeze({
  LEAD_DISCOVERED: 'lead_discovered',
  LEAD_ENRICHED: 'lead_enriched',
  LEAD_QUALIFIED: 'lead_qualified',
  MESSAGE_GENERATED: 'message_generated',
  MESSAGE_QA_APPROVED: 'message_qa_approved',
  MESSAGE_SENT: 'message_sent',
  LEAD_REPLIED: 'lead_replied',
  FOLLOWUP_SCHEDULED: 'followup_scheduled',
  OPPORTUNITY_OPENED: 'opportunity_opened',
  DEAL_WON: 'deal_won',
  DEAL_LOST: 'deal_lost',
  LEAD_BLOCKED: 'lead_blocked'
});

module.exports = {
  LEAD_EVENTS
};
