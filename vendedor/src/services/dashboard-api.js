#!/usr/bin/env node
const {
  loadDB,
  dailyReport,
  updateLeadStatus,
  normalizeStatus,
  updateOutcome,
  listTrackingQueue,
  getPendingTracking,
  getOutcomeStats
} = require('../core/tracker');
require('dotenv').config();
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const { loadJSON, saveJSON, readText } = require('../utils/file-store');
const { loadGuardrails, validateAutopilotPayload } = require('../domain/guardrails');
const { buildDashboardStatsPayload } = require('./dashboard-contract');
const { loadQuotaStore, buildQuotaSnapshot, recordQuotaEvent } = require('../domain/quota-policy');

const PORT = parseInt(process.argv[2], 10) || 3131;
const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(VENDEDOR_ROOT, 'data');
const METRICS_DIR = path.join(DATA_DIR, 'metrics');
const HTML_FILE = path.join(VENDEDOR_ROOT, 'public', 'dashboard.html');
const SETTINGS_FILE = path.join(VENDEDOR_ROOT, 'config', 'dashboard-settings.json');
const THEMES_FILE = path.join(VENDEDOR_ROOT, 'config', 'dashboard-themes.json');
const LEARNING_FILE = path.join(DATA_DIR, 'learning', 'style-memory.json');
const AUTOPILOT_ENTRY = path.join(VENDEDOR_ROOT, 'src', 'core', 'autopilot.js');
const AUTOPILOT_RUNS_FILE = path.join(METRICS_DIR, 'autopilot-runs.json');

if (!fs.existsSync(METRICS_DIR)) fs.mkdirSync(METRICS_DIR, { recursive: true });

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function getLeadMessages(username) {
  return loadJSON(path.join(DATA_DIR, 'mensagens', `${username}_mensagens.json`), null);
}

function enrichLead(lead) {
  const msg = getLeadMessages(lead.username);
  const tracking = msg?.tracking || null;
  return {
    ...lead,
    status_canonical: normalizeStatus(lead.status_canonical || lead.status),
    mensagem_final: msg?.revisao?.mensagem_final || msg?.mensagens?.mensagem1?.texto || null,
    mensagem_original: msg?.revisao?.mensagem_original || null,
    score_reviewer: msg?.revisao?.score || null,
    followups: msg ? [
      msg.followup_dia3 ? { dia: 3, texto: msg.followup_dia3 } : null,
      msg.followup_dia7 ? { dia: 7, texto: msg.followup_dia7 } : null,
      msg.followup_dia14 ? { dia: 14, texto: msg.followup_dia14 } : null
    ].filter(Boolean) : [],
    tracker: tracking,
    outcome: tracking?.outcome || null,
    dm_enviada: tracking?.outcome === 'enviada' || Boolean(tracking?.data_envio)
  };
}

function bodyJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function loadAutopilotRuns() {
  return loadJSON(AUTOPILOT_RUNS_FILE, { last_run: null, history: [] });
}

function saveAutopilotRuns(data) {
  saveJSON(AUTOPILOT_RUNS_FILE, data);
}

function generateRunId() {
  return `run_${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')}`;
}

function recordAutopilotStart(runId, params) {
  const runs = loadAutopilotRuns();
  const run = {
    run_id: runId,
    started_at: new Date().toISOString(),
    finished_at: null,
    status: 'running',
    nicho: params.nicho,
    qtd_requested: params.qtd,
    qtd_queued: null,
    analyzed: null,
    errors: 0,
    notion_synced: null,
    learner_updated: null,
    triggered_by: 'dashboard'
  };
  runs.last_run = run;
  runs.history.unshift({ ...run });
  if (runs.history.length > 20) runs.history = runs.history.slice(0, 20);
  saveAutopilotRuns(runs);
  return run;
}

function startAutopilot({ nicho, qtd, maxAnalyze }, runId) {
  const isWindows = process.platform === 'win32';
  const child = spawn('node', [AUTOPILOT_ENTRY, nicho, String(qtd), String(maxAnalyze), runId], {
    cwd: VENDEDOR_ROOT,
    env: { ...process.env, AUTOPILOT_RUN_ID: runId },
    detached: !isWindows,
    stdio: isWindows ? 'inherit' : 'ignore'
  });
  if (!isWindows) child.unref();
}

function getAutopilotStatus() {
  const runs = loadAutopilotRuns();
  const lastRun = runs.last_run;
  const isRunning = lastRun && lastRun.started_at && !lastRun.finished_at;
  return {
    has_run: Boolean(lastRun),
    is_running: isRunning,
    last_run: lastRun ? {
      run_id: lastRun.run_id,
      started_at: lastRun.started_at,
      finished_at: lastRun.finished_at,
      status: lastRun.status,
      nicho: lastRun.nicho,
      analyzed: lastRun.analyzed,
      errors: lastRun.errors
    } : null,
    history: runs.history.slice(0, 5).map((run) => ({
      run_id: run.run_id,
      started_at: run.started_at,
      status: run.status,
      nicho: run.nicho,
      analyzed: run.analyzed
    }))
  };
}

const actionMap = {
  sent: 'enviada',
  enviada: 'enviada',
  respondeu: 'respondeu',
  ignorou: 'ignorou',
  negociando: 'negociando',
  converteu: 'converteu',
  recusou: 'recusou'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') return json(res, {});

  if (req.method === 'GET' && pathname === '/') {
    const html = readText(HTML_FILE, '<h1>dashboard.html nao encontrado</h1>');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (req.method === 'GET' && pathname === '/api/leads') {
    const db = loadDB();
    const leads = (db.leads || []).map(enrichLead);
    return json(res, { leads, total: leads.length, updated_at: db.updated_at });
  }

  if (req.method === 'GET' && pathname === '/api/settings') return json(res, loadJSON(SETTINGS_FILE, {}));
  if (req.method === 'GET' && pathname === '/api/themes') return json(res, loadJSON(THEMES_FILE, { themes: [] }));
  if (req.method === 'GET' && pathname === '/api/learning') return json(res, loadJSON(LEARNING_FILE, null));
  if (req.method === 'GET' && pathname === '/api/guardrails') return json(res, loadGuardrails());
  if (req.method === 'GET' && pathname === '/api/quotas') return json(res, buildQuotaSnapshot(loadQuotaStore(), loadGuardrails()));
  if (req.method === 'GET' && pathname === '/api/autopilot/status') return json(res, getAutopilotStatus());

  if (req.method === 'POST' && pathname === '/api/settings') {
    const body = await bodyJSON(req);
    const current = loadJSON(SETTINGS_FILE, {});
    const updated = { ...current, ...body };
    saveJSON(SETTINGS_FILE, updated);
    return json(res, { ok: true, settings: updated });
  }

  if (req.method === 'POST' && pathname === '/api/tracker') {
    const { username, action, extra } = await bodyJSON(req);
    try {
      if (action === 'list') return json(res, { ok: true, data: listTrackingQueue() });
      if (action === 'pending') return json(res, { ok: true, data: getPendingTracking() });
      if (action === 'stats') return json(res, { ok: true, data: getOutcomeStats() });
      if (!username || !actionMap[action]) return json(res, { ok: false, error: 'action invalida ou username ausente' }, 400);
      return json(res, { ok: true, data: updateOutcome(username, actionMap[action], extra) });
    } catch (error) {
      return json(res, { ok: false, error: error.message }, 400);
    }
  }

  if (req.method === 'POST' && pathname === '/api/autopilot') {
    const body = await bodyJSON(req);
    const settings = loadJSON(SETTINGS_FILE, {});
    const requested = {
      nicho: body.nicho || settings.autopilotDefaults?.nicho || 'api-automacao',
      qtd: body.qtd || settings.autopilotDefaults?.qtd || 20,
      maxAnalyze: body.maxAnalyze || settings.autopilotDefaults?.maxAnalyze || 8
    };

    const guardrails = loadGuardrails();
    const validation = validateAutopilotPayload(requested, guardrails);
    if (!validation.ok) {
      return json(res, {
        ok: false,
        error: 'Autopilot bloqueado por guardrails.',
        details: validation.errors,
        guardrails,
        requested,
        sanitized: validation.sanitized
      }, 400);
    }

    const runId = generateRunId();
    recordAutopilotStart(runId, validation.sanitized);
    startAutopilot(validation.sanitized, runId);
    const quota = recordQuotaEvent('autopilot', {
      amount: 1,
      metadata: validation.sanitized
    });

    return json(res, {
      ok: true,
      run_id: runId,
      message: `Autopilot iniciado: ${validation.sanitized.nicho} | qtd:${validation.sanitized.qtd} | max:${validation.sanitized.maxAnalyze}`,
      params: validation.sanitized,
      guardrails,
      quota
    });
  }

  if (req.method === 'POST' && pathname === '/api/lead/status') {
    const { username, status, nota } = await bodyJSON(req);
    if (!username || !status) return json(res, { ok: false, error: 'username e status obrigatorios' }, 400);
    try {
      return json(res, { ok: true, lead: updateLeadStatus(username, status, nota) });
    } catch (error) {
      return json(res, { ok: false, error: error.message }, 400);
    }
  }

  if (req.method === 'GET' && pathname === '/api/stats') {
    const { db, pipeline } = dailyReport();
    const learning = loadJSON(LEARNING_FILE, null);
    const guardrails = loadGuardrails();
    const quotas = buildQuotaSnapshot(loadQuotaStore(), guardrails);
    return json(res, buildDashboardStatsPayload({ db, pipeline, learning, guardrails, quotas }));
  }

  return json(res, { error: 'Not found' }, 404);
});

server.listen(PORT, () => {
  const C = { r: '\x1b[0m', b: '\x1b[1m', m: '\x1b[35m', c: '\x1b[36m' };
  console.log(`\n${C.m}${'='.repeat(52)}${C.r}`);
  console.log(`${C.b}  DASHBOARD COCKPIT - Prismatic Labs${C.r}`);
  console.log(`${C.m}${'='.repeat(52)}${C.r}`);
  console.log(`  URL     : ${C.c}http://localhost:${PORT}${C.r}`);
  console.log('  APIs    : /api/leads /api/settings /api/themes');
  console.log('            /api/tracker /api/autopilot /api/stats /api/guardrails /api/quotas');
  console.log(`${C.m}${'='.repeat(52)}${C.r}\n`);
});
