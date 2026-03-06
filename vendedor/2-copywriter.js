// =============================================================
// MODULO 2: COPYWRITER AI - PRISMATIC LABS VENDEDOR AUTOMATICO
// Gera DM hiperpersonalizada baseada no produto detectado pelo Analyzer
// Stack: Groq API (Llama 3.3 70B) - GRATIS
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
    const raw = fs.readFileSync(analysisFile, 'utf8');
    analysisData = JSON.parse(raw);
  } catch (e) {
    const envData = process.env.ANALYSIS_OUTPUT;
    if (envData) { analysisData = JSON.parse(envData); }
    else { console.error('[COPYWRITER] Erro: Analise nao encontrada. Execute o Modulo 1 primeiro.'); process.exit(1); }
  }

  const a = analysisData.analise;
  const isAPI = a.servico_ideal === 'lead_normalizer_api';

  let contexto_produto;
  if (isAPI) {
    const api = produtos.find(p => p.id === 'lead-normalizer-api');
    const objecoesStr = api.objecoes.map(o => `"${o.objecao}" -> "${o.resposta}"`).join('\n');
    contexto_produto = `PRODUTO: Lead Normalizer API\nURL: ${api.url_landing}\nTagline: ${api.tagline_pt}\nO que faz: ${api.one_liner}\nUSPs: ${api.usp.slice(0, 3).join(' | ')}\nPrecos: Free (100 req/mes, sem cartao), Starter $29/mes, Pro $79/mes\nObjecoes:\n${objecoesStr}\nTom: dev para dev, direto, tecnico-amigavel, SEM pitch de vendas explícito`;
  } else {
    contexto_produto = `PRODUTO: Landing Page Premium Dark Mode + Neon\nO que faz: landing pages premium de alta conversao para infoprodutores\nPrecos: R$1.497 a R$5.997\nDiferenciais: dark mode exclusivo, conversao 15-25% vs media 5-10%, entrega 10-15 dias\nTom: aspiracional, focado em resultado e autoridade`;
  }

  const exemplos = isAPI
    ? templates.templates_api.map(t => `Exemplo: "${t.template.substring(0, 100)}..."`).join('\n')
    : templates.templates_landing_page.map(t => `Exemplo: "${t.template.substring(0, 100)}..."`).join('\n');

  const prompt = `Voce e o melhor copywriter do Brasil para vendas B2B via DM no Instagram.

${contexto_produto}

DADOS DO LEAD:
- Username: @${username} (use apenas para referencia interna, NAO coloque no texto)
- Nicho: ${a.nicho}
- Tipo de negocio: ${a.tipo_negocio}
- Problema principal: ${a.problema_principal}
- Nivel de consciencia: ${a.nivel_consciencia}
- Angulo de abordagem: ${a.angulo_abordagem}
- Objecoes previstas: ${JSON.stringify(a.objecoes_previstas)}
- Motivo do produto ser ideal: ${a.motivo_produto}
- Prioridade: ${a.prioridade}

EXEMPLOS DE TOM (adapte, nao copie literal):
${exemplos}

REGRAS ABSOLUTAS — VIOLACAO = MENSAGEM INVALIDA:
1. NUNCA coloque @handle ou nome da pessoa no corpo da mensagem — no DM ja se sabe com quem fala
2. Maximo 4 linhas por mensagem
3. NAO mencionar preco na primeira mensagem
4. NAO comece com "Vi seu perfil", "Parabens pelo conteudo", "Estou impressionado" — soa falso
5. Termine SEMPRE com UMA pergunta que tenha resposta curta (sim/nao ou 1 palavra)
6. Tom: colega que descobriu algo util, nao vendedor
7. Seja especifico ao problema do nicho dele, nao generico
8. A mensagem deve parecer escrita por um humano que conhece o problema

GERE 3 VARIACOES em JSON:
{
  "mensagem_1": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_2": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_3": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_recomendada": "1, 2 ou 3",
  "motivo_recomendacao": "por que esta e a melhor para este lead",
  "followup_dia_3": "followup leve dia 3 sem resposta (max 2 linhas, sem @handle)",
  "followup_dia_7": "followup com resultado concreto dia 7 (max 2 linhas, sem @handle)",
  "followup_dia_14": "followup final com oferta especifica dia 14 (max 3 linhas, sem @handle)"
}

RESPONDA APENAS O JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
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
      mensagens: messages
    };

    const outputFile = path.join(outputDir, `${username}_mensagens.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    const recKey = `mensagem_${messages.mensagem_recomendada}`;
    const recMsg = messages[recKey];
    const produtoLabel = isAPI ? '🔵 Lead Normalizer API' : '🟣 Landing Page';

    console.log(`\n[COPYWRITER] Mensagens geradas com sucesso!`);
    console.log(`[COPYWRITER] Produto: ${produtoLabel}`);
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
