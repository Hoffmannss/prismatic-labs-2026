#!/usr/bin/env node
/**
 * PRISMATIC LABS - INSTAGRAM AUTOMATION
 * ORCHESTRATOR - Executa Pipeline Completo
 * 
 * O QUE FAZ:
 * - Executa os 6 scripts em sequência
 * - Tratamento de erros robusto
 * - Logs coloridos e informativos
 * - Resumo final com métricas
 * 
 * USO:
 * node orchestrator.js [Mês]
 * Exemplo: node orchestrator.js Fevereiro
 */

const chalk = require('chalk');
const { format } = require('date-fns');

// Importar scripts
const generateTopics = require('./1-generate-topics');
const createHTML = require('./2-create-html');
const generateScreenshots = require('./3-screenshots');
const generateCaptions = require('./4-generate-captions');
const uploadToDrive = require('./5-upload-drive');
const triggerMake = require('./6-trigger-make');

// Banner
function showBanner() {
  console.clear();
  console.log(chalk.magenta.bold('\n========================================'));
  console.log(chalk.magenta.bold('  PRISMATIC LABS'));
  console.log(chalk.cyan.bold('  Instagram Automation Pipeline'));
  console.log(chalk.magenta.bold('========================================\n'));
}

// Timer
class Timer {
  constructor() {
    this.startTime = Date.now();
  }
  
  elapsed() {
    const ms = Date.now() - this.startTime;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

// Função principal
async function runPipeline() {
  showBanner();
  
  const month = process.argv[2] || 'Fevereiro';
  const timer = new Timer();
  const results = {};
  
  console.log(chalk.cyan(`📅 Mês: ${month} 2026`));
  console.log(chalk.gray(`🕒 Início: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}\n`));
  console.log(chalk.yellow('⚠️  Este processo pode levar 15-20 minutos\n'));
  console.log(chalk.gray('Pressione Ctrl+C para cancelar a qualquer momento\n'));
  
  try {
    // ======== ETAPA 1 ========
    console.log(chalk.bgBlue.white.bold('\n >>> ETAPA 1/6: GERAÇÃO DE TÓPICOS '));
    results.topics = await generateTopics(month);
    console.log(chalk.green(`⏱️  Tempo decorrido: ${timer.elapsed()}\n`));
    
    // ======== ETAPA 2 ========
    console.log(chalk.bgBlue.white.bold('\n >>> ETAPA 2/6: CRIAÇÃO DE HTMLs '));
    results.html = await createHTML(month);
    console.log(chalk.green(`⏱️  Tempo decorrido: ${timer.elapsed()}\n`));
    
    // ======== ETAPA 3 ========
    console.log(chalk.bgBlue.white.bold('\n >>> ETAPA 3/6: SCREENSHOTS '));
    results.screenshots = await generateScreenshots(month);
    console.log(chalk.green(`⏱️  Tempo decorrido: ${timer.elapsed()}\n`));
    
    // ======== ETAPA 4 ========
    console.log(chalk.bgBlue.white.bold('\n >>> ETAPA 4/6: GERAÇÃO DE LEGENDAS '));
    results.captions = await generateCaptions(month);
    console.log(chalk.green(`⏱️  Tempo decorrido: ${timer.elapsed()}\n`));
    
    // ======== ETAPA 5 ========
    console.log(chalk.bgBlue.white.bold('\n >>> ETAPA 5/6: UPLOAD GOOGLE DRIVE '));
    results.drive = await uploadToDrive(month);
    console.log(chalk.green(`⏱️  Tempo decorrido: ${timer.elapsed()}\n`));
    
    // ======== ETAPA 6 ========
    console.log(chalk.bgBlue.white.bold('\n >>> ETAPA 6/6: TRIGGER MAKE.COM '));
    results.make = await triggerMake(month);
    console.log(chalk.green(`⏱️  Tempo total: ${timer.elapsed()}\n`));
    
    // ======== RESUMO ========
    console.log(chalk.bgGreen.black.bold('\n                                    '));
    console.log(chalk.bgGreen.black.bold('  ✅ PIPELINE COMPLETO COM SUCESSO!  '));
    console.log(chalk.bgGreen.black.bold('                                    \n'));
    
    console.log(chalk.white.bold('RESUMO DA EXECUÇÃO:\n'));
    console.log(chalk.cyan(`  Mês: ${month} 2026`));
    console.log(chalk.cyan(`  Posts gerados: ${results.topics.posts.length}`));
    console.log(chalk.cyan(`  Tempo total: ${timer.elapsed()}`));
    console.log(chalk.cyan(`  Finalizado: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}\n`));
    
    console.log(chalk.white.bold('DISTRIBUIÇÃO DE CONTEÚDO:\n'));
    const distribution = results.topics.posts.reduce((acc, post) => {
      acc[post.tipo] = (acc[post.tipo] || 0) + 1;
      return acc;
    }, {});
    Object.entries(distribution).forEach(([tipo, count]) => {
      const percent = ((count / results.topics.posts.length) * 100).toFixed(0);
      console.log(chalk.gray(`  ${tipo}: ${count} posts (${percent}%)`));
    });
    
    console.log(chalk.white.bold('\nPRÓXIMOS PASSOS:\n'));
    console.log(chalk.yellow('  1. Verifique Google Drive: pasta criada com imagens + legendas'));
    console.log(chalk.yellow('  2. Make.com está agendando os posts agora'));
    console.log(chalk.yellow('  3. Verifique Instagram Creator Studio em ~5 minutos'));
    console.log(chalk.yellow('  4. Posts aparecerão na aba "Scheduled"\n'));
    
    console.log(chalk.magenta.bold('========================================\n'));
    
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.bgRed.white.bold('\n ❌ ERRO NO PIPELINE '));
    console.error(chalk.red.bold(`\n${error.message}\n`));
    console.error(chalk.gray(error.stack));
    console.log(chalk.yellow(`\n⏱️  Falhou após: ${timer.elapsed()}\n`));
    
    console.log(chalk.white.bold('DIAGNÓSTICO:\n'));
    console.log(chalk.gray('  1. Verifique arquivo .env (todas variáveis configuradas?)'));
    console.log(chalk.gray('  2. Teste conexão: npm run test'));
    console.log(chalk.gray('  3. Verifique logs acima para detalhes\n'));
    
    process.exit(1);
  }
}

// Interceptar Ctrl+C
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⚠️  Pipeline cancelado pelo usuário\n'));
  process.exit(0);
});

// Executar
runPipeline();
