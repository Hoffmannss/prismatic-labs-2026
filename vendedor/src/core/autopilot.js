#!/usr/bin/env node
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { saveJSON } = require('../utils/file-store');
const { withRetry, sleep } = require('../utils/retry');
const { canExecute, recordCircuitSuccess, recordCircuitFailure } = require('../utils/circuit-breaker');
const { loadGuardrails, validateAutopilotPayload } = require('../domain/guardrails');
const { recordQuotaEvent } = require('../domain/quota-policy');

const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const { NICHOS } = require(path.join(VENDEDOR_ROOT, '6-scout.js'));

const APIFY = process.env.APIFY_API_TOKEN;
const REQUESTED_NICHO = process.argv[2] || process.env.AUTOPILOT_NICHO || 'api-automacao';
const REQUESTED_QTD = parseInt(process.argv[3] || process.env.AUTOPILOT_QTD || '20', 10);
const REQUESTED_MAX_ANALYZE = parseInt(process.argv[4] || process.env.AUTOPILOT_MAX_ANALYZE || '10', 10);
const SYNC_NOTION = (process.env.AUTOPILOT_SYNC_NOTION || 'true').toLowerCase() === 'true';
const GUARDRAILS = loadGuardrails();
const CIRCUIT_POLICY = {
  failureThreshold: GUARDRAILS.retry_max_attempts,
  cooldownMs: GUARDRAILS.retry_base_delay_ms * 20
};

const DATA_DIR = path.join(VENDEDOR_ROOT, 'data');
const SCOUT_DIR = path.join(DATA_DIR, 'scout');
const ORCHESTRATOR_ENTRY = path.join(VENDEDOR_ROOT, 'src', 'core', 'orchestrator.js');
const NOTION_SYNC_ENTRY = path.join(VENDEDOR_ROOT, 'src', 'services', 'notion-sync.js');
const STRUCTURED_LEARNER = path.join(VENDEDOR_ROOT, 'src', 'agents', 'learner.js');
const DB_FILE = path.join(DATA_DIR, 'crm', 'leads-database.json');

const C = {
  reset:'\x1b[0m', bright:'\x1b[1m', green:'\x1b[32m',
  yellow:'\x1b[33m', red:'\x1b[31m', cyan:'\x1b[36m',
  magenta:'\x1b[35m', blue:'\x1b[34m'
};

function apiRequest(method, host, requestPath, body, tokenQ) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const qs = tokenQ ? `?token=${tokenQ}` : '';
    const req = https.request({
      hostname: host,
      path: requestPath + qs,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function logRetry({ attempt, attempts, delay, label, error }) {
  console.log(`${C.yellow}[RETRY] ${label} falhou na tentativa ${attempt}/${attempts}: ${error.message}. Backoff ${delay}ms.${C.reset}`);
}

function requestWithRetry(method, host, requestPath, body, tokenQ, label) {
  return withRetry(
    () => apiRequest(method, host, requestPath, body, tokenQ),
    {
      attempts: GUARDRAILS.retry_max_attempts,
      baseDelayMs: GUARDRAILS.retry_base_delay_ms,
      label,
      onRetry: logRetry
    }
  );
}

async function guardedExternalOperation(name, task, options = {}) {
  const circuit = canExecute(name, CIRCUIT_POLICY);
  if (!circuit.ok) {
    const error = new Error(`Circuit breaker aberto para ${name}. Retry em ${circuit.retry_after_ms}ms.`);
    if (options.softFail) {
      console.log(`${C.yellow}[CIRCUIT] ${error.message}${C.reset}`);
      return null;
    }
    throw error;
  }

  try {
    const result = await task();
    recordCircuitSuccess(name, { metadata: { label: name } });
    return result;
  } catch (error) {
    const state = recordCircuitFailure(name, {
      policy: CIRCUIT_POLICY,
      error,
      metadata: { label: name }
    });
    if (options.softFail) {
      console.log(`${C.yellow}[CIRCUIT] ${name} falhou; consecutive_failures=${state.consecutive_failures}.${C.reset}`);
      return null;
    }
    throw error;
  }
}

function loadCRMUsernames() {
  if (!fs.existsSync(DB_FILE)) return new Set();
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  return new Set((db.leads || []).map((lead) => (lead.username || '').toLowerCase()).filter(Boolean));
}

async function startRun(actorId, input) {
  const res = await requestWithRetry('POST', 'api.apify.com', `/v2/acts/${actorId}/runs`, input, APIFY, `apify-start:${actorId}`);
  if (res.status !== 201 && res.status !== 200) throw new Error(`Apify startRun ${actorId}: ${JSON.stringify(res.body)}`);
  return res.body.data.id;
}

async function waitRun(runId, maxMinutes = 8) {
  const maxPolls = maxMinutes * 12;
  for (let i = 0; i < maxPolls; i += 1) {
    await sleep(5000);
    const res = await requestWithRetry('GET', 'api.apify.com', `/v2/actor-runs/${runId}`, null, APIFY, `apify-poll:${runId}`);
    const status = res.body?.data?.status;
    process.stdout.write('.');
    if (status === 'SUCCEEDED') { process.stdout.write('\n'); return true; }
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) { process.stdout.write('\n'); return false; }
  }
  process.stdout.write('\n');
  return false;
}

async function datasetItems(runId, limit) {
  const res = await requestWithRetry('GET', 'api.apify.com', `/v2/actor-runs/${runId}/dataset/items`, null, `${APIFY}&limit=${limit}`, `apify-dataset:${runId}`);
  if (res.status !== 200) return [];
  return Array.isArray(res.body) ? res.body : (res.body.items || []);
}

async function scrapeByHashtags(hashtags, resultsLimit) {
  console.log('  Actor: apify~instagram-hashtag-scraper');
  console.log(`  Hashtags: ${hashtags.join(', ')}`);
  const runId = await startRun('apify~instagram-hashtag-scraper', {
    hashtags: hashtags.map((tag) => tag.replace('#', '')),
    resultsLimit,
    proxy: { useApifyProxy: true }
  });
  console.log(`  Run ID: ${runId}`);
  process.stdout.write('  Aguardando ');
  const ok = await waitRun(runId);
  if (!ok) throw new Error('Hashtag scraper run falhou ou foi abortado');
  return datasetItems(runId, resultsLimit * 5);
}

async function scrapeProfiles(usernames) {
  console.log('  Actor: apify~instagram-profile-scraper');
  console.log(`  Perfis: ${usernames.length}`);
  const runId = await startRun('apify~instagram-profile-scraper', {
    usernames,
    resultsLimit: usernames.length,
    proxy: { useApifyProxy: true }
  });
  console.log(`  Run ID: ${runId}`);
  process.stdout.write('  Aguardando ');
  const ok = await waitRun(runId);
  if (!ok) throw new Error('Profile scraper run falhou ou foi abortado');
  return datasetItems(runId, usernames.length * 2);
}

function runAnalyze(username, bio, followers, posts, postsDesc) {
  const args = [
    ORCHESTRATOR_ENTRY,
    'analyze',
    '@' + username,
    bio || '',
    String(followers || 0),
    String(posts || 0),
    postsDesc || ''
  ];
  const result = spawnSync('node', args, { stdio: 'inherit', cwd: VENDEDOR_ROOT, env: process.env });
  return result.status === 0;
}

async function runCommandWithRetry(label, entry, args = []) {
  return withRetry(async () => {
    const result = spawnSync('node', [entry, ...args], { stdio: 'inherit', cwd: VENDEDOR_ROOT, env: process.env });
    if (result.status !== 0) throw new Error(`${label} retornou status ${result.status}`);
    return true;
  }, {
    attempts: GUARDRAILS.retry_max_attempts,
    baseDelayMs: GUARDRAILS.retry_base_delay_ms,
    label,
    onRetry: logRetry
  });
}

function pickPostsDesc(config, caption) {
  const compact = (caption || '').replace(/\s+/g, ' ').trim().slice(0, 350);
  return [
    `post recente indica contexto do nicho (${config.nome})`,
    `dor alvo: ${config.dor_principal}`,
    compact ? `caption: ${compact}` : null
  ].filter(Boolean).join(' | ');
}

async function main() {
  if (!APIFY) {
    console.error(`${C.red}[AUTOPILOT] APIFY_API_TOKEN ausente no .env${C.reset}`);
    process.exit(1);
  }

  const validation = validateAutopilotPayload({
    nicho: REQUESTED_NICHO,
    qtd: REQUESTED_QTD,
    maxAnalyze: REQUESTED_MAX_ANALYZE
  }, GUARDRAILS);

  if (!validation.ok) {
    console.error(`${C.red}[AUTOPILOT] Bloqueado por guardrails:${C.reset}`);
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  const { nicho: NICHO, qtd: QTD, maxAnalyze: MAX_ANALYZE } = validation.sanitized;
  const config = NICHOS[NICHO];
  if (!config) {
    console.error(`${C.red}[AUTOPILOT] Nicho invalido: "${NICHO}"${C.reset}`);
    console.log('Nichos disponiveis:', Object.keys(NICHOS).join(' | '));
    process.exit(1);
  }

  if (!fs.existsSync(SCOUT_DIR)) fs.mkdirSync(SCOUT_DIR, { recursive: true });

  console.log(`\n${C.magenta}${'='.repeat(64)}${C.reset}`);
  console.log(`${C.bright}  AUTOPILOT — ${config.nome}${C.reset}`);
  console.log(`${C.magenta}${'='.repeat(64)}${C.reset}`);
  console.log(`  Meta: ${QTD} leads  |  Max analyze: ${MAX_ANALYZE}  |  Notion: ${SYNC_NOTION}`);
  console.log(`  Retry: ${GUARDRAILS.retry_max_attempts} tentativas  |  Base delay: ${GUARDRAILS.retry_base_delay_ms}ms`);

  const existingUsernames = loadCRMUsernames();
  console.log(`  Leads ja no CRM (skip): ${existingUsernames.size}\n`);

  console.log(`${C.cyan}[1/5] Scraping hashtags via Apify...${C.reset}`);
  const posts = await guardedExternalOperation('apify-hashtag-scraper', () => scrapeByHashtags(config.hashtags.slice(0, 4), QTD * 6));
  console.log(`  Posts coletados: ${posts.length}`);

  const uniqueCandidates = new Map();
  for (const post of posts) {
    const username = (post.ownerUsername || '').toLowerCase().trim();
    if (!username || existingUsernames.has(username)) continue;
    if (!uniqueCandidates.has(username)) {
      uniqueCandidates.set(username, { username, caption: post.caption || '', ts: post.timestamp || '' });
    }
  }
  console.log(`  Usernames novos (nao estao no CRM): ${uniqueCandidates.size}`);

  const candidates = Array.from(uniqueCandidates.values()).slice(0, Math.max(QTD * 2, MAX_ANALYZE * 3));
  const usernames = candidates.map((candidate) => candidate.username);
  if (usernames.length === 0) {
    console.log(`${C.yellow}  Nenhum candidato novo encontrado. Tente outro nicho ou aumente QTD.${C.reset}`);
    process.exit(0);
  }

  console.log(`\n${C.cyan}[2/5] Enriquecendo ${usernames.length} perfis (bio, followers, posts)...${C.reset}`);
  const profiles = await guardedExternalOperation('apify-profile-scraper', () => scrapeProfiles(usernames));

  const profileMap = new Map();
  for (const profile of profiles) {
    const username = (profile.username || profile.ownerUsername || '').toLowerCase().trim();
    if (!username) continue;
    profileMap.set(username, {
      bio: profile.biography || profile.bio || '',
      followers: profile.followersCount || profile.followers || 0,
      posts: profile.postsCount || profile.posts || 0
    });
  }
  console.log(`  Perfis enriquecidos: ${profileMap.size}`);

  const queue = [];
  for (const candidate of candidates) {
    const profile = profileMap.get(candidate.username) || { bio: '', followers: 0, posts: 0 };
    queue.push({
      username: candidate.username,
      bio: profile.bio,
      followers: profile.followers,
      posts: profile.posts,
      postsDesc: pickPostsDesc(config, candidate.caption)
    });
    if (queue.length >= QTD) break;
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const outFile = path.join(SCOUT_DIR, `autopilot-${dateStr}-${NICHO}.json`);
  saveJSON(outFile, { nicho: NICHO, date: dateStr, total: queue.length, queue });
  console.log(`  Queue salva: ${outFile}`);

  console.log(`\n${C.cyan}[3/5] Analyze (orchestrator) em ${Math.min(queue.length, MAX_ANALYZE)} leads...${C.reset}`);
  const toAnalyze = queue.slice(0, MAX_ANALYZE);
  let okCount = 0;
  for (let i = 0; i < toAnalyze.length; i += 1) {
    const lead = toAnalyze[i];
    console.log(`\n${C.bright}[${i + 1}/${toAnalyze.length}] @${lead.username}${C.reset} | ${lead.followers} followers`);
    const ok = runAnalyze(lead.username, lead.bio, lead.followers, lead.posts, lead.postsDesc);
    if (ok) okCount += 1;
    await sleep(400);
  }

  recordQuotaEvent('autopilot', { amount: 1, metadata: { nicho: NICHO, qtd: QTD, maxAnalyze: MAX_ANALYZE } });
  if (okCount > 0) {
    recordQuotaEvent('analyze', { amount: okCount, metadata: { nicho: NICHO } });
  }

  console.log(`\n${C.green}  Analyze concluido: ${okCount}/${toAnalyze.length} ok${C.reset}`);

  if (SYNC_NOTION) {
    console.log(`\n${C.cyan}[4/5] Sincronizando com Notion...${C.reset}`);
    await guardedExternalOperation('notion-sync', () => runCommandWithRetry('notion-sync', NOTION_SYNC_ENTRY, ['sync']), { softFail: true });
  } else {
    console.log(`\n${C.yellow}[4/5] Notion sync pulado (AUTOPILOT_SYNC_NOTION=false)${C.reset}`);
  }

  console.log(`\n${C.blue}[5/5] Atualizando memoria de aprendizado estruturada...${C.reset}`);
  await guardedExternalOperation('structured-learner', async () => {
    const { runLearner } = require(STRUCTURED_LEARNER);
    return withRetry(() => runLearner(), {
      attempts: GUARDRAILS.retry_max_attempts,
      baseDelayMs: GUARDRAILS.retry_base_delay_ms,
      label: 'structured-learner',
      onRetry: logRetry
    });
  }, { softFail: true });

  console.log(`\n${C.magenta}${'='.repeat(64)}${C.reset}`);
  console.log(`${C.bright}  AUTOPILOT CONCLUIDO${C.reset}`);
  console.log(`  ✓ ${queue.length} leads na queue`);
  console.log(`  ✓ ${okCount} analisados e salvos no CRM estruturado`);
  console.log('  ✓ Memoria de aprendizado estruturada atualizada');
  console.log('  → Abra o dashboard: node src/services/dashboard-api.js');
  console.log('    http://localhost:3131');
  console.log(`${C.magenta}${'='.repeat(64)}${C.reset}\n`);
}

main().catch((error) => {
  console.error(`\n${C.red}[AUTOPILOT ERROR]${C.reset}`, error.message);
  process.exit(1);
});
