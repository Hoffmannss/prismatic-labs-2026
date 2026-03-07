#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ROOT = path.resolve(__dirname, '..');
const strict = process.argv.includes('--strict');
const requiredDirs = [
  'data/crm',
  'data/leads',
  'data/mensagens',
  'data/metrics',
  'data/relatorios',
  'data/tracker',
  'data/learning',
  'config',
  'public',
  'src'
];

function hasValue(name) {
  return Boolean(process.env[name] && String(process.env[name]).trim());
}

function anyValue(names) {
  return names.some(hasValue);
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function fail(message) {
  console.error(`✗ ${message}`);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

function warn(message) {
  console.warn(`! ${message}`);
}

function ensureDirs() {
  requiredDirs.forEach((dir) => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
    ok(`Diretorio pronto: ${dir}`);
  });
}

function validateNode(errors) {
  const major = Number(process.versions.node.split('.')[0]);
  if (Number.isNaN(major) || major < 18) {
    errors.push(`Node ${process.versions.node} detectado; minimo exigido: 18.`);
    return;
  }
  ok(`Node compatível: ${process.versions.node}`);
}

function validateEnv(errors, warnings) {
  const envFile = path.join(ROOT, '.env');
  if (!fs.existsSync(envFile)) warnings.push('.env nao encontrado; usando apenas variaveis do ambiente atual.');
  else ok('.env encontrado');

  if (!hasValue('GROQ_API_KEY')) {
    errors.push('GROQ_API_KEY ausente; analyzer/copywriter nao devem ser tratados como prontos para producao sem isso.');
  } else {
    ok('GROQ_API_KEY configurado');
  }

  const autopilotEnabled = parseBool(process.env.AUTOPILOT_ENABLED, true);
  if (autopilotEnabled) {
    if (!hasValue('APIFY_API_TOKEN')) errors.push('APIFY_API_TOKEN ausente com autopilot habilitado.');
    else ok('APIFY_API_TOKEN configurado');
  } else {
    warnings.push('AUTOPILOT_ENABLED=false; autopilot ficará desabilitado neste ambiente.');
  }

  const notionSyncEnabled = parseBool(process.env.AUTOPILOT_SYNC_NOTION, true);
  if (notionSyncEnabled && !anyValue(['NOTION_API_KEY', 'NOTION_TOKEN', 'NOTION_SECRET'])) {
    warnings.push('Sync com Notion habilitado, mas nenhuma credencial comum foi detectada (NOTION_API_KEY, NOTION_TOKEN ou NOTION_SECRET).');
  } else if (notionSyncEnabled) {
    ok('Credencial de Notion detectada');
  }

  if (!hasValue('PORT')) warnings.push('PORT nao definido; dashboard usara a porta padrao do processo.');
  else ok(`PORT configurada: ${process.env.PORT}`);
}

(function main() {
  const errors = [];
  const warnings = [];

  console.log('\n[VENDEDOR AI] Preflight operacional\n');
  validateNode(errors);
  ensureDirs();
  validateEnv(errors, warnings);

  warnings.forEach(warn);
  if (errors.length) {
    errors.forEach(fail);
    console.error(`\nPreflight falhou com ${errors.length} erro(s).`);
    process.exit(1);
  }

  if (strict && warnings.length) {
    warnings.forEach((message) => fail(`STRICT: ${message}`));
    console.error(`\nReadiness estrito falhou com ${warnings.length} aviso(s).`);
    process.exit(1);
  }

  console.log(`\nPreflight concluido sem erros${warnings.length ? `, com ${warnings.length} aviso(s)` : ''}.`);
})();
