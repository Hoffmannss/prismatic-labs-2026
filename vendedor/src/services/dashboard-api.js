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
const url = require('url');
const { spawn } = require('child_process');
const { loadJSON, saveJSON, readText } = require('../utils/file-store');
const { loadGuardrails, validateAutopilotPayload, evaluateSendGuardrails } = require('../domain/guardrails');
const { buildDashboardStatsPayload } = require('./dashboard-contract');
const { loadQuotaStore, buildQuotaSnapshot, checkQuota, recordQuotaEvent } = require('../domain/quota-policy');

const PORT = parseInt(process.argv[2], 10) || 3131;
const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(VENDEDOR_ROOT, 'data');
const HTML_FILE = path.join(VENDEDOR_ROOT, 'public', 'dashboard.html');
const SETTINGS_FILE = path.join(VENDEDOR_ROOT, 'config', 'dashboard-settings.json');
const THEMES_FILE = path.join(VENDEDOR_ROOT, 'config', 'dashboard-themes.json');
const LEARNING_FILE = path.join(DATA_DIR, 'learning', 'style-memory.json');
const AUTOPILOT_ENTRY = path.join(VENDEDOR_ROOT, 'src', 'core', 'autopilot.js');

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

function startAutopilot({ nicho, qtd, maxAnalyze }) {
  const child = spawn('node', [AUTOPILOT_ENTRY, nicho, String(qtd), String(maxAnalyze)], {
    cwd: VENDEDOR_ROOT,
    env: process.env,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
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
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

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

      const guardrails = loadGuardrails();
      const lead = loadDB().leads.find((item) => item.username === username);
      if (!lead) return json(res, { ok: false, error: `Lead @${username} nao encontrado` }, 404);

      let quotaKind = null;
      if (actionMap[action] === 'enviada') {
        const guardrailCheck = evaluateSendGuardrails(lead, guardrails);
        if (!guardrailCheck.ok) {
          return json(res, {
            ok: false,
            error: 'Envio bloqueado por guardrails.',
            details: guardrailCheck.errors,
            guardrails: guardrailCheck.guardrails
          }, 400);
        }

        quotaKind = lead.primeira_mensagem_enviada || Number(lead.followups_enviados || 0) > 0 ? 'followup' : 'send';
        const quotaCheck = checkQuota(quotaKind, 1, guardrails, loadQuotaStore());
        if (!quotaCheck.ok) {
          return json(res, {
            ok: false,
            error: `Quota diaria excedida para ${quotaKind}.`,
            quota: quotaCheck,
            guardrails
          }, 400);
        }
      }

      const result = updateOutcome(username, actionMap[action], extra);
      let quota = null;
      if (quotaKind) {
        quota = recordQuotaEvent(quotaKind, {
          amount: 1,
          metadata: {
            username,
            score: Number(lead.score || 0),
            status: lead.status_canonical || lead.status
          }
        });
      }

      return json(res, { ok: true, data: result, quota });
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

    startAutopilot(validation.sanitized);
    const quota = recordQuotaEvent('autopilot', {
      amount: 1,
      metadata: validation.sanitized
    });

    return json(res, {
      ok: true,
      message: `Autopilot iniciado: ${validation.sanitized.nicho} | qtd:${validation.sanitized.qtd} | max:${validation.sanitized.maxAnalyze}`,
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
