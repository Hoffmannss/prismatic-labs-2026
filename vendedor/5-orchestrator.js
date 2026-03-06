// =============================================================
// MODULO 5: ORCHESTRATOR - PRISMATIC LABS VENDEDOR AUTOMATICO
// Cerebro central que une todos os modulos
// =============================================================

require('dotenv').config();
const { spawnSync } = require('child_process');
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
    env: process.env, stdio: 'inherit', cwd: VENDEDOR_DIR
  });
  if (result.status !== 0) { log(`[ORCHESTRATOR] ERRO em ${scriptName}`, C.red); return false; }
  return true;
}

function analyzeAndPrepare(args) {
  const [username, bio, followers, posts, postsDesc] = args;
  if (!username) { log('Uso: node 5-orchestrator.js analyze @username "bio" followers posts "desc posts"', C.red); process.exit(1); }
  const clean = username.replace('@', '');

  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI \u2014 ANALISANDO @${clean}`, C.bright);
  if (postsDesc) log(`  Posts descritos: SIM \u2728`, C.green);
  log(`${'='.repeat(60)}`, C.magenta);

  log('\n[STEP 1/4] Analisando perfil' + (postsDesc ? ' + posts' : '') + '...', C.yellow);
  if (!runModule('1-analyzer.js', [clean, bio || '', followers || '0', posts || '0', postsDesc || ''])) {
    log('Falha no Analyzer. Abortando.', C.red); process.exit(1);
  }

  log('\n[STEP 2/4] Gerando mensagem personalizada...', C.yellow);
  if (!runModule('2-copywriter.js', [clean])) {
    log('Falha no Copywriter. Abortando.', C.red); process.exit(1);
  }

  log('\n[STEP 3/4] Revisando qualidade da mensagem...', C.yellow);
  runModule('7-reviewer.js', [clean]);

  log('\n[STEP 4/4] Adicionando ao CRM...', C.yellow);
  runModule('3-cataloger.js', ['add', clean]);

  log(`\n${'='.repeat(60)}`, C.green);
  log(`  PRONTO! @${clean} processado com sucesso!`, C.bright);
  log(`  -> Copie a MENSAGEM FINAL acima e envie no Instagram/WhatsApp`, C.green);
  log(`  -> Apos enviar: node 5-orchestrator.js sent @${clean}`, C.green);
  log(`${'='.repeat(60)}\n`, C.green);
}

function runScout(args) {
  const nicho = args[0] || 'api-automacao';
  const qtd   = args[1] || '8';
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  SCOUT AI \u2014 GUIA DE PROSPEC\u00c7\u00c3O`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  runModule('6-scout.js', [nicho, qtd]);
}

function runFollowup() {
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI \u2014 FOLLOWUPS DO DIA`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  runModule('4-followup.js');
}

function markSent(username) {
  const clean = username?.replace('@', '');
  if (!clean) { log('Uso: node 5-orchestrator.js sent @username', C.red); process.exit(1); }
  log(`\n[ORCHESTRATOR] Marcando @${clean} como contatado...`, C.yellow);
  runModule('3-cataloger.js', ['sent', clean]);
  log(`[ORCHESTRATOR] Followup automatico agendado em 3 dias. \u2705`, C.green);
}

function updateStatus(username, status, nota) {
  const clean = username?.replace('@', '');
  const args  = ['status', clean, status];
  if (nota) args.push(nota);
  runModule('3-cataloger.js', args);
}

function showReport() {
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI \u2014 RELATORIO DO PIPELINE`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  runModule('3-cataloger.js', ['report']);
}

function listLeads(f) {
  runModule('3-cataloger.js', f ? ['list', f] : ['list']);
}

function runNotionSync(subcmd) {
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  NOTION SYNC`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  runModule('9-notion-sync.js', [subcmd || 'sync']);
}

function showHelp() {
  log(`\n${'='.repeat(60)}`, C.cyan);
  log(`  PRISMATIC LABS \u2014 VENDEDOR AI v1.5`, C.bright);
  log(`${'='.repeat(60)}`, C.cyan);
  log(`\nCOMANDOS:`);
  log(`  scout    [nicho]                           -> Guia de prospeccao do dia`, C.green);
  log(`  analyze  @user "bio" seg posts              -> Analisa + gera + REVISA mensagem`, C.green);
  log(`  analyze  @user "bio" seg posts "desc|posts" -> Com analise de posts \u2728`, C.green);
  log(`  sent     @username                         -> Marca enviado + agenda followup`, C.green);
  log(`  followup                                   -> Followups pendentes do dia`, C.green);
  log(`  status   @username [status] "nota"          -> Atualiza status do lead`, C.green);
  log(`  notion   [setup|sync|status]               -> Sincroniza CRM com Notion \u2728`, C.green);
  log(`  dashboard                                  -> Sobe o dashboard web`, C.green);
  log(`  report                                     -> Pipeline completo`, C.green);
  log(`  list     [filtro]                          -> Lista leads`, C.green);
  log(`\nPIPELINE DO ANALYZE (4 passos):`);
  log(`  1. Analyzer   -> detecta produto + score + analise de posts`, C.cyan);
  log(`  2. Copywriter -> gera 3 variacoes de DM com few-shot`, C.cyan);
  log(`  3. Reviewer   -> avalia qualidade e melhora se necessario`, C.cyan);
  log(`  4. Cataloger  -> salva no CRM JSON`, C.cyan);
  log(`\nFLUXO DIARIO:`);
  log(`  Manha  -> node 5-orchestrator.js followup`, C.yellow);
  log(`  Dia    -> scout + analyze + enviar DM + sent`, C.yellow);
  log(`  Noite  -> notion sync + report`, C.yellow);
  log(`${'='.repeat(60)}\n`, C.cyan);
}

const command = process.argv[2];
const args    = process.argv.slice(3);

switch(command) {
  case 'analyze':   analyzeAndPrepare(args); break;
  case 'scout':     runScout(args); break;
  case 'sent':      markSent(args[0]); break;
  case 'followup':  runFollowup(); break;
  case 'status':    updateStatus(args[0], args[1], args[2]); break;
  case 'report':    showReport(); break;
  case 'list':      listLeads(args[0]); break;
  case 'notion':    runNotionSync(args[0]); break;
  case 'dashboard': runModule('8-dashboard.js', []); break;
  default:          showHelp();
}
