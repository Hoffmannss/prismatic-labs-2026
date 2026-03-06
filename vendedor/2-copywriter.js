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

// ---- CARREGAR KNOWLEDGE BASE ----
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
    if (envData) {
      analysisData = JSON.parse(envData);
    } else {
      console.error('[COPYWRITER] Erro: Analise nao encontrada. Execute o Modulo 1 primeiro.');
      process.exit(1);
    }
  }

  const a = analysisData.analise;
  const isAPI = a.servico_ideal === 'lead_normalizer_api';

  // ---- CONTEXTO DO PRODUTO CORRETO ----
  let contexto_produto;
  if (isAPI) {
    const api = produtos.find(p => p.id === 'lead-normalizer-api');
    const objecoesStr = api.objecoes.map(o => `"${o.objecao}" -> "${o.resposta}"`).join('\n');
    contexto_produto = `
PRODUTO: Lead Normalizer API
URL: ${api.url_landing}
Tagline: ${api.tagline_pt}
O que faz: ${api.one_liner}
USPs principais: ${api.usp.slice(0, 3).join(' | ')}
Precos: Free (100 req/mes, sem cartao), Starter $29/mes (5k req), Pro $79/mes (25k req)
Objecoes e respostas:
${objecoesStr}
Exemplos de uso para o nicho dele: ${api.casos_uso.slice(0, 2).join(' | ')}
Tom das mensagens: dev para dev, direto, tecnico-amigavel`;
  } else {
    const lp = produtos.find(p => p.id === 'landing-page-premium');
    contexto_produto = `
PRODUTO: Landing Page Premium Dark Mode + Neon
O que faz: landing pages premium de alta conversao para infoprodutores
Precos: R$1.497 (Essencial), R$2.497 (Premium), R$3.997 (Elite), R$5.997 (Pacote 3 LPs)
Diferenciais: design dark mode exclusivo, conversao 15-25% (mercado e 5-10%), entrega em 10-15 dias
Tom das mensagens: aspiracional, focado em resultado e autoridade`;
  }

  // ---- EXEMPLOS DO TEMPLATE CORRETO ----
  const exemplos = isAPI
    ? templates.templates_api.map(t => `Exemplo (${t.nome}): "${t.template.substring(0, 120)}..."`).join('\n')
    : templates.templates_landing_page.map(t => `Exemplo (${t.nome}): "${t.template.substring(0, 120)}..."`).join('\n');

  const prompt = `Voce e o MELHOR COPYWRITER do Brasil para vendas B2B via DM no Instagram.

${contexto_produto}

DADOS DO LEAD:
- Username: @${username}
- Nicho: ${a.nicho}
- Tipo de negocio: ${a.tipo_negocio}
- Problema principal: ${a.problema_principal}
- Nivel de consciencia: ${a.nivel_consciencia}
- Urgencia: ${a.urgencia_estimada}
- Angulo de abordagem: ${a.angulo_abordagem}
- Objecoes previstas: ${JSON.stringify(a.objecoes_previstas)}
- Motivo do produto ser ideal para ele: ${a.motivo_produto}
- Prioridade: ${a.prioridade}

EXEMPLOS DE ESTILO (adapte, nao copie):
${exemplos}

REGRAS ABSOLUTAS:
1. Maximo 4 linhas por mensagem
2. NAO mencionar preco na primeira mensagem
3. NAO parecer automatizado ou generico
4. Comecar com algo ESPECIFICO do perfil dele (nao generico)
5. Terminar com UMA pergunta que gere resposta facil (sim/nao ou curta)
6. Tom: colega que descobriu algo util, nao vendedor
7. Usar o problema principal como gancho
8. NAO dizer "vi seu perfil" ou "parabens pelo conteudo" - e batido

GERE 3 VARIACOES em JSON:
{
  "mensagem_1": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_2": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_3": {"texto": "...", "angulo": "...", "temperatura": "direta/suave/curiosidade"},
  "mensagem_recomendada": "1, 2 ou 3",
  "motivo_recomendacao": "por que esta e a melhor para este lead",
  "followup_dia_3": "followup natural caso nao responda em 3 dias",
  "followup_dia_7": "followup caso nao responda em 7 dias",
  "followup_dia_14": "followup final com oferta especifica"
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
      username: username,
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
