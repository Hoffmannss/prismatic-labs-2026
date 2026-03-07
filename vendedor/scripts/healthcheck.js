#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { loadJSON } = require('../src/utils/file-store');

const ROOT = path.resolve(__dirname, '..');
const requiredFiles = [
  'config/guardrails.json',
  'public/dashboard.html'
];
const requiredDirs = [
  'data/crm',
  'data/leads',
  'data/mensagens',
  'data/metrics',
  'data/learning'
];

function checkPath(relativePath, kind) {
  const full = path.join(ROOT, relativePath);
  const exists = fs.existsSync(full);
  return {
    ok: exists,
    message: exists ? `${kind} ok: ${relativePath}` : `${kind} ausente: ${relativePath}`
  };
}

function checkQuotaStore() {
  const full = path.join(ROOT, 'data', 'metrics', 'daily-quotas.json');
  const data = loadJSON(full, { days: {} });
  const ok = typeof data === 'object' && data !== null && typeof data.days === 'object';
  return {
    ok,
    message: ok ? 'quota store carregavel' : 'quota store invalido'
  };
}

function checkCircuitStore() {
  const full = path.join(ROOT, 'data', 'metrics', 'integration-circuit-breakers.json');
  const data = loadJSON(full, { circuits: {} });
  const ok = typeof data === 'object' && data !== null && typeof data.circuits === 'object';
  return {
    ok,
    message: ok ? 'circuit breaker store carregavel' : 'circuit breaker store invalido'
  };
}

function checkEnv() {
  const checks = [];
  checks.push(Boolean(process.env.GROQ_API_KEY)
    ? { ok: true, message: 'GROQ_API_KEY configurado' }
    : { ok: false, message: 'GROQ_API_KEY ausente' });

  const autopilotEnabled = String(process.env.AUTOPILOT_ENABLED || 'true').toLowerCase() !== 'false';
  if (autopilotEnabled) {
    checks.push(Boolean(process.env.APIFY_API_TOKEN)
      ? { ok: true, message: 'APIFY_API_TOKEN configurado' }
      : { ok: false, message: 'APIFY_API_TOKEN ausente com autopilot habilitado' });
  }

  return checks;
}

(function main() {
  const checks = [];
  requiredDirs.forEach((dir) => checks.push(checkPath(dir, 'diretorio')));
  requiredFiles.forEach((file) => checks.push(checkPath(file, 'arquivo')));
  checks.push(checkQuotaStore());
  checks.push(checkCircuitStore());
  checks.push(...checkEnv());

  const failed = checks.filter((item) => !item.ok);
  checks.forEach((item) => {
    const prefix = item.ok ? '✓' : '✗';
    console.log(`${prefix} ${item.message}`);
  });

  if (failed.length) {
    console.error(`\nHealthcheck falhou com ${failed.length} erro(s).`);
    process.exit(1);
  }

  console.log('\nHealthcheck operacional concluido sem erros.');
})();
