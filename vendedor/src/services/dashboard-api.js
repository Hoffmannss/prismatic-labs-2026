#!/usr/bin/env node
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');
const {
  loadDB,
  dailyReport,
  updateLeadStatus,
  listLeads,
  normalizeStatus
} = require('../core/tracker');

const PORT = parseInt(process.argv[2], 10) || 3131;
const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(VENDEDOR_ROOT, 'data');
const HTML_FILE = path.join(VENDEDOR_ROOT, 'public', 'dashboard.html');
const SETTINGS_FILE = path.join(VENDEDOR_ROOT, 'config', 'dashboard-settings.json');
const THEMES_FILE = path.join(VENDEDOR_ROOT, 'config', 'dashboard-themes.json');
const TRACKER_DIR = path.join(DATA_DIR, 'tracker');
const LEARNING_FILE = path.join(DATA_DIR, 'learning', 'style-memory.json');
const AUTOPILOT_ENTRY = path.join(VENDEDOR_ROOT, 'src', 'core', 'autopilot.js');
const LEGACY_TRACKER_ENTRY = path.join(VENDEDOR_ROOT, '12-tracker.js');

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function loadJSON(file, fallback) {
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLeadMessages(username) {
  return loadJSON(path.join(DATA_DIR, 'mensagens', `${username}_mensagens.json`), null);
}

function getLegacyTracker(username) {
  return loadJSON(path.join(TRACKER_DIR, `${username}_tracker.json`), null);
}

function enrichLead(lead) {
  const msg = getLeadMessages(lead.username);
  const tracker = getLegacyTracker(lead.username);
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
    tracker: tracker || null,
    outcome: tracker?.outcome || null,
    dm_enviada: tracker?.dm_enviada || false
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

function runLegacyTracker(args) {
  return new Promise((resolve) => {
    const child = spawn('node', [LEGACY_TRACKER_ENTRY, ...args], {
      cwd: VENDEDOR_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => stdout += chunk.toString());
    child.stderr.on('data', (chunk) => stderr += chunk.toString());
    child.on('close', (code) => resolve({ ok: code === 0, out: stdout, err: stderr }));
  });
}

function startAutopilot({ nicho, qtd, maxAnalyze }) {
  const child = spawn('node', [AUTOPILOT_ENTRY, nicho, String(qtd), String(maxAnalyze)], {
    cwd: VENDEDOR_ROOT,
    env: process.env,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'OPTIONS') return json(res, {});

  if (req.method === 'GET' && pathname === '/') {
    const html = fs.existsSync(HTML_FILE)
      ? fs.readFileSync(HTML_FILE, 'utf8')
      : '<h1>dashboard.html nao encontrado</h1>';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (req.method === 'GET' && pathname === '/api/leads') {
    const db = loadDB();
    const leads = (db.leads || []).map(enrichLead);
    return json(res, { leads, total: leads.length, updated_at: db.updated_at });
  }

  if (req.method === 'GET' && pathname === '/api/settings') {
    return json(res, loadJSON(SETTINGS_FILE, {}));
  }

  if (req.method === 'POST' && pathname === '/api/settings') {
    const body = await bodyJSON(req);
    const current = loadJSON(SETTINGS_FILE, {});
    const updated = { ...current, ...body };
    saveJSON(SETTINGS_FILE, updated);
    return json(res, { ok: true, settings: updated });
  }

  if (req.method === 'GET' && pathname === '/api/themes') {
    return json(res, loadJSON(THEMES_FILE, { themes: [] }));
  }

  if (req.method === 'GET' && pathname === '/api/learning') {
    return json(res, loadJSON(LEARNING_FILE, null));
  }

  if (req.method === 'POST' && pathname === '/api/tracker') {
    const { username, action, extra } = await bodyJSON(req);
    if (!username || !action) {
      return json(res, { ok: false, error: 'username e action obrigatorios' }, 400);
    }
    const args = [action, username];
    if (extra !== undefined && extra !== null) args.push(String(extra));
    const result = await runLegacyTracker(args);
    return json(res, result, result.ok ? 200 : 500);
  }

  if (req.method === 'POST' && pathname === '/api/autopilot') {
    const body = await bodyJSON(req);
    const settings = loadJSON(SETTINGS_FILE, {});
    const nicho = body.nicho || settings.autopilotDefaults?.nicho || 'api-automacao';
    const qtd = body.qtd || settings.autopilotDefaults?.qtd || 20;
    const maxAnalyze = body.maxAnalyze || settings.autopilotDefaults?.maxAnalyze || 8;
    startAutopilot({ nicho, qtd, maxAnalyze });
    return json(res, { ok: true, message: `Autopilot iniciado: ${nicho} | qtd:${qtd} | max:${maxAnalyze}` });
  }

  if (req.method === 'POST' && pathname === '/api/lead/status') {
    const { username, status, nota } = await bodyJSON(req);
    if (!username || !status) {
      return json(res, { ok: false, error: 'username e status obrigatorios' }, 400);
    }
    try {
      const lead = updateLeadStatus(username, status, nota);
      return json(res, { ok: true, lead });
    } catch (error) {
      return json(res, { ok: false, error: error.message }, 400);
    }
  }

  if (req.method === 'GET' && pathname === '/api/stats') {
    const { db, pipeline } = dailyReport();
    const leads = listLeads();
    const byPriority = { hot: 0, warm: 0, cold: 0 };
    const byOutcome = { enviada: 0, respondeu: 0, ignorou: 0, negociando: 0, converteu: 0 };
    let totalValue = 0;

    leads.forEach((lead) => {
      if (lead.prioridade in byPriority) byPriority[lead.prioridade] += 1;
      const legacyTracker = getLegacyTracker(lead.username);
      if (legacyTracker?.outcome && legacyTracker.outcome in byOutcome) byOutcome[legacyTracker.outcome] += 1;
      if (legacyTracker?.outcome === 'converteu' && legacyTracker?.valor) totalValue += Number(legacyTracker.valor) || 0;
    });

    const learning = loadJSON(LEARNING_FILE, null);
    return json(res, {
      total: db.leads.length,
      byPriority,
      byOutcome,
      totalValue,
      pipeline,
      learning: learning ? {
        versao: learning.versao,
        score_medio: learning.score_medio,
        total_amostras: learning.total_amostras
      } : null
    });
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
  console.log('            /api/tracker /api/autopilot /api/stats');
  console.log(`${C.m}${'='.repeat(52)}${C.r}\n`);
});
