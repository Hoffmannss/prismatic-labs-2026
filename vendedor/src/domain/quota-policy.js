const path = require('path');
const { loadJSON, saveJSON } = require('../utils/file-store');
const { loadGuardrails } = require('./guardrails');

const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const QUOTA_METRICS_FILE = path.join(VENDEDOR_ROOT, 'data', 'metrics', 'daily-quotas.json');

const DEFAULT_DAY_BUCKET = Object.freeze({
  sends: 0,
  followups: 0,
  autopilot_runs: 0,
  analyzed_leads: 0,
  last_events: []
});

const FIELD_BY_KIND = Object.freeze({
  send: 'sends',
  followup: 'followups',
  autopilot: 'autopilot_runs',
  analyze: 'analyzed_leads'
});

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadQuotaStore(file = QUOTA_METRICS_FILE) {
  return loadJSON(file, { days: {}, updated_at: null });
}

function saveQuotaStore(store, file = QUOTA_METRICS_FILE) {
  store.updated_at = new Date().toISOString();
  saveJSON(file, store);
  return store;
}

function ensureDayBucket(store, date = new Date()) {
  if (!store.days) store.days = {};
  const key = localDateKey(date);
  if (!store.days[key]) {
    store.days[key] = { ...DEFAULT_DAY_BUCKET };
  }
  return { key, bucket: store.days[key] };
}

function buildQuotaSnapshot(store = loadQuotaStore(), guardrails = loadGuardrails(), date = new Date()) {
  const { key, bucket } = ensureDayBucket(store, date);
  const limits = {
    sends: Number(guardrails.daily_send_quota || 0),
    followups: Number(guardrails.daily_followup_quota || 0)
  };

  return {
    date: key,
    usage: {
      sends: Number(bucket.sends || 0),
      followups: Number(bucket.followups || 0),
      autopilot_runs: Number(bucket.autopilot_runs || 0),
      analyzed_leads: Number(bucket.analyzed_leads || 0)
    },
    limits,
    remaining: {
      sends: Math.max(limits.sends - Number(bucket.sends || 0), 0),
      followups: Math.max(limits.followups - Number(bucket.followups || 0), 0)
    },
    last_events: Array.isArray(bucket.last_events) ? bucket.last_events.slice(0, 10) : [],
    updated_at: store.updated_at || null
  };
}

function checkQuota(kind, requested = 1, guardrails = loadGuardrails(), store = loadQuotaStore(), date = new Date()) {
  const snapshot = buildQuotaSnapshot(store, guardrails, date);
  let used = 0;
  let limit = null;

  if (kind === 'send') {
    used = snapshot.usage.sends;
    limit = snapshot.limits.sends;
  }

  if (kind === 'followup') {
    used = snapshot.usage.followups;
    limit = snapshot.limits.followups;
  }

  if (limit === null) {
    return {
      ok: true,
      kind,
      requested,
      used: 0,
      limit: null,
      remaining: null,
      next: requested,
      snapshot
    };
  }

  const next = used + requested;
  return {
    ok: next <= limit,
    kind,
    requested,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    next,
    snapshot
  };
}

function recordQuotaEvent(kind, { amount = 1, metadata = {}, date = new Date(), file = QUOTA_METRICS_FILE } = {}) {
  const field = FIELD_BY_KIND[kind];
  if (!field) throw new Error(`Quota kind invalido: ${kind}`);

  const store = loadQuotaStore(file);
  const { bucket } = ensureDayBucket(store, date);
  bucket[field] = Number(bucket[field] || 0) + Number(amount || 0);
  bucket.last_events = Array.isArray(bucket.last_events) ? bucket.last_events : [];
  bucket.last_events.unshift({
    timestamp: new Date().toISOString(),
    kind,
    amount: Number(amount || 0),
    metadata
  });
  bucket.last_events = bucket.last_events.slice(0, 50);
  saveQuotaStore(store, file);
  return buildQuotaSnapshot(store, loadGuardrails(), date);
}

module.exports = {
  QUOTA_METRICS_FILE,
  loadQuotaStore,
  saveQuotaStore,
  localDateKey,
  buildQuotaSnapshot,
  checkQuota,
  recordQuotaEvent
};
