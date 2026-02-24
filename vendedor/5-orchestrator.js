// =============================================================
// MODULO 5: ORCHESTRATOR - PRISMATIC LABS VENDEDOR AUTOMATICO
// Cerebro central que une todos os modulos
// Uso: node 5-orchestrator.js analyze @username "bio" followers posts
//      node 5-orchestrator.js followup
//      node 5-orchestrator.js report
//      node 5-orchestrator.js sent @username
//      node 5-orchestrator.js status @username em_negociacao "nota"
// =============================================================

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const VENDEDOR_DIR = __dirname;
const DATA_DIR = path.join(__dirname, '..', 'data');

// Cores para terminal
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(msg, color = C.cyan) {
  console.log(`${color}${msg}${C.reset}`);
}

function runModule(scriptName, args = []) {
  const scriptPath = path.join(VENDEDOR_DIR, scriptName);
  log(`\n[ORCHESTRATOR] Executando: ${scriptName} ${args.join(' ')}`, C.blue);
  
  const result = spawnSync('node', [scriptPath, ...args], {
    env: process.env,
    stdio: 'inherit',
    cwd: VENDEDOR_DIR
  });
  
  if (result.status !== 0) {
    log(`[ORCHESTRATOR] ERRO em ${scriptName}`, C.red);
    return false;
  }
  return true;
}

// COMANDO: analyze @username "bio" followers posts "descricao_posts"
async function analyzeAndPrepare(args) {
  const [username, bio, followers, posts, postsDesc] = args;
  
  if (!username) {
    log('Uso: node 5-orchestrator.js analyze @username "bio" followers posts', C.red);
    process.exit(1);
  }

  const cleanUsername = username.replace('@', '');
  
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI - ANALISANDO @${cleanUsername}`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);

  // STEP 1: Analyzer
  log('\n[STEP 1/3] Analisando perfil...', C.yellow);
  const analyzerOk = runModule('1-analyzer.js', [
    cleanUsername,
    bio || '',
    followers || '0',
    posts || '0',
    postsDesc || ''
  ]);
  if (!analyzerOk) { log('Falha no Analyzer. Abortando.', C.red); process.exit(1); }

  // STEP 2: Copywriter
  log('\n[STEP 2/3] Gerando mensagens...', C.yellow);
  const copywriterOk = runModule('2-copywriter.js', [cleanUsername]);
  if (!copywriterOk) { log('Falha no Copywriter. Abortando.', C.red); process.exit(1); }

  // STEP 3: Cataloger - Adicionar ao CRM
  log('\n[STEP 3/3] Adicionando ao CRM...', C.yellow);
  const catalogerOk = runModule('3-cataloger.js', ['add', cleanUsername]);
  if (!catalogerOk) { log('Falha no Cataloger.', C.red); }

  log(`\n${'='.repeat(60)}`, C.green);
  log(`  PRONTO! @${cleanUsername} processado com sucesso!`, C.bright);
  log(`  -> Copie a mensagem acima e envie no Instagram`, C.green);
  log(`  -> Apos enviar, rode: node 5-orchestrator.js sent @${cleanUsername}`, C.green);
  log(`${'='.repeat(60)}\n`, C.green);
}

// COMANDO: followup (verificar e gerar followups do dia)
function runFollowup() {
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI - VERIFICANDO FOLLOWUPS DO DIA`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  
  runModule('4-followup.js');
  
  log(`\n${'='.repeat(60)}`, C.green);
  log(`  Followups verificados!`, C.bright);
  log(`  Se houver mensagens acima, copie e envie no Instagram`, C.green);
  log(`${'='.repeat(60)}\n`, C.green);
}

// COMANDO: sent @username - marcar mensagem como enviada
function markSent(username) {
  const cleanUsername = username.replace('@', '');
  log(`\n[ORCHESTRATOR] Marcando @${cleanUsername} como contatado...`, C.yellow);
  runModule('3-cataloger.js', ['sent', cleanUsername]);
  log(`[ORCHESTRATOR] Done! Followup automatico agendado em 3 dias.`, C.green);
}

// COMANDO: status @username novo_status nota
function updateStatus(username, status, nota) {
  const cleanUsername = username.replace('@', '');
  const args = ['status', cleanUsername, status];
  if (nota) args.push(nota);
  runModule('3-cataloger.js', args);
}

// COMANDO: report
function showReport() {
  log(`\n${'='.repeat(60)}`, C.magenta);
  log(`  VENDEDOR AI - RELATORIO DO PIPELINE`, C.bright);
  log(`${'='.repeat(60)}`, C.magenta);
  runModule('3-cataloger.js', ['report']);
}

// COMANDO: list [status]
function listLeads(filter) {
  runModule('3-cataloger.js', filter ? ['list', filter] : ['list']);
}

// MENU INTERATIVO
function showHelp() {
  log(`\n${'='.repeat(60)}`, C.cyan);
  log(`  PRISMATIC LABS - VENDEDOR AI v1.0`, C.bright);
  log(`  O Seu Super Vendedor 24/7`, C.cyan);
  log(`${'='.repeat(60)}`, C.cyan);
  log(`\nCOMANDOS DISPONIVEIS:`);
  log(`  analyze  @username "bio" followers posts`, C.green);
  log(`           -> Analisa lead + gera mensagem para copiar`);
  log(`  sent     @username`, C.green);
  log(`           -> Marca mensagem como enviada + agenda followup`);
  log(`  followup`, C.green);
  log(`           -> Verifica e gera followups do dia`);
  log(`  status   @username [novo_status] "nota"`, C.green);
  log(`           -> Atualiza status: respondeu/em_negociacao/fechado/perdido`);
  log(`  report`, C.green);
  log(`           -> Relatorio completo do pipeline`);
  log(`  list     [filtro]`, C.green);
  log(`           -> Lista leads (filtro: hot/warm/cold/contatado/etc)`);
  log(`\nEXEMPLO DE USO DIARIO:`);
  log(`  1. Encontrou lead no Instagram -> node 5-orchestrator.js analyze @usuario "bio" 5000 120`, C.yellow);
  log(`  2. Copiou mensagem e enviou   -> node 5-orchestrator.js sent @usuario`, C.yellow);
  log(`  3. Verificar followups        -> node 5-orchestrator.js followup`, C.yellow);
  log(`  4. Lead respondeu             -> node 5-orchestrator.js status @usuario respondeu`, C.yellow);
  log(`  5. Fechou venda               -> node 5-orchestrator.js status @usuario fechado "R$1997"`, C.yellow);
  log(`${'='.repeat(60)}\n`, C.cyan);
}

// ---- EXECUCAO PRINCIPAL ----
const command = process.argv[2];
const args = process.argv.slice(3);

switch(command) {
  case 'analyze': analyzeAndPrepare(args); break;
  case 'sent': markSent(args[0]); break;
  case 'followup': runFollowup(); break;
  case 'status': updateStatus(args[0], args[1], args[2]); break;
  case 'report': showReport(); break;
  case 'list': listLeads(args[0]); break;
  default: showHelp();
}
