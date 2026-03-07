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

function ensureDirs() {
  [CRM_DIR, LEADS_DIR, MESSAGES_DIR, REPORTS_DIR, METRICS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function loadJSON(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJSON(file, data) {
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

function updatePipeline(db = loadDB()) {
  ensureDirs();
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
    top_oportunidades: []
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
  LEAD_STATUS,
  LEGACY_TO_CANONICAL,
  CANONICAL_TO_LEGACY
};

if (require.main === module) {
  const action = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    switch (action) {
      case 'add': {
        const lead = upsertLeadFromFiles(arg1);
        console.log(JSON.stringify(lead, null, 2));
        break;
      }
      case 'sent': {
        const lead = markMessageSent(arg1);
        console.log(JSON.stringify(lead, null, 2));
        break;
      }
      case 'status': {
        const lead = updateLeadStatus(arg1, arg2, process.argv[5]);
        console.log(JSON.stringify(lead, null, 2));
        break;
      }
      case 'list': {
        console.log(JSON.stringify(listLeads(arg1), null, 2));
        break;
      }
      case 'report':
      default: {
        console.log(JSON.stringify(dailyReport(), null, 2));
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
