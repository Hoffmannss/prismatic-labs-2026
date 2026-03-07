#!/usr/bin/env node
require('dotenv').config();
const Groq = require('groq-sdk');
const path = require('path');
const { loadJSON, saveJSON, ensureDir, listFiles } = require('../utils/file-store');

const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(VENDEDOR_ROOT, 'data');
const MENSAGENS_DIR = path.join(DATA_DIR, 'mensagens');
const LEADS_DIR = path.join(DATA_DIR, 'leads');
const LEARNING_DIR = path.join(DATA_DIR, 'learning');
const METRICS_DIR = path.join(DATA_DIR, 'metrics');
const MEMORY_FILE = path.join(LEARNING_DIR, 'style-memory.json');
const EVENTS_FILE = path.join(METRICS_DIR, 'lead-events.json');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const C = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', blue: '\x1b[34m', red: '\x1b[31m'
};

function sanitizeJSON(str) {
  let inString = false;
  let escaped = false;
  let result = '';
  for (let i = 0; i < str.length; i += 1) {
    const c = str[i];
    if (escaped) { result += c; escaped = false; continue; }
    if (c === '\\') { escaped = true; result += c; continue; }
    if (c === '"') { inString = !inString; result += c; continue; }
    if (inString && c === '\n') { result += '\\n'; continue; }
    if (inString && c === '\r') { result += '\\r'; continue; }
    if (inString && c === '\t') { result += '\\t'; continue; }
    result += c;
  }
  return result;
}

function collectSamples(limit = 40) {
  const files = listFiles(MENSAGENS_DIR, (file) => file.endsWith('_mensagens.json')).sort().slice(-limit);
  return files.map((file) => {
    const username = file.replace('_mensagens.json', '');
    const msgData = loadJSON(path.join(MENSAGENS_DIR, file), null);
    if (!msgData?.revisao) return null;

    const analysis = loadJSON(path.join(LEADS_DIR, `${username}_analysis.json`), null)?.analise || null;
    const tracking = msgData.tracking || null;

    return {
      username,
      produto: msgData.produto_detectado,
      prioridade: msgData.prioridade,
      score: msgData.revisao.score,
      nivel: msgData.revisao.nivel,
      aprovada: msgData.revisao.aprovada,
      melhorada: msgData.revisao.melhorada,
      problemas: (msgData.revisao.problemas || []).slice(0, 4),
      pontos_positivos: (msgData.revisao.pontos_positivos || []).slice(0, 4),
      msg_original: (msgData.revisao.mensagem_original || '').slice(0, 200),
      msg_final: (msgData.revisao.mensagem_final || '').slice(0, 200),
      nicho: analysis?.nicho || null,
      tipo_negocio: analysis?.tipo_negocio || null,
      gancho: (analysis?.analise_posts?.gancho_ideal || '').slice(0, 100),
      nivel_consciencia: analysis?.nivel_consciencia || null,
      tracking_outcome: tracking?.outcome || null,
      tracking_respondeu: tracking?.respondeu || false,
      tracking_converteu: tracking?.converteu || false,
      tracking_dias_resposta: tracking?.dias_ate_resposta || null,
      tracking_nota: (tracking?.nota || '').slice(0, 100),
      tracking_valor: tracking?.valor_fechado || null
    };
  }).filter(Boolean);
}

function summarizeEvents() {
  const eventsStore = loadJSON(EVENTS_FILE, { events: [] });
  const counts = {};
  const recent = (eventsStore.events || []).slice(-50);
  recent.forEach((event) => {
    counts[event.event] = (counts[event.event] || 0) + 1;
  });
  return { counts, recent_total: recent.length };
}

function buildStats(allData) {
  const scores = allData.map((item) => item.score);
  const scoreMedio = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const totalMelhoradas = allData.filter((item) => item.melhorada).length;
  const taxaMelhoria = Math.round((totalMelhoradas / allData.length) * 100);

  const comTracking = allData.filter((item) => item.tracking_outcome && item.tracking_outcome !== 'enviada');
  const totalTracked = comTracking.length;
  const totalResponderam = comTracking.filter((item) => item.tracking_respondeu).length;
  const totalConverteram = comTracking.filter((item) => item.tracking_converteu).length;
  const taxaRespostaReal = totalTracked > 0 ? Math.round((totalResponderam / totalTracked) * 100) : null;
  const taxaConversaoReal = totalTracked > 0 ? Math.round((totalConverteram / totalTracked) * 100) : null;

  const avg = (items) => items.length ? Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length) : null;
  const scoreResponderam = avg(comTracking.filter((item) => item.tracking_respondeu));
  const scoreIgnoraram = avg(comTracking.filter((item) => !item.tracking_respondeu));

  const errosCount = {};
  allData.forEach((item) => {
    item.problemas.forEach((problem) => {
      const key = problem.toLowerCase().slice(0, 60);
      errosCount[key] = (errosCount[key] || 0) + 1;
    });
  });

  const errosFrequentes = Object.entries(errosCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, value]) => `"${key}" (${value}x)`);

  return {
    scoreMedio,
    totalMelhoradas,
    taxaMelhoria,
    totalTracked,
    totalResponderam,
    totalConverteram,
    taxaRespostaReal,
    taxaConversaoReal,
    scoreResponderam,
    scoreIgnoraram,
    errosFrequentes
  };
}

async function runLearner() {
  console.log(`\n${C.blue}${'='.repeat(60)}${C.reset}`);
  console.log(`${C.bright}  LEARNER — APRENDIZADO CONTINUO${C.reset}`);
  console.log(`${C.blue}${'='.repeat(60)}${C.reset}`);

  ensureDir(LEARNING_DIR);

  const allData = collectSamples();
  console.log(`${C.cyan}[LEARNER] Arquivos com revisao util: ${allData.length}${C.reset}`);
  if (allData.length < 3) {
    console.log(`${C.yellow}[LEARNER] Minimo 3 amostras com revisao. Atual: ${allData.length}${C.reset}`);
    return null;
  }

  const memoriaAnterior = loadJSON(MEMORY_FILE, null);
  const eventSummary = summarizeEvents();
  const stats = buildStats(allData);

  const memAntStr = memoriaAnterior?.regras_copywriting?.length
    ? `VERSAO ANTERIOR (v${memoriaAnterior.versao}, score medio ${memoriaAnterior.score_medio}/100, taxa resposta real ${memoriaAnterior.taxa_resposta_real ?? 'N/A'}%):\n${memoriaAnterior.regras_copywriting.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}`
    : 'SEM MEMORIA ANTERIOR (primeira execucao)';

  const trackingStr = stats.totalTracked > 0
    ? `DADOS REAIS DE TRACKING (${stats.totalTracked} leads com outcome registrado):\n- Taxa resposta real: ${stats.taxaRespostaReal}%\n- Taxa conversao real: ${stats.taxaConversaoReal}%\n- Score medio dos que RESPONDERAM: ${stats.scoreResponderam ?? 'N/A'}\n- Score medio dos que IGNORARAM: ${stats.scoreIgnoraram ?? 'N/A'}`
    : 'SEM DADOS DE TRACKING REAL AINDA';

  const eventStr = `EVENTOS ESTRUTURADOS RECENTES (${eventSummary.recent_total} eventos): ${JSON.stringify(eventSummary.counts)}`;

  const prompt = `Voce e um especialista em copywriting B2B para outreach via Instagram DM.

Analise ${allData.length} mensagens avaliadas e extraia padroes de aprendizado com base no review, tracking real e eventos estruturados do pipeline.

DADOS:\n${JSON.stringify(allData, null, 2)}

ESTATISTICAS DO REVIEWER:\n- Score medio: ${stats.scoreMedio}/100\n- Total amostras: ${allData.length}\n- Mensagens reescritas pelo reviewer: ${stats.totalMelhoradas}/${allData.length} (${stats.taxaMelhoria}%)\n- Erros mais frequentes: ${stats.errosFrequentes.join(' | ')}

${trackingStr}

${eventStr}

${memAntStr}

Gere um JSON com esta estrutura EXATA (sem markdown):
{
  "padroes_eficazes": ["max 5"],
  "erros_recorrentes": ["max 5"],
  "regras_copywriting": ["max 8"],
  "criterios_reviewer_extras": ["max 4"],
  "angulos_por_produto": {
    "lead_normalizer_api": {
      "melhor_angulo": "texto",
      "ganchos_eficazes": ["lista"],
      "evitar": ["lista"]
    }
  },
  "insights_tracking": ["lista"],
  "insights_eventos": ["lista"],
  "evolucao": {
    "score_anterior": ${memoriaAnterior?.score_medio || null},
    "score_atual": ${stats.scoreMedio},
    "taxa_resposta_anterior": ${memoriaAnterior?.taxa_resposta_real || null},
    "taxa_resposta_atual": ${stats.taxaRespostaReal},
    "tendencia": "melhora ou piora ou estavel",
    "conquistas": ["lista"],
    "proximas_melhorias": ["lista"]
  }
}

RETORNE APENAS O JSON.`;

  console.log(`${C.cyan}[LEARNER] Sintetizando padroes com LLM (${allData.length} amostras, ${stats.totalTracked} com tracking real)...${C.reset}`);
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.25,
    max_tokens: 2800
  });

  const raw = completion.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM nao retornou JSON valido');

  const insights = JSON.parse(sanitizeJSON(jsonMatch[0]));
  const memoria = {
    versao: (memoriaAnterior?.versao || 0) + 1,
    ultima_atualizacao: new Date().toISOString(),
    score_medio: stats.scoreMedio,
    total_amostras: allData.length,
    taxa_melhoria_reviewer: stats.taxaMelhoria,
    total_tracked: stats.totalTracked,
    taxa_resposta_real: stats.taxaRespostaReal,
    taxa_conversao_real: stats.taxaConversaoReal,
    score_medio_responderam: stats.scoreResponderam,
    score_medio_ignoraram: stats.scoreIgnoraram,
    eventos_recentes: eventSummary.counts,
    padroes_eficazes: insights.padroes_eficazes || [],
    erros_recorrentes: insights.erros_recorrentes || [],
    regras_copywriting: insights.regras_copywriting || [],
    criterios_reviewer_extras: insights.criterios_reviewer_extras || [],
    angulos_por_produto: insights.angulos_por_produto || {},
    insights_tracking: insights.insights_tracking || [],
    insights_eventos: insights.insights_eventos || [],
    evolucao: insights.evolucao || {}
  };

  saveJSON(MEMORY_FILE, memoria);

  console.log(`\n${C.green}[LEARNER] ✅ Memoria atualizada! (versao ${memoria.versao})${C.reset}`);
  console.log(`${C.cyan}[LEARNER] Score medio: ${memoria.score_medio}/100${C.reset}`);
  console.log(`${C.cyan}[LEARNER] Taxa reescrita reviewer: ${memoria.taxa_melhoria_reviewer}%${C.reset}`);
  if (stats.totalTracked > 0) {
    console.log(`${C.cyan}[LEARNER] Taxa resposta real: ${memoria.taxa_resposta_real}%${C.reset}`);
    console.log(`${C.cyan}[LEARNER] Taxa conversao real: ${memoria.taxa_conversao_real}%${C.reset}`);
  }
  console.log(`${C.blue}[LEARNER] Eventos estruturados recentes: ${JSON.stringify(memoria.eventos_recentes)}${C.reset}`);
  console.log(`${C.blue}[LEARNER] Arquivo: ${MEMORY_FILE}${C.reset}\n`);

  return memoria;
}

module.exports = { runLearner };

if (require.main === module) {
  runLearner().catch((err) => {
    console.error('[LEARNER] Erro fatal:', err.message);
    process.exit(1);
  });
}
