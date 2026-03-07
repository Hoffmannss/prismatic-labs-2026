require('dotenv').config();
const { spawnSync } = require('child_process');
const path = require('path');
const {
  upsertLeadFromFiles,
  markMessageSent,
  updateLeadStatus,
  listLeads,
  dailyReport
} = require('./tracker');

const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');

const C = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m',
  cyan: '\x1b[36m', red: '\x1b[31m'
};

function log(msg, color = C.cyan) {
  console.log(`${color}${msg}${C.reset}`);
}

function runLegacy(scriptName, args = []) {
  const scriptPath = path.join(VENDEDOR_ROOT, scriptName);
  log(`\n[ORCHESTRATOR] Executando: ${scriptName} ${args.join(' ')}`, C.blue);
  const result = spawnSync('node', [scriptPath, ...args], {
    env: process.env,
    stdio: 'inherit',
    cwd: VENDEDOR_ROOT
  });
  if (result.status !== 0) {
    log(`[ORCHESTRATOR] ERRO em ${scriptName}`, C.red);
    return false;
  }
  return true;
}

function analyzeAndPrepare(args) {
  const [username, bio, followers, posts, postsDesc] = args;
  if (!username) {
    log('Uso: node src/core/orchestrator.js analyze @username "bio" followers posts "desc posts"', C.red);
    process.exit(1);
  }

  const clean = username.replace('@', '');
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI — ANALISANDO @${clean}`, C.bright);
  if (postsDesc) log('  Posts descritos: SIM ✨', C.green);
  log(`${'='.repeat(60)}`, C.magenta);

  log('\n[STEP 1/4] Analisando perfil...', C.yellow);
  if (!runLegacy('1-analyzer.js', [clean, bio || '', followers || '0', posts || '0', postsDesc || ''])) process.exit(1);

  log('\n[STEP 2/4] Gerando mensagem personalizada...', C.yellow);
  if (!runLegacy('2-copywriter.js', [clean])) process.exit(1);

  log('\n[STEP 3/4] Revisando qualidade da mensagem...', C.yellow);
  runLegacy('7-reviewer.js', [clean]);

  log('\n[STEP 4/4] Registrando no pipeline estruturado...', C.yellow);
  const lead = upsertLeadFromFiles(clean);

  log(`\n${'='.repeat(60)}`, C.green);
  log(`  PRONTO! @${clean} processado com sucesso!`, C.bright);
  log(`  Status canonico: ${lead.status_canonical}`, C.green);
  log('  -> Copie a MENSAGEM FINAL acima e envie no Instagram/WhatsApp', C.green);
  log(`  -> Apos enviar: node src/core/orchestrator.js sent @${clean}`, C.green);
  log(`${'='.repeat(60)}\n`, C.green);
}

function runScout(args) {
  runLegacy('6-scout.js', [args[0] || 'api-automacao', args[1] || '8']);
}

function runFollowup() {
  runLegacy('4-followup.js');
}

function markSent(username) {
  const clean = username?.replace('@', '');
  if (!clean) {
    log('Uso: node src/core/orchestrator.js sent @username', C.red);
    process.exit(1);
  }
  const lead = markMessageSent(clean);
  log(`[ORCHESTRATOR] @${clean} marcado como sent. Proximo followup: ${lead.proximo_followup}`, C.green);
}

function updateStatus(username, status, nota) {
  const clean = username?.replace('@', '');
  if (!clean || !status) {
    log('Uso: node src/core/orchestrator.js status @username status "nota opcional"', C.red);
    process.exit(1);
  }
  const lead = updateLeadStatus(clean, status, nota);
  log(`[ORCHESTRATOR] @${clean} atualizado para ${lead.status_canonical}`, C.green);
}

function showReport() {
  const { db, pipeline } = dailyReport();
  log(`\n${'='.repeat(60)}`, C.magenta);
  log('  VENDEDOR AI — RELATORIO DO PIPELINE', C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  log(`  Total de leads: ${db.leads.length}`, C.cyan);
  log(`  Taxa de contato: ${pipeline.taxa_contato}%`, C.cyan);
  log(`  Taxa de oportunidade: ${pipeline.taxa_oportunidade}%`, C.cyan);
  log(`  Taxa de fechamento: ${pipeline.taxa_fechamento}%`, C.cyan);
  log(`  Followups hoje: ${pipeline.leads_para_followup_hoje.length}`, C.cyan);
  log(`${'='.repeat(60)}\n`, C.magenta);
}

function printLeads(filter) {
  console.log(JSON.stringify(listLeads(filter), null, 2));
}

function runNotionSync(subcmd) {
  runLegacy('9-notion-sync.js', [subcmd || 'sync']);
}

function showHelp() {
  log(`\n${'='.repeat(60)}`, C.cyan);
  log('  PRISMATIC LABS — VENDEDOR AI v2 FOUNDATION', C.bright);
  log(`${'='.repeat(60)}`, C.cyan);
  log('\nCOMANDOS:');
  log('  scout    [nicho] [qtd]                    -> Prospeccao guiada', C.green);
  log('  analyze  @user "bio" seg posts "desc"     -> Analise + copy + revisao + registro', C.green);
  log('  sent     @username                        -> Marca enviado e agenda followup', C.green);
  log('  followup                                  -> Followups pendentes', C.green);
  log('  status   @username [status] "nota"        -> Atualiza status canonico', C.green);
  log('  notion   [setup|sync|status]              -> Sincronizacao Notion', C.green);
  log('  dashboard                                 -> Sobe o dashboard web', C.green);
  log('  report                                    -> Relatorio do pipeline', C.green);
  log('  list     [filtro]                         -> Lista leads', C.green);
  log(`${'='.repeat(60)}\n`, C.cyan);
}

const command = process.argv[2];
const args = process.argv.slice(3);

try {
  switch (command) {
    case 'analyze': analyzeAndPrepare(args); break;
    case 'scout': runScout(args); break;
    case 'sent': markSent(args[0]); break;
    case 'followup': runFollowup(); break;
    case 'status': updateStatus(args[0], args[1], args[2]); break;
    case 'report': showReport(); break;
    case 'list': printLeads(args[0]); break;
    case 'notion': runNotionSync(args[0]); break;
    case 'dashboard': runLegacy('8-dashboard.js'); break;
    default: showHelp();
  }
} catch (error) {
  log(error.message, C.red);
  process.exit(1);
}
