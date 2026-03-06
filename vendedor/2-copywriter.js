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
    contexto_produto = `PRODUTO: Lead Normalizer API
URL: ${api.url_landing}
Tagline: ${api.tagline_pt}
O que faz: ${api.one_liner}
USPs: ${api.usp.slice(0, 3).join(' | ')}
Precos: Free (100 req/mes, sem cartao), Starter $29/mes, Pro $79/mes
Objecoes:\n${objecoesStr}
Tom: dev para dev, direto, sem pitch formal, parece mensagem de colega`;
  } else {
    contexto_produto = `PRODUTO: Landing Page Premium Dark Mode + Neon
O que faz: LP de alta conversao para infoprodutores
Precos: R$1.497 a R$5.997
Diferenciais: dark mode exclusivo, conversao 15-25% vs media 5-10%, entrega 10-15 dias
Tom: aspiracional, focado em resultado, parece conselho de colega que entende do mercado`;
  }

  // ---- FEW-SHOT EXAMPLES ----
  const templateGroup = isAPI ? templates.templates_api : templates.templates_landing_page;
  const fewShot = templateGroup
    .flatMap(t => (t.mensagens_exemplo || []).slice(0, 2))
    .slice(0, 4)
    .map((m, i) => `=== Exemplo ${i + 1} (SIGA ESTE FORMATO) ===\n${m}`)
    .join('\n\n');

  // ---- CONTEXTO DE POSTS ----
  const postsContext = ap.tem_posts_analisados
    ? `\nINSIGHTS DOS POSTS (use para personalizar a mensagem 1):
- Ferramentas: ${(ap.ferramentas_mencionadas || []).join(', ') || 'nenhuma'}
- Dores nos posts: ${(ap.dores_identificadas || []).join(' | ') || 'nenhuma'}
- Oportunidades: ${(ap.oportunidades || []).join(' | ') || 'nenhuma'}
- GANCHO IDEAL: ${ap.gancho_ideal || 'nenhum'}

Instrucao: mensagem_1 DEVE abrir com o gancho ideal acima.`
    : '';

  // ---- MODELO DE ESTRUTURA IDEAL ----
  const estruturaIdealAPI = `ESTRUTURA OBRIGATORIA DE CADA MENSAGEM (3 partes):

PARTE 1 - HOOK (1 linha): Referencia especifica ao problema/ferramenta/post do lead.
Exemplo: "Seus flows do Make quebravam quando o lead digitava (11) 98765-4321 em vez de 11987654321?"

PARTE 2 - VALOR (1-2 linhas): O que a API faz + beneficio concreto + prova (plano free/velocidade/facilidade).
Exemplo: "Fiz uma API que normaliza qualquer formato BR para E.164 automaticamente — plug direto no Make ou n8n. Plano free sem cartao."

PARTE 3 - PERGUNTA (1 linha): Pergunta de resposta simples (sim/nao ou 1 palavra).
Exemplo: "Vale testar?"

CADA MENSAGEM DEVE TER AS 3 PARTES. Mensagem de 1 so linha e INVALIDA.`;

  const estruturaIdealLP = `ESTRUTURA OBRIGATORIA DE CADA MENSAGEM (3 partes):

PARTE 1 - HOOK (1 linha): Referencia especifica ao problema de conversao ou lancamento do lead.
Exemplo: "Qual a conversao atual da sua pagina de captura?"

PARTE 2 - VALOR (1-2 linhas): O que voce entrega + resultado concreto + diferencial.
Exemplo: "Faco LP dark mode premium pra infoprodutores — clientes chegando a 22% de conversao vs media de 6%."

PARTE 3 - PERGUNTA (1 linha): Pergunta de resposta simples.
Exemplo: "Posso te mostrar um case do seu nicho?"

CADA MENSAGEM DEVE TER AS 3 PARTES. Mensagem de 1 so linha e INVALIDA.`;

  const estruturaIdeal = isAPI ? estruturaIdealAPI : estruturaIdealLP;

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

${estruturaIdeal}

EXEMPLOS DE QUALIDADE (siga exatamente este estilo e comprimento):
${fewShot}

REGRAS ABSOLUTAS:
1. NUNCA coloque @handle no corpo da mensagem
2. NUNCA gere mensagem de 1 so linha — minimo 3 linhas (hook + valor + pergunta)
3. NAO mencione preco na primeira mensagem
4. NAO comece com "Vi seu perfil", "Parabens", "Notei que" — soa falso
5. Termine SEMPRE com pergunta de resposta curta
6. Tom: colega que descobriu algo util — NUNCA vendedor formal
7. Followups: 2-3 linhas, naturais, sem pressao, sem "ultima chance" dramatico

GERE 3 VARIACOES em JSON:
{
  "mensagem_1": {"texto": "linha 1\n\nlinha 2\n\nlinha 3", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_2": {"texto": "linha 1\n\nlinha 2\n\nlinha 3", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_3": {"texto": "linha 1\n\nlinha 2\n\nlinha 3", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_recomendada": "1, 2 ou 3",
  "motivo_recomendacao": "por que esta e a melhor para este lead especifico",
  "followup_dia_3": "2-3 linhas naturais, sem @handle, sem pressao",
  "followup_dia_7": "2-3 linhas com resultado concreto ou valor gratuito",
  "followup_dia_14": "2-3 linhas com oferta especifica, tom leve nao desesperado"
}

RESPONDA APENAS O JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.65,
      max_tokens: 2500,
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
    const postsLabel = ap.tem_posts_analisados ? ' + posts \u2713' : '';

    console.log(`\n[COPYWRITER] Mensagens geradas!`);
    console.log(`[COPYWRITER] Produto: ${produtoLabel}${postsLabel}`);
    console.log(`[COPYWRITER] Recomendada: #${messages.mensagem_recomendada} — ${messages.motivo_recomendacao}`);
    console.log(`\n========== COPIE E COLE ESTA MENSAGEM ==========`);
    console.log(recMsg?.texto);
    console.log(`================================================\n`);
    console.log(`[COPYWRITER] Arquivo: ${outputFile}`);
    console.log(`\nMESSAGES_OUTPUT=${JSON.stringify(result)}`);

    return result;
  } catch (error) {
    console.error('[COPYWRITER] Erro:', error.message);
    process.exit(1);
  }
}

generateMessage();
