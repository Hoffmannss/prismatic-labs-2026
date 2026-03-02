#!/usr/bin/env node
// ============================================================
// ORCHESTRATOR - Jarvis Mission Control
// Sistema de delegação automática inspirado em Bhanu Teja
// ============================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MISSION_CONTROL = path.join(__dirname, 'mission-control.json');
const CRM_PATH = path.join(__dirname, '..', 'vendedor', 'data', 'crm.json');

// ===== CORE FUNCTIONS =====

function loadDashboard() {
  if (!fs.existsSync(MISSION_CONTROL)) {
    console.error('❌ Mission Control não encontrado!');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MISSION_CONTROL, 'utf8'));
}

function saveDashboard(dashboard) {
  dashboard.lastUpdate = new Date().toISOString();
  fs.writeFileSync(MISSION_CONTROL, JSON.stringify(dashboard, null, 2));
}

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m'    // red
  };
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
}

// ===== TASK MANAGEMENT =====

function createTask(type, payload, assignedTo) {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    assignedTo,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: null,
    error: null
  };
}

function delegateTask(dashboard, task) {
  dashboard.tasks.push(task);
  dashboard.agents[task.assignedTo].status = 'assigned';
  log(`📋 Task ${task.id} delegada para ${task.assignedTo}: ${task.type}`, 'info');
  saveDashboard(dashboard);
}

// ===== WORKFLOW ORCHESTRATION =====

function orchestrateVendedorWorkflow(dashboard) {
  log('🎯 Iniciando workflow completo do Vendedor AI...', 'info');
  
  // STEP 1: Scout para buscar leads
  const scoutTask = createTask(
    'search_leads',
    { nicho: 'infoprodutores', quantidade: 15 },
    'scout'
  );
  delegateTask(dashboard, scoutTask);
  
  // Nota: Próximas tasks serão criadas automaticamente quando
  // as anteriores forem completadas (via polling)
}

function checkPendingWork(dashboard) {
  // Verifica se há leads no CRM aguardando análise
  if (fs.existsSync(CRM_PATH)) {
    const crm = JSON.parse(fs.readFileSync(CRM_PATH, 'utf8'));
    const leadsNaoAnalisados = crm.leads?.filter(l => !l.score) || [];
    
    if (leadsNaoAnalisados.length > 0) {
      log(`📊 ${leadsNaoAnalisados.length} leads aguardando análise`, 'warning');
      
      // Delegar análise em lote
      const analyzeTask = createTask(
        'analyze_leads',
        { leads: leadsNaoAnalisados.map(l => l.username) },
        'analyzer'
      );
      delegateTask(dashboard, analyzeTask);
    }
    
    // Verifica leads analisados mas sem mensagens
    const leadsAnalisados = crm.leads?.filter(l => l.score && !l.mensagem) || [];
    if (leadsAnalisados.length > 0) {
      log(`✍️ ${leadsAnalisados.length} leads aguardando copywriting`, 'warning');
      
      const copyTask = createTask(
        'create_messages',
        { leads: leadsAnalisados.slice(0, 5).map(l => l.username) },
        'copywriter'
      );
      delegateTask(dashboard, copyTask);
    }
    
    // Verifica mensagens aguardando revisão
    const mensagensParaRevisar = crm.leads?.filter(l => l.mensagem && l.status === 'aguardando_revisao') || [];
    if (mensagensParaRevisar.length > 0) {
      log(`🔍 ${mensagensParaRevisar.length} mensagens aguardando revisão`, 'warning');
      
      const reviewTask = createTask(
        'review_messages',
        { leads: mensagensParaRevisar.map(l => l.username) },
        'reviewer'
      );
      delegateTask(dashboard, reviewTask);
    }
  }
}

function monitorAgents(dashboard) {
  log('\n📡 Status dos Agentes:', 'info');
  Object.entries(dashboard.agents).forEach(([name, agent]) => {
    const status = agent.status === 'active' ? '🟢' : 
                   agent.status === 'assigned' ? '🟡' : '⚪';
    log(`  ${status} ${name}: ${agent.status} - ${agent.description}`);
  });
  
  log('\n📝 Tasks Ativas:', 'info');
  const activeTasks = dashboard.tasks.filter(t => t.status !== 'completed');
  if (activeTasks.length === 0) {
    log('  Nenhuma task ativa');
  } else {
    activeTasks.forEach(task => {
      log(`  ${task.id}: ${task.type} → ${task.assignedTo} [${task.status}]`);
    });
  }
}

// ===== MAIN ORCHESTRATOR =====

function run() {
  console.clear();
  log('═══════════════════════════════════════', 'info');
  log('🤖 JARVIS ORCHESTRATOR - Mission Control', 'success');
  log('═══════════════════════════════════════', 'info');
  
  const dashboard = loadDashboard();
  
  // Monitorar status atual
  monitorAgents(dashboard);
  
  // Verificar trabalho pendente no CRM
  checkPendingWork(dashboard);
  
  // Se não há tasks ativas, iniciar novo ciclo
  const activeTasks = dashboard.tasks.filter(t => t.status !== 'completed');
  if (activeTasks.length === 0) {
    log('\n🚀 Iniciando novo ciclo de prospecção...', 'success');
    orchestrateVendedorWorkflow(dashboard);
  }
  
  // Salvar estado final
  saveDashboard(dashboard);
  
  log('\n✅ Orchestration completa!', 'success');
  log(`⏰ Próxima execução em ${dashboard.config.pollingInterval}s (${Math.round(dashboard.config.pollingInterval/60)} min)`, 'info');
}

if (require.main === module) {
  run();
}

module.exports = { run, createTask, delegateTask };
