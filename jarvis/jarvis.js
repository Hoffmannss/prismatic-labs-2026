#!/usr/bin/env node
// ============================================================
// JARVIS - Cerebro Autonomo da Prismatic Labs
// Assistente IA local rodando na sua maquina 24/7
// ============================================================

const Groq = require('groq-sdk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('\n\x1b[31mERRO: GROQ_API_KEY nao encontrada!\x1b[0m');
  console.log('\nDefina a variavel de ambiente:');
  console.log('  Windows: setx GROQ_API_KEY "sua-chave-aqui"');
  console.log('  Linux/Mac: export GROQ_API_KEY="sua-chave-aqui"');
  process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

// ===== MEMORIA PERSISTENTE =====
const MEMORY_FILE = path.join(__dirname, 'memory.json');

function loadMemory() {
  if (fs.existsSync(MEMORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
    } catch (e) {
      return { conversas: [], contexto: {}, ultimoAcesso: null };
    }
  }
  return { conversas: [], contexto: {}, ultimoAcesso: null };
}

function saveMemory(memory) {
  memory.ultimoAcesso = new Date().toISOString();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

const memory = loadMemory();

// ===== BRAIN - CONTEXTO PERMANENTE =====
const BRAIN_FILE = path.join(__dirname, 'brain.md');
let JARVIS_BRAIN = '';

if (fs.existsSync(BRAIN_FILE)) {
  JARVIS_BRAIN = fs.readFileSync(BRAIN_FILE, 'utf8');
}

// ===== INICIALIZACAO =====
console.clear();
console.log('\x1b[36m');
console.log('  ========================================');
console.log('    JARVIS - Prismatic Labs AI');
console.log('    Cerebro Autonomo Operacional');
console.log('  ========================================');
console.log('\x1b[0m');

if (memory.ultimoAcesso) {
  const diff = Date.now() - new Date(memory.ultimoAcesso).getTime();
  const horas = Math.floor(diff / 3600000);
  console.log(`\x1b[90mMemoria carregada. Ultima sessao: ${horas}h atras\x1b[0m`);
}

console.log('\nDigite "sair" ou "exit" para encerrar.\n');

// ===== FERRAMENTAS DISPONIVEIS =====
const TOOLS = [
  {
    name: 'ler_crm',
    description: 'Le o banco de dados de leads do Vendedor AI',
    execute: () => {
      const crmPath = path.join(__dirname, '..', 'vendedor', 'data', 'crm.json');
      if (fs.existsSync(crmPath)) {
        return JSON.parse(fs.readFileSync(crmPath, 'utf8'));
      }
      return { erro: 'CRM nao encontrado' };
    }
  },
  {
    name: 'listar_leads',
    description: 'Lista todos os leads do CRM com status',
    execute: () => {
      const crm = TOOLS[0].execute();
      if (crm.erro) return crm;
      return crm.leads.map(l => ({
        username: l.username,
        status: l.status,
        score: l.score,
        prioridade: l.prioridade
      }));
    }
  }
];

function executeTool(toolName) {
  const tool = TOOLS.find(t => t.name === toolName);
  if (!tool) return { erro: 'Ferramenta nao encontrada' };
  return tool.execute();
}

// ===== SISTEMA DE CONVERSA =====
const conversationHistory = [
  {
    role: 'system',
    content: `Voce e JARVIS, o cerebro autonomo da Prismatic Labs.

${JARVIS_BRAIN}

FERRAMENTAS DISPONIVEIS:
${TOOLS.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Quando precisar usar uma ferramenta, responda no formato:
[TOOL:nome_da_ferramenta]

Voce tem acesso a memoria persistente e lembra de conversas anteriores.
Seja direto, tecnico e actionable. Nao seja prolixo.`
  }
];

// Restaurar ultimas 10 conversas da memoria
if (memory.conversas && memory.conversas.length > 0) {
  const ultimasConversas = memory.conversas.slice(-10);
  conversationHistory.push(...ultimasConversas);
}

async function think(userInput) {
  conversationHistory.push({ role: 'user', content: userInput });

  const response = await groq.chat.completions.create({
    messages: conversationHistory,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 1500,
  });

  const assistantMessage = response.choices[0]?.message?.content || 'Sem resposta';
  conversationHistory.push({ role: 'assistant', content: assistantMessage });

  // Salvar na memoria persistente
  memory.conversas.push({ role: 'user', content: userInput });
  memory.conversas.push({ role: 'assistant', content: assistantMessage });
  saveMemory(memory);

  // Detectar uso de ferramentas
  const toolMatch = assistantMessage.match(/\[TOOL:(\w+)\]/);
  if (toolMatch) {
    const toolName = toolMatch[1];
    console.log(`\x1b[33m[EXECUTANDO FERRAMENTA: ${toolName}]\x1b[0m\n`);
    const result = executeTool(toolName);
    console.log(JSON.stringify(result, null, 2));
    console.log('');
  }

  return assistantMessage;
}

// ===== LOOP PRINCIPAL =====
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\x1b[36mVoce:\x1b[0m '
});

rl.prompt();

rl.on('line', async (input) => {
  const cmd = input.trim().toLowerCase();

  if (cmd === 'sair' || cmd === 'exit') {
    console.log('\n\x1b[36mJARVIS desconectado. Ate logo, senhor.\x1b[0m\n');
    process.exit(0);
  }

  if (cmd === '') {
    rl.prompt();
    return;
  }

  try {
    const response = await think(input);
    console.log(`\n\x1b[32mJARVIS:\x1b[0m ${response}\n`);
  } catch (error) {
    console.error(`\n\x1b[31mErro:\x1b[0m ${error.message}\n`);
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log('\n\x1b[36mJARVIS encerrado.\x1b[0m\n');
  process.exit(0);
});
