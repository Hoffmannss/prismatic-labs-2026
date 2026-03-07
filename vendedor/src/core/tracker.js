const fs = require('fs');
const path = require('path');
const { LEAD_STATUS } = require('../domain/lead-status');
const { LEAD_EVENTS } = require('../domain/lead-events');
const { canTransition } = require('../domain/pipeline-rules');

const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const DATA_ROOT = path.join(VENDEDOR_ROOT, 'data');
const CRM_DIR = path.join(DATA_ROOT, 'crm');
const LEADS_DIR = path.join(DATA_ROOT, 'leads');
const MESSAGES_DIR = path.join(DATA_ROOT, 'mensagens');
const REPORTS_DIR = path.join(DATA_ROOT, 'relatorios');
const METRICS_DIR = path.join(DATA_ROOT, 'metrics');
const TRACKER_COMPAT_DIR = path.join(DATA_ROOT, 'tracker');

const DB_FILE = path.join(CRM_DIR, 'leads-database.json');
const PIPELINE_FILE = path.join(CRM_DIR, 'pipeline.json');
const EVENTS_FILE = path.join(METRICS_DIR, 'lead-events.json');

const LEGACY_TO_CANONICAL = Object.freeze({
  novo: LEAD_STATUS.DISCOVERED,
  analisado: LEAD_STATUS.ENRICHED,
  qualificado: LEAD_STATUS.QUALIFIED,
  mensagem_pronta: LEAD_STATUS.MESSAGE_READY,
  aprovado: LEAD_STATUS.QA_APPROVED,
  contatado: LEAD_STATUS.SENT,
  respondeu: LEAD_STATUS.ENGAGED,
  followup_pendente: LEAD_STATUS.FOLLOWUP_DUE,
  em_negociacao: LEAD_STATUS.OPPORTUNITY,
  fechado: LEAD_STATUS.WON,
  perdido: LEAD_STATUS.LOST,
  bloqueado: LEAD_STATUS.BLOCKED,
  aguardando_revisao: LEAD_STATUS.MESSAGE_READY,
  rejeitado: LEAD_STATUS.BLOCKED
});

const CANONICAL_TO_LEGACY = Object.freeze({
  [LEAD_STATUS.DISCOVERED]: 'novo',
  [LEAD_STATUS.ENRICHED]: 'analisado',
  [LEAD_STATUS.QUALIFIED]: 'qualificado',
  [LEAD_STATUS.MESSAGE_READY]: 'mensagem_pronta',
  [LEAD_STATUS.QA_APPROVED]: 'aprovado',
  [LEAD_STATUS.SENT]: 'contatado',
  [LEAD_STATUS.ENGAGED]: 'respondeu',
  [LEAD_STATUS.FOLLOWUP_DUE]: 'followup_pendente',
  [LEAD_STATUS.OPPORTUNITY]: 'em_negociacao',
  [LEAD_STATUS.WON]: 'fechado',
  [LEAD_STATUS.LOST]: 'perdido',
  [LEAD_STATUS.BLOCKED]: 'bloqueado'
});

const TRACKER_OUTCOME_TO_STATUS = Object.freeze({
  enviada: LEAD_STATUS.SENT,
  respondeu: LEAD_STATUS.ENGAGED,
  ignorou: LEAD_STATUS.LOST,
  negociando: LEAD_STATUS.OPPORTUNITY,
  converteu: LEAD_STATUS.WON,
  recusou: LEAD_STATUS.LOST
});

const TRACKER_OUTCOMES = Object.freeze(['enviada', 'respondeu', 'ignorou', 'negociando', 'converteu', 'recusou']);

function ensureDirs() {
  [CRM_DIR, LEADS_DIR, MESSAGES_DIR, REPORTS_DIR, METRICS_DIR, TRACKER_COMPAT_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function loadJSON(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadDB() {
  ensureDirs();
  const db = loadJSON(DB_FILE, { leads: [], updated_at: null });
  db.leads = (db.leads || []).map(normalizeLead);
  return db;
}

function saveDB(db) {
  db.updated_at = new Date().toISOString();
  saveJSON(DB_FILE, db);
}

function normalizeStatus(status) {
  if (!status) return LEAD_STATUS.DISCOVERED;
  return LEGACY_TO_CANONICAL[status] || status;
}

function toLegacyStatus(status) {
  return CANONICAL_TO_LEGACY[status] || status;
}

function inferNextStatusFromAnalysis(score) {
  if (score >= 70) return LEAD_STATUS.QUALIFIED;
  return LEAD_STATUS.ENRICHED;
}

function normalizeLead(lead) {
  const canonicalStatus = normalizeStatus(lead.status_canonical || lead.status);
  return {
    ...lead,
    status: toLegacyStatus(canonicalStatus),
    status_canonical: canonicalStatus,
    prioridade: lead.prioridade || 'cold',
    notas: Array.isArray(lead.notas) ? lead.notas : [],
    historico: Array.isArray(lead.historico) ? lead.historico : []
  };
}

function loadEvents() {
  ensureDirs();
  return loadJSON(EVENTS_FILE, { events: [], updated_at: null });
}

function saveEvents(store) {
  store.updated_at = new Date().toISOString();
  saveJSON(EVENTS_FILE, store);
}

function recordEvent(eventType, username, payload = {}) {
  const store = loadEvents();
  store.events.push({
    event: eventType,
    username,
    timestamp: new Date().toISOString(),
    payload
  });
  saveEvents(store);
}

function getLeadFiles(username) {
  return {
    analysisFile: path.join(LEADS_DIR, `${username}_analysis.json`),
    messagesFile: path.join(MESSAGES_DIR, `${username}_mensagens.json`)
  };
}

function loadMessageData(username) {
  return loadJSON(path.join(MESSAGES_DIR, `${username}_mensagens.json`), null);
}

function saveMessageData(username, data) {
  saveJSON(path.join(MESSAGES_DIR, `${username}_mensagens.json`), data);
}

function saveTrackerCompat(username, tracking) {
  saveJSON(path.join(TRACKER_COMPAT_DIR, `${username}_tracker.json`), tracking || {});
}

function upsertLeadFromFiles(username) {
  const { analysisFile, messagesFile } = getLeadFiles(username);
  const analysis = loadJSON(analysisFile, null);
  const messages = loadJSON(messagesFile, null);
  return upsertLead(username, analysis, messages);
}

function upsertLead(username, analysisData, messagesData) {
  const db = loadDB();
  const index = db.leads.findIndex((lead) => lead.username === username);
  const a = analysisData?.analise || {};
  const review = messagesData?.revisao || null;
  const now = new Date().toISOString();

  const inferredStatus = review?.aprovada
    ? LEAD_STATUS.QA_APPROVED
    : review && review.aprovada === false
      ? LEAD_STATUS.MESSAGE_READY
      : inferNextStatusFromAnalysis(a.score_potencial || 0);

  const baseLead = {
    username,
    status: toLegacyStatus(inferredStatus),
    status_canonical: inferredStatus,
    prioridade: a.prioridade || 'cold',
    score: a.score_potencial || 0,
    nicho: a.nicho || '',
    tipo_negocio: a.tipo_negocio || '',
    problema_principal: a.problema_principal || '',
    servico_ideal: a.servico_ideal || '',
    primeira_mensagem_enviada: false,
    data_primeiro_contato: null,
    data_ultima_interacao: null,
    followups_enviados: 0,
    proximo_followup: null,
    notas: [],
    historico: [],
    analise: a,
    mensagens_geradas: messagesData?.mensagens || null,
    revisao: review,
    criado_em: now,
    atualizado_em: now
  };

  if (index >= 0) {
    const existing = normalizeLead(db.leads[index]);
    const nextStatus = inferredStatus;
    const keptStatus = canTransition(existing.status_canonical, nextStatus) ? nextStatus : existing.status_canonical;
    const merged = {
      ...existing,
      ...baseLead,
      status_canonical: keptStatus,
      status: toLegacyStatus(keptStatus),
      primeira_mensagem_enviada: existing.primeira_mensagem_enviada,
      data_primeiro_contato: existing.data_primeiro_contato,
      followups_enviados: existing.followups_enviados,
      proximo_followup: existing.proximo_followup,
      notas: existing.notas,
      historico: existing.historico,
      criado_em: existing.criado_em,
      atualizado_em: now
    };

    merged.historico.push({
      evento: 'lead_enriquecido',
      timestamp: now,
      dados: 'Lead atualizado com nova analise, copy e revisao.'
    });

    db.leads[index] = merged;
    saveDB(db);
    updatePipeline(db);
    recordEvent(LEAD_EVENTS.LEAD_ENRICHED, username, { score: merged.score, status: merged.status_canonical });
    return merged;
  }

  baseLead.historico.push({
    evento: 'lead_criado',
    timestamp: now,
    dados: 'Lead adicionado ao CRM estruturado.'
  });

  db.leads.push(baseLead);
  saveDB(db);
  updatePipeline(db);
  recordEvent(LEAD_EVENTS.LEAD_DISCOVERED, username, { score: baseLead.score, status: baseLead.status_canonical });
  return baseLead;
}

function scheduleFollowup(lead, days = 3) {
  const when = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  lead.proximo_followup = when;
  return when;
}

function resolveEventForStatus(status) {
  switch (status) {
    case LEAD_STATUS.ENRICHED: return LEAD_EVENTS.LEAD_ENRICHED;
    case LEAD_STATUS.QUALIFIED: return LEAD_EVENTS.LEAD_QUALIFIED;
    case LEAD_STATUS.MESSAGE_READY: return LEAD_EVENTS.MESSAGE_GENERATED;
    case LEAD_STATUS.QA_APPROVED: return LEAD_EVENTS.MESSAGE_QA_APPROVED;
    case LEAD_STATUS.SENT: return LEAD_EVENTS.MESSAGE_SENT;
    case LEAD_STATUS.ENGAGED: return LEAD_EVENTS.LEAD_REPLIED;
    case LEAD_STATUS.FOLLOWUP_DUE: return LEAD_EVENTS.FOLLOWUP_SCHEDULED;
    case LEAD_STATUS.OPPORTUNITY: return LEAD_EVENTS.OPPORTUNITY_OPENED;
    case LEAD_STATUS.WON: return LEAD_EVENTS.DEAL_WON;
    case LEAD_STATUS.LOST: return LEAD_EVENTS.DEAL_LOST;
    case LEAD_STATUS.BLOCKED: return LEAD_EVENTS.LEAD_BLOCKED;
    default: return LEAD_EVENTS.LEAD_DISCOVERED;
  }
}

function updateLeadStatus(username, nextStatus, note) {
  const db = loadDB();
  const lead = db.leads.find((item) => item.username === username);
  if (!lead) throw new Error(`Lead @${username} nao encontrado`);

  const normalized = normalizeLead(lead);
  const canonicalNext = normalizeStatus(nextStatus);

  if (!canTransition(normalized.status_canonical, canonicalNext) && normalized.status_canonical !== canonicalNext) {
    throw new Error(`Transicao invalida: ${normalized.status_canonical} -> ${canonicalNext}`);
  }

  const previous = normalized.status_canonical;
  normalized.status_canonical = canonicalNext;
  normalized.status = toLegacyStatus(canonicalNext);
  normalized.data_ultima_interacao = new Date().toISOString();
  normalized.atualizado_em = new Date().toISOString();

  if (note) normalized.notas.push({ timestamp: new Date().toISOString(), texto: note });
  if (canonicalNext === LEAD_STATUS.FOLLOWUP_DUE && !normalized.proximo_followup) scheduleFollowup(normalized, 0);

  normalized.historico.push({
    evento: 'status_alterado',
    timestamp: new Date().toISOString(),
    dados: `${previous} -> ${canonicalNext}${note ? `: ${note}` : ''}`
  });

  Object.assign(lead, normalized);
  saveDB(db);
  updatePipeline(db);
  recordEvent(resolveEventForStatus(canonicalNext), username, { from: previous, to: canonicalNext, note: note || null });
  return normalized;
}

function markMessageSent(username) {
  const db = loadDB();
  const lead = db.leads.find((item) => item.username === username);
  if (!lead) throw new Error(`Lead @${username} nao encontrado`);

  const normalized = normalizeLead(lead);
  const current = normalized.status_canonical;
  const next = LEAD_STATUS.SENT;
  if (!canTransition(current, next) && current !== next) {
    throw new Error(`Transicao invalida: ${current} -> ${next}`);
  }

  normalized.status_canonical = next;
  normalized.status = toLegacyStatus(next);
  normalized.primeira_mensagem_enviada = true;
  normalized.data_primeiro_contato = normalized.data_primeiro_contato || new Date().toISOString();
  normalized.data_ultima_interacao = new Date().toISOString();
  normalized.atualizado_em = new Date().toISOString();
  scheduleFollowup(normalized, 3);
  normalized.historico.push({
    evento: 'mensagem_enviada',
    timestamp: new Date().toISOString(),
    dados: 'Primeira mensagem enviada e followup agendado em 3 dias.'
  });

  Object.assign(lead, normalized);
  saveDB(db);
  updatePipeline(db);
  recordEvent(LEAD_EVENTS.MESSAGE_SENT, username, { next_followup: normalized.proximo_followup });
  return normalized;
}

function daysSince(isoDate) {
  if (!isoDate) return null;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

function getRecommendedAngle(messageData) {
  const key = `mensagem_${messageData?.mensagens?.mensagem_recomendada}`;
  return messageData?.mensagens?.[key]?.angulo || null;
}

function updateOutcome(username, outcome, extra) {
  if (!TRACKER_OUTCOMES.includes(outcome)) throw new Error(`Outcome invalido: ${outcome}`);

  const messageData = loadMessageData(username);
  if (!messageData) throw new Error(`Mensagem de @${username} nao encontrada`);

  let lead = loadDB().leads.find((item) => item.username === username);
  if (!lead) lead = upsertLeadFromFiles(username);

  const now = new Date().toISOString();
  const tracking = messageData.tracking || {};

  if (outcome === 'enviada') {
    tracking.data_envio = tracking.data_envio || now;
    tracking.outcome = 'enviada';
    tracking.historico = tracking.historico || [];
    tracking.historico.push({ ts: now, outcome: 'enviada', nota: extra || null });
    messageData.tracking = tracking;
    saveMessageData(username, messageData);
    saveTrackerCompat(username, tracking);
    markMessageSent(username);
    return { username, tracking, lead: loadDB().leads.find((item) => item.username === username) };
  }

  if (!tracking.data_envio) tracking.data_envio = now;
  tracking.outcome = outcome;
  tracking.data_outcome = now;
  tracking.dias_ate_resposta = daysSince(tracking.data_envio);
  if (['respondeu', 'negociando', 'recusou'].includes(outcome) && extra) tracking.nota = extra;
  if (outcome === 'converteu' && extra) {
    const value = parseFloat(String(extra).replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!Number.isNaN(value)) tracking.valor_fechado = value;
  }
  if (['respondeu', 'negociando', 'converteu'].includes(outcome)) tracking.respondeu = true;
  if (outcome === 'converteu') tracking.converteu = true;
  tracking.historico = tracking.historico || [];
  tracking.historico.push({ ts: now, outcome, nota: extra || null });
  messageData.tracking = tracking;
  saveMessageData(username, messageData);
  saveTrackerCompat(username, tracking);

  const mappedStatus = TRACKER_OUTCOME_TO_STATUS[outcome];
  const note = extra || `Outcome registrado: ${outcome}`;
  const updatedLead = updateLeadStatus(username, mappedStatus, note);
  return { username, tracking, lead: updatedLead };
}

function listTrackingQueue() {
  ensureDirs();
  const files = fs.existsSync(MESSAGES_DIR)
    ? fs.readdirSync(MESSAGES_DIR).filter((file) => file.endsWith('_mensagens.json'))
    : [];

  return files.map((file) => {
    const data = loadJSON(path.join(MESSAGES_DIR, file), null);
    if (!data) return null;
    const username = data.username || file.replace('_mensagens.json', '');
    const tracking = data.tracking || {};
    return {
      username,
      outcome: tracking.outcome || null,
      data_envio: tracking.data_envio || null,
      score_reviewer: data.revisao?.score || null,
      prioridade: data.prioridade || null,
      mensagem_final: data.revisao?.mensagem_final || null,
      angle: getRecommendedAngle(data)
    };
  }).filter(Boolean).filter((item) => !item.outcome || item.outcome === 'enviada');
}

function getPendingTracking() {
  return listTrackingQueue().filter((item) => item.data_envio && daysSince(item.data_envio) >= 3 && item.outcome === 'enviada');
}

function getOutcomeStats() {
  ensureDirs();
  const files = fs.existsSync(MESSAGES_DIR)
    ? fs.readdirSync(MESSAGES_DIR).filter((file) => file.endsWith('_mensagens.json'))
    : [];

  const counts = {
    enviada: 0,
    respondeu: 0,
    ignorou: 0,
    negociando: 0,
    converteu: 0,
    recusou: 0
  };

  const scored = {
    respondeu: [],
    ignorou: [],
    converteu: []
  };

  const angleCounts = {};
  let totalValue = 0;
  let totalTracked = 0;
  let days = [];

  files.forEach((file) => {
    const data = loadJSON(path.join(MESSAGES_DIR, file), null);
    const outcome = data?.tracking?.outcome;
    if (!outcome || !(outcome in counts)) return;

    totalTracked += 1;
    counts[outcome] += 1;

    const score = data?.revisao?.score;
    if (score && scored[outcome]) scored[outcome].push(score);
    if (outcome === 'converteu' && data?.tracking?.valor_fechado) totalValue += Number(data.tracking.valor_fechado) || 0;
    if (data?.tracking?.dias_ate_resposta !== null && data?.tracking?.dias_ate_resposta !== undefined) {
      days.push(Number(data.tracking.dias_ate_resposta));
    }

    if (['respondeu', 'negociando', 'converteu'].includes(outcome)) {
      const angle = getRecommendedAngle(data) || 'sem angulo';
      angleCounts[angle] = (angleCounts[angle] || 0) + 1;
    }
  });

  const totalResponses = counts.respondeu + counts.negociando + counts.converteu + counts.recusou;
  const totalPositive = counts.respondeu + counts.negociando + counts.converteu;

  const avg = (arr) => arr.length ? Math.round(arr.reduce((sum, value) => sum + value, 0) / arr.length) : null;

  return {
    total_tracked: totalTracked,
    counts,
    response_rate: totalTracked ? Number(((totalResponses / totalTracked) * 100).toFixed(1)) : 0,
    positive_rate: totalTracked ? Number(((totalPositive / totalTracked) * 100).toFixed(1)) : 0,
    conversion_rate: totalTracked ? Number(((counts.converteu / totalTracked) * 100).toFixed(1)) : 0,
    total_value: totalValue,
    average_days_to_outcome: days.length ? Number((days.reduce((sum, value) => sum + value, 0) / days.length).toFixed(1)) : null,
    average_scores: {
      respondeu: avg(scored.respondeu),
      ignorou: avg(scored.ignorou),
      converteu: avg(scored.converteu)
    },
    top_angles: Object.entries(angleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([angle, count]) => ({ angle, count }))
  };
}

function updatePipeline(db = loadDB()) {
  ensureDirs();
  const outcomeStats = getOutcomeStats();
  const pipeline = {
    total_leads: db.leads.length,
    atualizado_em: new Date().toISOString(),
    por_status_canonico: {},
    por_status_legado: {},
    por_prioridade: { hot: 0, warm: 0, cold: 0 },
    por_nicho: {},
    taxa_contato: 0,
    taxa_oportunidade: 0,
    taxa_fechamento: 0,
    leads_para_followup_hoje: [],
    top_oportunidades: [],
    tracker: outcomeStats
  };

  let sentCount = 0;
  let opportunityCount = 0;
  let wonCount = 0;

  db.leads.forEach((rawLead) => {
    const lead = normalizeLead(rawLead);
    pipeline.por_status_canonico[lead.status_canonical] = (pipeline.por_status_canonico[lead.status_canonical] || 0) + 1;
    pipeline.por_status_legado[lead.status] = (pipeline.por_status_legado[lead.status] || 0) + 1;
    if (lead.prioridade in pipeline.por_prioridade) pipeline.por_prioridade[lead.prioridade] += 1;
    if (lead.nicho) pipeline.por_nicho[lead.nicho] = (pipeline.por_nicho[lead.nicho] || 0) + 1;

    if (lead.status_canonical === LEAD_STATUS.SENT || lead.primeira_mensagem_enviada) sentCount += 1;
    if (lead.status_canonical === LEAD_STATUS.OPPORTUNITY) opportunityCount += 1;
    if (lead.status_canonical === LEAD_STATUS.WON) wonCount += 1;

    if (lead.proximo_followup) {
      const due = new Date(lead.proximo_followup);
      if (due <= new Date() && ![LEAD_STATUS.WON, LEAD_STATUS.LOST, LEAD_STATUS.BLOCKED].includes(lead.status_canonical)) {
        pipeline.leads_para_followup_hoje.push({
          username: lead.username,
          status: lead.status_canonical,
          prioridade: lead.prioridade,
          followups_ja_enviados: lead.followups_enviados || 0
        });
      }
    }

    if ([LEAD_STATUS.OPPORTUNITY, LEAD_STATUS.ENGAGED, LEAD_STATUS.QA_APPROVED].includes(lead.status_canonical)) {
      pipeline.top_oportunidades.push({
        username: lead.username,
        status: lead.status_canonical,
        prioridade: lead.prioridade,
        score: lead.score || 0
      });
    }
  });

  pipeline.taxa_contato = db.leads.length ? Math.round((sentCount / db.leads.length) * 100) : 0;
  pipeline.taxa_oportunidade = sentCount ? Math.round((opportunityCount / sentCount) * 100) : 0;
  pipeline.taxa_fechamento = opportunityCount ? Math.round((wonCount / opportunityCount) * 100) : 0;
  pipeline.top_oportunidades.sort((a, b) => (b.score || 0) - (a.score || 0));
  saveJSON(PIPELINE_FILE, pipeline);
  return pipeline;
}

function listLeads(filter) {
  const db = loadDB();
  return db.leads.filter((lead) => {
    if (!filter) return true;
    return lead.status === filter || lead.status_canonical === filter || lead.prioridade === filter;
  });
}

function dailyReport() {
  const db = loadDB();
  const pipeline = updatePipeline(db);
  return { db, pipeline };
}

function cliCataloger(argv = process.argv.slice(2)) {
  const action = argv[0];
  const arg1 = argv[1];
  const arg2 = argv[2];

  try {
    switch (action) {
      case 'add':
        console.log(JSON.stringify(upsertLeadFromFiles(arg1), null, 2));
        break;
      case 'sent':
        console.log(JSON.stringify(markMessageSent(arg1), null, 2));
        break;
      case 'status':
        console.log(JSON.stringify(updateLeadStatus(arg1, arg2, argv[3]), null, 2));
        break;
      case 'list':
        console.log(JSON.stringify(listLeads(arg1), null, 2));
        break;
      case 'report':
      default:
        console.log(JSON.stringify(dailyReport(), null, 2));
        break;
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

function cliTracker(argv = process.argv.slice(2)) {
  const action = argv[0];
  const username = argv[1];
  const extra = argv.slice(2).join(' ') || null;

  const actionMap = {
    sent: 'enviada',
    respondeu: 'respondeu',
    ignorou: 'ignorou',
    negociando: 'negociando',
    converteu: 'converteu',
    recusou: 'recusou'
  };

  try {
    switch (action) {
      case 'list':
        console.log(JSON.stringify(listTrackingQueue(), null, 2));
        break;
      case 'pending':
        console.log(JSON.stringify(getPendingTracking(), null, 2));
        break;
      case 'stats':
        console.log(JSON.stringify(getOutcomeStats(), null, 2));
        break;
      default:
        if (!actionMap[action]) throw new Error(`Comando tracker desconhecido: ${action}`);
        if (!username) throw new Error('Informe o username');
        console.log(JSON.stringify(updateOutcome(username, actionMap[action], extra), null, 2));
        break;
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  loadDB,
  saveDB,
  upsertLead,
  upsertLeadFromFiles,
  updateLeadStatus,
  markMessageSent,
  listLeads,
  dailyReport,
  updatePipeline,
  normalizeStatus,
  toLegacyStatus,
  recordEvent,
  loadMessageData,
  saveMessageData,
  updateOutcome,
  listTrackingQueue,
  getPendingTracking,
  getOutcomeStats,
  cliCataloger,
  cliTracker,
  LEAD_STATUS,
  LEGACY_TO_CANONICAL,
  CANONICAL_TO_LEGACY,
  TRACKER_OUTCOMES
};

if (require.main === module) {
  cliCataloger(process.argv.slice(2));
}
