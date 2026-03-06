// =============================================================
// MODULO 2: COPYWRITER AI - PRISMATIC LABS VENDEDOR AUTOMATICO
// Gera DM hiperpersonalizada usando few-shot + analise de posts
// =============================================================

require('dotenv').config();
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const username = process.argv[2] || process.env.LEAD_USERNAME;
const analysisFile = path.join(__dirname, '..', 'data', 'leads', `${username}_analysis.json`);

const templates = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'copywriting-templates.json'), 'utf8'));
const produtos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'produtos.json'), 'utf8')).produtos;

async function generateMessage() {
  console.log(`\n[COPYWRITER] Gerando mensagem para: @${username}`);

  let analysisData;
  try {
    analysisData = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
  } catch (e) {
    const envData = process.env.ANALYSIS_OUTPUT;
    if (envData) { analysisData = JSON.parse(envData); }
    else { console.error('[COPYWRITER] Analise nao encontrada. Execute o Modulo 1 primeiro.'); process.exit(1); }
  }

  const a = analysisData.analise;
  const isAPI = a.servico_ideal === 'lead_normalizer_api';
  const ap = a.analise_posts || {};

  // ---- CONTEXTO DO PRODUTO ----
  let contexto_produto;
  if (isAPI) {
    const api = produtos.find(p => p.id === 'lead-normalizer-api');
    const objecoesStr = api.objecoes.map(o => `"${o.objecao}" -> "${o.resposta}"`).join('\n');
    contexto_produto = `PRODUTO: Lead Normalizer API\nURL: ${api.url_landing}\nTagline: ${api.tagline_pt}\nO que faz: ${api.one_liner}\nUSPs: ${api.usp.slice(0, 3).join(' | ')}\nPrecos: Free (100 req/mes, sem cartao), Starter $29/mes, Pro $79/mes\nObjecoes:\n${objecoesStr}\nTom: dev para dev, direto, sem pitch formal, parece mensagem de colega`;
  } else {
    contexto_produto = `PRODUTO: Landing Page Premium Dark Mode + Neon\nO que faz: LP de alta conversao para infoprodutores\nPrecos: R$1.497 a R$5.997\nDiferenciais: dark mode exclusivo, conversao 15-25% vs media 5-10%, entrega 10-15 dias\nTom: aspiracional, focado em resultado, parece conselho de colega que entende do mercado`;
  }

  // ---- FEW-SHOT EXAMPLES DO TEMPLATE CORRETO ----
  const templateGroup = isAPI ? templates.templates_api : templates.templates_landing_page;
  const fewShot = templateGroup
    .flatMap(t => (t.mensagens_exemplo || []).slice(0, 2))
    .slice(0, 5)
    .map((m, i) => `--- Exemplo ${i + 1} ---\n${m}`)
    .join('\n\n');

  // ---- CONTEXTO DE POSTS (se disponivel) ----
  const postsContext = ap.tem_posts_analisados
    ? `\nINSIGHTS DOS POSTS DO LEAD (use para personalizar):
- Ferramentas que usa: ${(ap.ferramentas_mencionadas || []).join(', ') || 'nao identificadas'}
- Dores identificadas nos posts: ${(ap.dores_identificadas || []).join(' | ') || 'nao identificadas'}
- Oportunidades especificas: ${(ap.oportunidades || []).join(' | ') || 'nenhuma'}
- GANCHO IDEAL detectado: ${ap.gancho_ideal || 'nenhum'}

Se o gancho ideal foi identificado, USE ELE como abertura da mensagem #1.`
    : '';

  const prompt = `Voce e o melhor copywriter do Brasil para vendas B2B via DM no Instagram.

${contexto_produto}

DADOS DO LEAD:
- Nicho: ${a.nicho}
- Tipo de negocio: ${a.tipo_negocio}
- Problema principal: ${a.problema_principal}
- Nivel de consciencia: ${a.nivel_consciencia}
- Angulo de abordagem: ${a.angulo_abordagem}
- Objecoes previstas: ${JSON.stringify(a.objecoes_previstas)}
- Motivo do produto ser ideal: ${a.motivo_produto}
- Prioridade: ${a.prioridade}
${postsContext}

EXEMPLOS DE MENSAGENS IDEAIS (siga este ESTILO e QUALIDADE — nao copie, personalize):
${fewShot}

REGRAS ABSOLUTAS — VIOLACAO = MENSAGEM INVALIDA:
1. NUNCA coloque @handle, nome ou apelido no corpo da mensagem
2. Maximo 4 linhas por mensagem
3. NAO mencione preco na primeira mensagem
4. NAO comece com "Vi seu perfil", "Parabens", "Estou impressionado", "Notei que" — soa falso
5. Termine SEMPRE com pergunta de resposta curta (sim/nao ou 1 palavra)
6. Tom: colega que descobriu algo util — NUNCA vendedor
7. Seja especifico ao problema do nicho — NUNCA generico
8. Followups: max 2 linhas, naturais, sem pressao

GERE 3 VARIACOES em JSON:
{
  "mensagem_1": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_2": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_3": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_recomendada": "1, 2 ou 3",
  "motivo_recomendacao": "por que esta e a melhor para este lead especifico",
  "followup_dia_3": "(max 2 linhas, sem @handle, natural)",
  "followup_dia_7": "(max 2 linhas, resultado concreto ou valor gratuito)",
  "followup_dia_14": "(max 3 linhas, oferta final com prazo, sem desespero)"
}

RESPONDA APENAS O JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.65,
      max_tokens: 2048,
    });

    const rawResponse = completion.choices[0].message.content.trim();
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta nao contem JSON valido');
    const messages = JSON.parse(jsonMatch[0]);

    const outputDir = path.join(__dirname, '..', 'data', 'mensagens');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const result = {
      timestamp: new Date().toISOString(),
      username,
      produto_detectado: a.servico_ideal,
      analise_score: a.score_potencial,
      prioridade: a.prioridade,
      posts_analisados: ap.tem_posts_analisados || false,
      mensagens: messages
    };

    const outputFile = path.join(outputDir, `${username}_mensagens.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    const recKey = `mensagem_${messages.mensagem_recomendada}`;
    const recMsg = messages[recKey];
    const produtoLabel = isAPI ? '\ud83d\udd35 Lead Normalizer API' : '\ud83d\udfe3 Landing Page';
    const postsLabel = ap.tem_posts_analisados ? ' + posts analisados \u2713' : '';

    console.log(`\n[COPYWRITER] Mensagens geradas!`);
    console.log(`[COPYWRITER] Produto: ${produtoLabel}${postsLabel}`);
    console.log(`[COPYWRITER] Mensagem recomendada: #${messages.mensagem_recomendada}`);
    console.log(`[COPYWRITER] Motivo: ${messages.motivo_recomendacao}`);
    console.log(`\n========== COPIE E COLE ESTA MENSAGEM ==========`);
    console.log(recMsg?.texto);
    console.log(`================================================\n`);
    console.log(`[COPYWRITER] Arquivo salvo: ${outputFile}`);
    console.log(`\nMESSAGES_OUTPUT=${JSON.stringify(result)}`);

    return result;
  } catch (error) {
    console.error('[COPYWRITER] Erro:', error.message);
    process.exit(1);
  }
}

generateMessage();
