// =============================================================
// MODULO 11: LEARNER AI - PRISMATIC LABS VENDEDOR AUTOMATICO
// Analisa todas as mensagens revisadas, extrai padroes com LLM
// e grava uma memoria de aprendizado continuo que alimenta o
// copywriter e o reviewer nas proximas geracoes
// =============================================================

require('dotenv').config();
const Groq   = require('groq-sdk');
const fs     = require('fs');
const path   = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MENSAGENS_DIR = path.join(__dirname, '..', 'data', 'mensagens');
const LEADS_DIR     = path.join(__dirname, '..', 'data', 'leads');
const LEARNING_DIR  = path.join(__dirname, '..', 'data', 'learning');
const MEMORY_FILE   = path.join(LEARNING_DIR, 'style-memory.json');

const C = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', blue: '\x1b[34m',
};

function sanitizeJSON(str) {
  let inString = false, escaped = false, result = '';
  for (let i = 0; i < str.length; i++) {
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

async function runLearner() {
  console.log(`\n${C.blue}${'='.repeat(56)}${C.reset}`);
  console.log(`${C.bright}  LEARNER — APRENDIZADO CONTINUO${C.reset}`);
  console.log(`${C.blue}${'='.repeat(56)}${C.reset}`);

  if (!fs.existsSync(LEARNING_DIR)) fs.mkdirSync(LEARNING_DIR, { recursive: true });

  if (!fs.existsSync(MENSAGENS_DIR)) {
    console.log(`${C.yellow}[LEARNER] Diretorio de mensagens nao encontrado.${C.reset}`);
    return null;
  }

  const msgFiles = fs.readdirSync(MENSAGENS_DIR)
    .filter(f => f.endsWith('_mensagens.json'))
    .sort();

  const comRevisao = msgFiles.filter(f => {
    try {
      return !!JSON.parse(fs.readFileSync(path.join(MENSAGENS_DIR, f), 'utf8')).revisao;
    } catch { return false; }
  });

  console.log(`${C.cyan}[LEARNER] Arquivos com revisao: ${comRevisao.length} / ${msgFiles.length}${C.reset}`);

  if (comRevisao.length < 3) {
    console.log(`${C.yellow}[LEARNER] Minimo 3 amostras com revisao para gerar aprendizado. Atual: ${comRevisao.length}${C.reset}`);
    return null;
  }

  // Janela deslizante: ultimas 40 amostras
  const allData = [];
  for (const file of msgFiles.slice(-40)) {
    const username = file.replace('_mensagens.json', '');
    try {
      const msgData = JSON.parse(fs.readFileSync(path.join(MENSAGENS_DIR, file), 'utf8'));
      if (!msgData.revisao) continue;

      let analise = null;
      const leadPath = path.join(LEADS_DIR, `${username}_analysis.json`);
      if (fs.existsSync(leadPath)) {
        analise = JSON.parse(fs.readFileSync(leadPath, 'utf8'))?.analise || null;
      }

      allData.push({
        username,
        produto:           msgData.produto_detectado,
        prioridade:        msgData.prioridade,
        score:             msgData.revisao.score,
        nivel:             msgData.revisao.nivel,
        aprovada:          msgData.revisao.aprovada,
        melhorada:         msgData.revisao.melhorada,
        problemas:         (msgData.revisao.problemas         || []).slice(0, 4),
        pontos_positivos:  (msgData.revisao.pontos_positivos  || []).slice(0, 4),
        msg_original:      (msgData.revisao.mensagem_original || '').slice(0, 200),
        msg_final:         (msgData.revisao.mensagem_final    || '').slice(0, 200),
        nicho:             analise?.nicho                     || null,
        tipo_negocio:      analise?.tipo_negocio              || null,
        gancho:            (analise?.analise_posts?.gancho_ideal || '').slice(0, 100),
        nivel_consciencia: analise?.nivel_consciencia         || null,
      });
    } catch {}
  }

  if (allData.length < 3) {
    console.log(`${C.yellow}[LEARNER] Dados insuficientes apos filtro (${allData.length}).${C.reset}`);
    return null;
  }

  // Estatisticas basicas
  const scores          = allData.map(d => d.score);
  const scoreMedio      = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const totalMelhoradas = allData.filter(d => d.melhorada).length;
  const taxaMelhoria    = Math.round((totalMelhoradas / allData.length) * 100);

  const errosCount = {};
  allData.forEach(d => d.problemas.forEach(p => {
    const k = p.toLowerCase().slice(0, 60);
    errosCount[k] = (errosCount[k] || 0) + 1;
  }));
  const errosFrequentes = Object.entries(errosCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([k, v]) => `"${k}" (${v}x)`);

  // Memoria anterior
  let memoriaAnterior = null;
  if (fs.existsSync(MEMORY_FILE)) {
    try { memoriaAnterior = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8')); } catch {}
  }

  const memAntStr = memoriaAnterior?.regras_copywriting?.length
    ? `VERSAO ANTERIOR (v${memoriaAnterior.versao}, score medio ${memoriaAnterior.score_medio}/100):\nRegras anteriores:\n${memoriaAnterior.regras_copywriting.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : 'SEM MEMORIA ANTERIOR (primeira execucao)';

  const prompt = `Voce e um especialista em copywriting B2B para outreach via Instagram DM.

Analise ${allData.length} mensagens avaliadas pelo reviewer e extraia padroes de aprendizado.

DADOS:
${JSON.stringify(allData, null, 2)}

ESTATISTICAS:
- Score medio: ${scoreMedio}/100
- Total amostras: ${allData.length}
- Mensagens reescritas pelo reviewer: ${totalMelhoradas}/${allData.length} (${taxaMelhoria}%)
- Erros mais frequentes: ${errosFrequentes.join(' | ')}

${memAntStr}

Gere um JSON com esta estrutura EXATA (sem markdown, sem backticks):
{
  "score_medio": ${scoreMedio},
  "total_amostras": ${allData.length},
  "taxa_melhoria_reviewer": ${taxaMelhoria},
  "padroes_eficazes": [
    "Padrao especifico que gerou score alto — max 5 itens, baseado nos dados reais"
  ],
  "erros_recorrentes": [
    "Erro formulado como REGRA NEGATIVA clara — max 5 itens, baseado nos dados reais"
  ],
  "regras_copywriting": [
    "REGRA POSITIVA obrigatoria, especifica e acionavel — max 8 itens, baseada nos dados"
  ],
  "criterios_reviewer_extras": [
    "Criterio extra de revisao para o reviewer checar — max 4 itens"
  ],
  "angulos_por_produto": {
    "lead_normalizer_api": {
      "melhor_angulo": "descrever o angulo que consistentemente funciona melhor",
      "ganchos_eficazes": ["exemplos de ganchos dos posts que foram bem aproveitados"],
      "evitar": ["padroes que geram score baixo para este produto"]
    }
  },
  "evolucao": {
    "score_anterior": ${memoriaAnterior?.score_medio || null},
    "score_atual": ${scoreMedio},
    "tendencia": "melhora ou piora ou estavel",
    "conquistas": ["o que melhorou desde versao anterior — ou vazio se primeira versao"],
    "proximas_melhorias": ["foco para o proximo batch de aprendizado"]
  }
}

RETORNE APENAS O JSON.`;

  console.log(`${C.cyan}[LEARNER] Sintetizando padroes com LLM (${allData.length} amostras)...${C.reset}`);

  const completion = await groq.chat.completions.create({
    messages:    [{ role: 'user', content: prompt }],
    model:       'llama-3.3-70b-versatile',
    temperature:  0.25,
    max_tokens:   2500,
  });

  const raw = completion.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM nao retornou JSON valido');

  const insights = JSON.parse(sanitizeJSON(jsonMatch[0]));

  const memoria = {
    versao:                    (memoriaAnterior?.versao || 0) + 1,
    ultima_atualizacao:        new Date().toISOString(),
    score_medio:               scoreMedio,
    total_amostras:            allData.length,
    taxa_melhoria_reviewer:    taxaMelhoria,
    padroes_eficazes:          insights.padroes_eficazes          || [],
    erros_recorrentes:         insights.erros_recorrentes         || [],
    regras_copywriting:        insights.regras_copywriting        || [],
    criterios_reviewer_extras: insights.criterios_reviewer_extras || [],
    angulos_por_produto:       insights.angulos_por_produto       || {},
    evolucao:                  insights.evolucao                  || {},
  };

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memoria, null, 2));

  // Output final
  console.log(`\n${C.green}[LEARNER] ✅ Memoria atualizada! (versao ${memoria.versao})${C.reset}`);
  console.log(`${C.cyan}[LEARNER] Score medio: ${memoria.score_medio}/100  (anterior: ${memoriaAnterior?.score_medio || 'N/A'})${C.reset}`);
  console.log(`${C.cyan}[LEARNER] Taxa reescrita reviewer: ${memoria.taxa_melhoria_reviewer}%${C.reset}`);
  console.log(`${C.cyan}[LEARNER] Regras aprendidas: ${memoria.regras_copywriting.length}${C.reset}`);
  console.log(`${C.cyan}[LEARNER] Criterios extras reviewer: ${memoria.criterios_reviewer_extras.length}${C.reset}`);

  if (memoria.erros_recorrentes.length) {
    console.log(`\n${C.yellow}[LEARNER] Erros recorrentes detectados:${C.reset}`);
    memoria.erros_recorrentes.forEach(e => console.log(`  ⚠️  ${e}`));
  }
  if (memoria.regras_copywriting.length) {
    console.log(`\n${C.green}[LEARNER] Regras de copywriting aprendidas:${C.reset}`);
    memoria.regras_copywriting.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  }

  const tendencia = memoria.evolucao?.tendencia || 'estavel';
  const icon = { melhora: '📈', piora: '📉', estavel: '➡️' }[tendencia] || '➡️';
  console.log(`\n${C.blue}[LEARNER] Tendencia: ${icon} ${tendencia.toUpperCase()}${C.reset}`);
  if (memoria.evolucao?.proximas_melhorias?.length) {
    console.log(`${C.blue}[LEARNER] Foco proximo batch: ${memoria.evolucao.proximas_melhorias[0]}${C.reset}`);
  }
  console.log(`${C.blue}[LEARNER] Arquivo: ${MEMORY_FILE}${C.reset}\n`);

  return memoria;
}

module.exports = { runLearner };

if (require.main === module) {
  runLearner().catch(err => {
    console.error('[LEARNER] Erro fatal:', err.message);
    process.exit(1);
  });
}
