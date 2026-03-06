// =============================================================
// MODULO 5: ORCHESTRATOR - PRISMATIC LABS VENDEDOR AUTOMATICO
// Cerebro central que une todos os modulos
// Uso: node 5-orchestrator.js analyze @username "bio" followers posts
//      node 5-orchestrator.js scout [nicho]
//      node 5-orchestrator.js followup
//      node 5-orchestrator.js report
//      node 5-orchestrator.js sent @username
//      node 5-orchestrator.js status @username em_negociacao "nota"
// =============================================================

require('dotenv').config();
const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const VENDEDOR_DIR = __dirname;

const C = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m',
  cyan: '\x1b[36m', red: '\x1b[31m'
};

function log(msg, color = C.cyan) { console.log(`${color}${msg}${C.reset}`); }

function runModule(scriptName, args = []) {
  const scriptPath = path.join(VENDEDOR_DIR, scriptName);
  log(`\n[ORCHESTRATOR] Executando: ${scriptName} ${args.join(' ')}`, C.blue);
  const result = spawnSync('node', [scriptPath, ...args], {
    env: process.env,
    stdio: 'inherit',
    cwd: VENDEDOR_DIR
  });
  if (result.status !== 0) { log(`[ORCHESTRATOR] ERRO em ${scriptName}`, C.red); return false; }
  return true;
}

// COMANDO: analyze
async function analyzeAndPrepare(args) {
  const [username, bio, followers, posts, postsDesc] = args;
  if (!username) { log('Uso: node 5-orchestrator.js analyze @username "bio" followers posts', C.red); process.exit(1); }
  const clean = username.replace('@', '');

  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI — ANALISANDO @${clean}`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);

  log('\n[STEP 1/3] Analisando perfil...', C.yellow);
  if (!runModule('1-analyzer.js', [clean, bio || '', followers || '0', posts || '0', postsDesc || ''])) {
    log('Falha no Analyzer. Abortando.', C.red); process.exit(1);
  }

  log('\n[STEP 2/3] Gerando mensagens...', C.yellow);
  if (!runModule('2-copywriter.js', [clean])) {
    log('Falha no Copywriter. Abortando.', C.red); process.exit(1);
  }

  log('\n[STEP 3/3] Adicionando ao CRM...', C.yellow);
  runModule('3-cataloger.js', ['add', clean]);

  log(`\n${'='.repeat(60)}`, C.green);
  log(`  PRONTO! @${clean} processado com sucesso!`, C.bright);
  log(`  -> Copie a mensagem acima e envie no Instagram/WhatsApp`, C.green);
  log(`  -> Apos enviar, rode: node 5-orchestrator.js sent @${clean}`, C.green);
  log(`${'='.repeat(60)}\n`, C.green);
}

// COMANDO: scout [nicho]
function runScout(args) {
  const nicho = args[0] || 'api-automacao';
  const qtd = args[1] || '8';

  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  SCOUT AI — GUIA DE PROSPECÇÃO`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);

  runModule('6-scout.js', [nicho, qtd]);
}

// COMANDO: followup
function runFollowup() {
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI — FOLLOWUPS DO DIA`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  runModule('4-followup.js');
}

// COMANDO: sent
function markSent(username) {
  const clean = username.replace('@', '');
  log(`\n[ORCHESTRATOR] Marcando @${clean} como contatado...`, C.yellow);
  runModule('3-cataloger.js', ['sent', clean]);
  log(`[ORCHESTRATOR] Followup automatico agendado em 3 dias. ✅`, C.green);
}

// COMANDO: status
function updateStatus(username, status, nota) {
  const clean = username.replace('@', '');
  const args = ['status', clean, status];
  if (nota) args.push(nota);
  runModule('3-cataloger.js', args);
}

// COMANDO: report
function showReport() {
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI — RELATORIO DO PIPELINE`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  runModule('3-cataloger.js', ['report']);
}

// COMANDO: list
function listLeads(filter) {
  runModule('3-cataloger.js', filter ? ['list', filter] : ['list']);
}

// HELP
function showHelp() {
  log(`\n${'='.repeat(60)}`, C.cyan);
  log(`  PRISMATIC LABS — VENDEDOR AI v1.2`, C.bright);
  log(`  Super Vendedor 24/7`, C.cyan);
  log(`${'='.repeat(60)}`, C.cyan);
  log(`\nCOMANDOS:`);
  log(`  scout    [nicho]                          -> Guia de prospeccao do dia`, C.green);
  log(`           nichos: api-automacao | api-trafego | api-dev | api-crm`);
  log(`                   lp-infoprodutor | lp-ecommerce`);
  log(`  analyze  @username "bio" followers posts  -> Analisa lead + gera DM`, C.green);
  log(`  sent     @username                        -> Marca como enviado + agenda followup`, C.green);
  log(`  followup                                  -> Followups pendentes do dia`, C.green);
  log(`  status   @username [status] "nota"        -> Atualiza: respondeu/em_negociacao/fechado/perdido`, C.green);
  log(`  report                                    -> Pipeline completo`, C.green);
  log(`  list     [filtro]                         -> Lista leads por status/prioridade`, C.green);
  log(`\nFLUXO DIARIO:`);
  log(`  Manha  -> node 5-orchestrator.js followup`, C.yellow);
  log(`  Dia    -> node 5-orchestrator.js scout api-automacao`, C.yellow);
  log(`         -> node 5-orchestrator.js analyze @usuario "bio" 5000 120`, C.yellow);
  log(`         -> (enviar DM manualmente)`, C.yellow);
  log(`         -> node 5-orchestrator.js sent @usuario`, C.yellow);
  log(`  Noite  -> node 5-orchestrator.js report`, C.yellow);
  log(`${'='.repeat(60)}\n`, C.cyan);
}

// MAIN
const command = process.argv[2];
const args = process.argv.slice(3);

switch(command) {
  case 'analyze':  analyzeAndPrepare(args); break;
  case 'scout':    runScout(args); break;
  case 'sent':     markSent(args[0]); break;
  case 'followup': runFollowup(); break;
  case 'status':   updateStatus(args[0], args[1], args[2]); break;
  case 'report':   showReport(); break;
  case 'list':     listLeads(args[0]); break;
  default:         showHelp();
}
