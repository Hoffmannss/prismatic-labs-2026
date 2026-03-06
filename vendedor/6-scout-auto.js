// =============================================================
// MODULO 6B: SCOUT AUTOMATICO - PRISMATIC LABS VENDEDOR AI
// Busca leads REAIS no Instagram via Apify + pontua com IA
//
// Uso: node 6-scout-auto.js [nicho] [quantidade]
// Ex:  node 6-scout-auto.js api-trafego 30
// Ex:  node 6-scout-auto.js lp-infoprodutor 20
// =============================================================

require('dotenv').config();
const https   = require('https');
const fs      = require('fs');
const path    = require('path');
const Groq    = require('groq-sdk');

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const DB_FILE     = path.join(__dirname, '..', 'data', 'crm', 'leads-database.json');
const SCOUT_DIR   = path.join(__dirname, '..', 'data', 'scout');

const NICHO    = process.argv[2] || 'api-trafego';
const QTD      = parseInt(process.argv[3]) || 25;

const C = {
  reset:'\x1b[0m', bright:'\x1b[1m', green:'\x1b[32m',
  yellow:'\x1b[33m', red:'\x1b[31m', cyan:'\x1b[36m',
  magenta:'\x1b[35m', blue:'\x1b[34m'
};

// ---- REUSA NICHOS DO SCOUT MANUAL ----
const { NICHOS } = require('./6-scout');

// ---- KEYWORDS DE NEGOCIO (sinais de SMB/dono) ----
const BUSINESS_SIGNALS = [
  'fundador','founder','ceo','sócio','dono','dona','diretor',
  'agência','agency','consultoria','consulting','especialista',
  'mentor','coach','terapeuta','clínica','escritório','estúdio',
  'atendo','agenda','contato','orçamento','parceria','serviço',
  'clientes','resultados','vendas','faturamento','crescimento'
];

const PAIN_SIGNALS = [
  'mais clientes','crescer','divulgação','visibilidade',
  'leads','conversão','tráfego','captação','prospecção',
  'escalando','escalar','automatizar','processo','sistema'
];

// ---- HTTP HELPER ----
function apiRequest(method, host, pathUrl, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const qs = token ? `?token=${token}` : '';
    const opts = {
      hostname: host,
      path: pathUrl + qs,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- INICIAR RUN APIFY ----
async function startApifyRun(hashtags, limit) {
  console.log(`\n${C.cyan}[APIFY] Iniciando scraping de ${hashtags.length} hashtags (limite: ${limit} posts)...${C.reset}`);
  hashtags.forEach(h => console.log(`  ${h}`));

  const res = await apiRequest(
    'POST',
    'api.apify.com',
    '/v2/acts/apify~instagram-hashtag-scraper/runs',
    {
      hashtags:     hashtags.map(h => h.replace('#', '')),
      resultsLimit: limit,
      proxy: { useApifyProxy: true }
    },
    APIFY_TOKEN
  );

  if (res.status !== 201 && res.status !== 200) {
    console.error(`${C.red}[APIFY] Erro ao iniciar run: ${JSON.stringify(res.body.error || res.body)}${C.reset}`);
    if (res.status === 401) console.log('  -> Verifique APIFY_API_TOKEN no .env');
    return null;
  }

  const runId = res.body.data?.id;
  console.log(`${C.cyan}[APIFY] Run iniciado: ${runId}${C.reset}`);
  return runId;
}

// ---- AGUARDAR CONCLUSAO ----
async function waitForRun(runId, maxMinutes = 8) {
  const maxPolls = maxMinutes * 12; // a cada 5s
  console.log(`${C.yellow}[APIFY] Aguardando resultados`);

  for (let i = 0; i < maxPolls; i++) {
    await sleep(5000);
    const res = await apiRequest('GET', 'api.apify.com', `/v2/actor-runs/${runId}`, null, APIFY_TOKEN);
    const status = res.body.data?.status;
    process.stdout.write('.');

    if (status === 'SUCCEEDED') {
      console.log(` ${C.green}OK${C.reset}`);
      return true;
    }
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      console.log(` ${C.red}${status}${C.reset}`);
      return false;
    }
  }
  console.log(` ${C.red}TIMEOUT${C.reset}`);
  return false;
}

// ---- BUSCAR RESULTADOS ----
async function getResults(runId, limit) {
  const res = await apiRequest(
    'GET', 'api.apify.com',
    `/v2/actor-runs/${runId}/dataset/items`,
    null,
    `${APIFY_TOKEN}&limit=${limit * 5}` // pega mais para ter margem de filtragem
  );
  if (res.status !== 200) {
    console.error(`${C.red}[APIFY] Erro ao buscar resultados: ${res.status}${C.reset}`);
    return [];
  }
  return Array.isArray(res.body) ? res.body : (res.body.items || []);
}

// ---- CARREGAR USERNAMES JA NO CRM ----
function loadCRMUsernames() {
  if (!fs.existsSync(DB_FILE)) return new Set();
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  return new Set((db.leads || []).map(l => l.username?.toLowerCase()));
}

// ---- PONTUAR LEAD (sem API) ----
function scoreKeywords(username, caption, config) {
  const text = (caption || '').toLowerCase();
  let score = 0;

  // relevancia para o nicho
  config.keywords_bio.forEach(k => { if (text.includes(k.toLowerCase())) score += 8; });

  // sinais de negocio
  BUSINESS_SIGNALS.forEach(k => { if (text.includes(k)) score += 5; });

  // sinais de dor
  PAIN_SIGNALS.forEach(k => { if (text.includes(k)) score += 7; });

  // engajamento (bonus)
  return Math.min(score, 100);
}

// ---- SCORING IA (top leads) ----
async function scoreWithGroq(leads, config) {
  if (!process.env.GROQ_API_KEY || leads.length === 0) return leads;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const batch = leads.slice(0, 15);

  const lista = batch.map((l, i) =>
    `${i + 1}. @${l.username} | posts: ${l.totalPosts} | caption recente: "${(l.caption || '').slice(0, 200)}"`
  ).join('\n');

  const prompt = `Voce e um analista de prospecção B2B no Brasil.
Nicho alvo: ${config.nome}
Produto: ${config.produto}
Dor principal: ${config.dor_principal}

Avalie os ${batch.length} perfis do Instagram abaixo e para cada um retorne:
- score: 0-100 (chance de ser um bom lead para o produto)
- prioridade: hot/warm/cold
- motivo: 1 frase explicando (max 80 chars)

${lista}

Responda APENAS JSON:
{"avaliacoes":[{"index":1,"score":0,"prioridade":"cold","motivo":""}]}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1200
    });
    const raw  = completion.choices[0]?.message?.content || '{}';
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');
    const avals = json.avaliacoes || [];

    avals.forEach(a => {
      if (leads[a.index - 1]) {
        leads[a.index - 1].score_ia     = a.score;
        leads[a.index - 1].prioridade   = a.prioridade;
        leads[a.index - 1].motivo_ia    = a.motivo;
      }
    });
  } catch(e) {
    console.log(`${C.yellow}[SCOUT] Avaliacao IA falhou, usando scoring por keywords${C.reset}`);
  }

  return leads;
}

// ---- MAIN ----
async function main() {
  if (!APIFY_TOKEN) {
    console.error(`${C.red}[SCOUT AUTO] APIFY_API_TOKEN nao encontrado no .env${C.reset}`);
    console.log(`\nComo obter o token:`);
    console.log(`  1. Acesse https://console.apify.com`);
    console.log(`  2. Crie uma conta gratuita (U$5 de credito todo mes)`);
    console.log(`  3. Va em Settings -> API & Integrations -> API tokens`);
    console.log(`  4. Copie o token e adicione ao .env: APIFY_API_TOKEN=apify_api_...`);
    process.exit(1);
  }

  const config = NICHOS[NICHO];
  if (!config) {
    console.error(`${C.red}[SCOUT AUTO] Nicho invalido: ${NICHO}${C.reset}`);
    console.log('Nichos disponíveis:', Object.keys(NICHOS).join(' | '));
    process.exit(1);
  }

  if (!fs.existsSync(SCOUT_DIR)) fs.mkdirSync(SCOUT_DIR, { recursive: true });

  console.log(`\n${C.magenta}${'='.repeat(60)}${C.reset}`);
  console.log(`${C.bright}  SCOUT AUTOMATICO — ${config.nome}${C.reset}`);
  console.log(`${C.magenta}${'='.repeat(60)}${C.reset}`);
  console.log(`  Produto alvo: ${C.green}${config.produto}${C.reset}`);
  console.log(`  Meta: ${C.cyan}${QTD} leads rankeados${C.reset}`);

  // 1. Iniciar Apify
  const runId = await startApifyRun(config.hashtags.slice(0, 4), QTD * 6);
  if (!runId) process.exit(1);

  // 2. Aguardar
  const ok = await waitForRun(runId);
  if (!ok) { console.error(`${C.red}[SCOUT AUTO] Run falhou.${C.reset}`); process.exit(1); }

  // 3. Resultados
  const posts = await getResults(runId, QTD);
  console.log(`\n${C.cyan}[SCOUT AUTO] ${posts.length} posts coletados${C.reset}`);

  if (!posts.length) {
    console.log(`${C.yellow}Sem resultados. Tente outro nicho ou verifique seu plano Apify.${C.reset}`);
    process.exit(0);
  }

  // 4. Agrupar por username
  const jaCRM = loadCRMUsernames();
  const perfilMap = {};

  for (const post of posts) {
    const u = (post.ownerUsername || '').toLowerCase();
    if (!u || jaCRM.has(u)) continue;
    if (!perfilMap[u]) {
      perfilMap[u] = {
        username:   u,
        fullName:   post.ownerFullName || '',
        caption:    post.caption || '',
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        ultimoPost: post.timestamp || ''
      };
    }
    perfilMap[u].totalPosts++;
    perfilMap[u].totalLikes    += post.likesCount    || 0;
    perfilMap[u].totalComments += post.commentsCount || 0;
    if (post.caption && post.caption.length > perfilMap[u].caption.length) {
      perfilMap[u].caption = post.caption;
    }
  }

  let leads = Object.values(perfilMap);
  console.log(`${C.cyan}[SCOUT AUTO] ${leads.length} perfis unicos encontrados (${jaCRM.size} ja no CRM ignorados)${C.reset}`);

  // 5. Scoring por keywords
  leads = leads.map(l => ({
    ...l,
    score_kw:   scoreKeywords(l.username, l.caption, config),
    engajamento: l.totalPosts > 0 ? Math.round((l.totalLikes + l.totalComments) / l.totalPosts) : 0
  }));

  // Sort por score keyword + engajamento
  leads.sort((a, b) => (b.score_kw + b.engajamento * 0.1) - (a.score_kw + a.engajamento * 0.1));
  leads = leads.slice(0, QTD);

  // 6. Scoring IA nos melhores
  console.log(`\n${C.blue}[SCOUT AUTO] Avaliando top leads com IA Groq...${C.reset}`);
  leads = await scoreWithGroq(leads, config);

  // Score final combinado
  leads = leads.map(l => ({
    ...l,
    score_final: Math.round((l.score_ia || l.score_kw || 0) * 0.7 + l.engajamento * 0.3)
  }));
  leads.sort((a, b) => b.score_final - a.score_final);

  // 7. Salvar
  const hoje    = new Date().toISOString().split('T')[0];
  const outFile = path.join(SCOUT_DIR, `auto-${hoje}-${NICHO}.json`);
  fs.writeFileSync(outFile, JSON.stringify({
    geradoEm: new Date().toISOString(),
    nicho: NICHO,
    config: { nome: config.nome, produto: config.produto },
    total: leads.length,
    leads
  }, null, 2));

  // 8. Display
  console.log(`\n${C.magenta}${'='.repeat(60)}${C.reset}`);
  console.log(`${C.bright}  LEADS ENCONTRADOS — TOP ${leads.length}${C.reset}`);
  console.log(`${C.magenta}${'='.repeat(60)}${C.reset}`);

  leads.forEach((l, i) => {
    const pCor = l.prioridade === 'hot' ? C.red : l.prioridade === 'warm' ? C.yellow : C.cyan;
    const badge = l.prioridade ? `${pCor}[${l.prioridade.toUpperCase()}]${C.reset}` : '';
    console.log(`\n  ${C.bright}${i + 1}. @${l.username}${C.reset} ${badge}  score: ${l.score_final}`);
    if (l.fullName) console.log(`     Nome: ${l.fullName}`);
    if (l.caption)  console.log(`     Post: "${l.caption.slice(0, 100)}..."`);
    if (l.motivo_ia) console.log(`     ${C.green}→ ${l.motivo_ia}${C.reset}`);
    console.log(`     Engajamento medio: ${l.engajamento} | Posts coletados: ${l.totalPosts}`);
  });

  // 9. Comandos prontos para os top 5
  const top5 = leads.filter(l => l.prioridade !== 'cold').slice(0, 5);

  console.log(`\n${C.magenta}${'='.repeat(60)}${C.reset}`);
  console.log(`${C.bright}  ANALISAR AGORA — top ${top5.length} mais promissores${C.reset}`);
  console.log(`${C.magenta}${'='.repeat(60)}${C.reset}`);

  top5.forEach(l => {
    console.log(`\n  ${C.green}node 5-orchestrator.js analyze @${l.username} "${l.caption.slice(0,60).replace(/\n/g,' ')}" 5000 10${C.reset}`);
  });

  console.log(`\n  Lista completa salva em: ${C.cyan}${outFile}${C.reset}`);
  console.log(`${C.magenta}${'='.repeat(60)}${C.reset}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
