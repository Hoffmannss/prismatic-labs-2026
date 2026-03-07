#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const {
  upsertLeadFromFiles,
  markMessageSent,
  updateOutcome,
  dailyReport
} = require('../src/core/tracker');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const CRM_DIR = path.join(DATA_DIR, 'crm');
const LEADS_DIR = path.join(DATA_DIR, 'leads');
const MESSAGES_DIR = path.join(DATA_DIR, 'mensagens');
const METRICS_DIR = path.join(DATA_DIR, 'metrics');
const TRACKER_DIR = path.join(DATA_DIR, 'tracker');
const FIXTURE_DIR = path.join(ROOT, 'test', 'fixtures');
const USERNAME = 'smoke_fixture_alpha';

const filesToProtect = [
  path.join(CRM_DIR, 'leads-database.json'),
  path.join(CRM_DIR, 'pipeline.json'),
  path.join(METRICS_DIR, 'lead-events.json'),
  path.join(METRICS_DIR, 'daily-quotas.json'),
  path.join(MESSAGES_DIR, `${USERNAME}_mensagens.json`),
  path.join(LEADS_DIR, `${USERNAME}_analysis.json`),
  path.join(TRACKER_DIR, `${USERNAME}_tracker.json`)
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8'));
}

function writeJSON(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function backupFiles() {
  const backups = new Map();
  filesToProtect.forEach((file) => {
    backups.set(file, fs.existsSync(file)
      ? { exists: true, content: fs.readFileSync(file, 'utf8') }
      : { exists: false, content: null });
  });
  return backups;
}

function restoreFiles(backups) {
  Array.from(backups.entries()).reverse().forEach(([file, snapshot]) => {
    ensureDir(path.dirname(file));
    if (!snapshot.exists) {
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
      return;
    }
    fs.writeFileSync(file, snapshot.content);
  });
}

function installFixtures() {
  ensureDir(CRM_DIR);
  ensureDir(LEADS_DIR);
  ensureDir(MESSAGES_DIR);
  ensureDir(METRICS_DIR);
  ensureDir(TRACKER_DIR);

  const analysis = loadFixture('smoke-analysis.json');
  const messages = loadFixture('smoke-messages.json');
  writeJSON(path.join(LEADS_DIR, `${USERNAME}_analysis.json`), analysis);
  writeJSON(path.join(MESSAGES_DIR, `${USERNAME}_mensagens.json`), messages);
}

(function main() {
  const backups = backupFiles();
  try {
    installFixtures();

    const created = upsertLeadFromFiles(USERNAME);
    assert.equal(created.username, USERNAME);
    assert.equal(created.status_canonical, 'qa_approved');

    const sent = markMessageSent(USERNAME, { note: 'smoke first touch' });
    assert.equal(sent.dispatch_kind, 'send');
    assert.equal(sent.lead.primeira_mensagem_enviada, true);
    assert.equal(sent.lead.status_canonical, 'sent');
    assert.equal(sent.quota.usage.sends, 1);

    const replied = updateOutcome(USERNAME, 'respondeu', 'Lead respondeu ao smoke test');
    assert.equal(replied.lead.status_canonical, 'engaged');

    const negotiated = updateOutcome(USERNAME, 'negociando', 'Call agendada');
    assert.equal(negotiated.lead.status_canonical, 'opportunity');

    const won = updateOutcome(USERNAME, 'converteu', '3500');
    assert.equal(won.lead.status_canonical, 'won');
    assert.equal(won.tracking.valor_fechado, 3500);

    const report = dailyReport();
    const finalLead = report.db.leads.find((lead) => lead.username === USERNAME);
    assert.ok(finalLead);
    assert.equal(finalLead.status_canonical, 'won');
    assert.ok(report.pipeline.tracker.counts.converteu >= 1);

    console.log('[SMOKE] Fluxo analyze -> sent -> replied -> opportunity -> won validado com fixture isolada.');
    console.log(`[SMOKE] Lead final: @${finalLead.username} | status=${finalLead.status_canonical} | valor=${won.tracking.valor_fechado}`);
  } finally {
    restoreFiles(backups);
  }
})();
