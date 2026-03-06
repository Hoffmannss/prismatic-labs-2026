// =============================================================
// MODULO 1: ANALYZER AI - PRISMATIC LABS VENDEDOR AUTOMATICO
// Analisa perfil Instagram e detecta produto ideal (API ou LP)
// Stack: Groq API (Llama 3.3 70B) - GRATIS
// =============================================================

require('dotenv').config();
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ---- CARREGAR KNOWLEDGE BASE ----
const nichosConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'nichos-config.json'), 'utf8'));
const produtos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'produtos.json'), 'utf8')).produtos;

// ---- DADOS DO LEAD ----
const username = process.argv[2] || process.env.LEAD_USERNAME || 'exemplo_lead';
const bioText = process.argv[3] || process.env.LEAD_BIO || '';
const followersCount = process.argv[4] || process.env.LEAD_FOLLOWERS || '0';
const postsCount = process.argv[5] || process.env.LEAD_POSTS || '0';
const recentPostsDesc = process.argv[6] || process.env.LEAD_POSTS_DESC || '';

// ---- MONTAR CONTEXTO DOS PRODUTOS ----
const api = produtos.find(p => p.id === 'lead-normalizer-api');
const lp = produtos.find(p => p.id === 'landing-page-premium');

const nichosSinaisAPI = nichosConfig.nichos
  .filter(n => n.produto_alvo === 'lead_normalizer_api')
  .map(n => `- ${n.nome}: sinais [${n.sinais ? n.sinais.join(', ') : n.keywords.join(', ')}]`)
  .join('\n');

async function analyzeProfile() {
  console.log(`\n[ANALYZER] Iniciando analise do perfil: @${username}`);
  console.log(`[ANALYZER] Seguidores: ${followersCount} | Posts: ${postsCount}`);

  const prompt = `Voce e o SUPER VENDEDOR da Prismatic Labs.

A Prismatic Labs tem 2 produtos:

PRODUTO A - Lead Normalizer API (SaaS, recorrente em USD)
- O que faz: 1 chamada de API normaliza telefone BR para E.164 (whatsapp-ready), limpa email, parseia UTMs e gera SHA-256 dedupe hash
- Preco: Free (100 req/mes), Starter $29/mes, Pro $79/mes, Enterprise $199/mes
- URL: ${api.url_landing}
- Ideal para quem: ${api.icp.primario.join('; ')}
- Sinais no perfil para detectar API lead:
${nichosSinaisAPI}

PRODUTO B - Landing Page Premium Dark Mode + Neon (servico, pagamento unico)
- O que faz: landing pages premium com dark mode e neon para infoprodutores
- Preco: R$1.497 a R$5.997
- Ideal para: infoprodutores, ecommerce, coaches, consultores com audiencia

ANALISE ESTE PERFIL INSTAGRAM:
- Username: @${username}
- Bio: ${bioText || 'Nao disponivel'}
- Seguidores: ${followersCount}
- Posts: ${postsCount}
- Descricao dos ultimos posts: ${recentPostsDesc || 'Nao disponivel'}

INSTRUCAO CRITICA: Se a bio ou posts mencionar Make.com, n8n, Zapier, automacao, CRM, trafego pago, leads, webhook, API, SaaS, dev, integracao -> servico_ideal = "lead_normalizer_api"
Se for infoprodutor, coach, ecommerce, criador de conteudo -> servico_ideal = "landing_page"

Gere RELATORIO em JSON:
{
  "score_potencial": (0-100),
  "nicho": "qual nicho este lead atua",
  "tipo_negocio": "infoprodutor/ecommerce/agencia/dev/automacao/servicos/outro",
  "problema_principal": "maior problema que nosso produto resolve para ele",
  "nivel_consciencia": "nao_sabe/sabe_problema/sabe_solucao/produto_aware",
  "tamanho_negocio": "micro/pequeno/medio/grande",
  "urgencia_estimada": "baixa/media/alta",
  "angulo_abordagem": "angulo emocional/racional para abordar",
  "objecoes_previstas": ["lista de objecoes"],
  "servico_ideal": "lead_normalizer_api" ou "landing_page",
  "motivo_produto": "por que este produto e o certo para ele",
  "preco_estimado_aceito": "faixa de preco que ele provavelmente aceita",
  "melhor_horario_contato": "manha/tarde/noite",
  "plataforma_adicional": "tem LinkedIn/YouTube/outro?",
  "insights_extras": "observacoes estrategicas",
  "prioridade": "hot/warm/cold"
}

RESPONDA APENAS O JSON, SEM TEXTO ADICIONAL.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024,
    });

    const rawResponse = completion.choices[0].message.content.trim();
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta nao contem JSON valido');
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    const result = {
      timestamp: new Date().toISOString(),
      username: username,
      dados_perfil: { bio: bioText, seguidores: followersCount, posts: postsCount },
      analise: analysis
    };

    const outputDir = path.join(__dirname, '..', 'data', 'leads');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, `${username}_analysis.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    
    const produtoLabel = analysis.servico_ideal === 'lead_normalizer_api' ? '🔵 Lead Normalizer API' : '🟣 Landing Page Premium';
    
    console.log(`\n[ANALYZER] Analise concluida!`);
    console.log(`[ANALYZER] Score de potencial: ${analysis.score_potencial}/100`);
    console.log(`[ANALYZER] Prioridade: ${analysis.prioridade?.toUpperCase()}`);
    console.log(`[ANALYZER] Produto detectado: ${produtoLabel}`);
    console.log(`[ANALYZER] Problema principal: ${analysis.problema_principal}`);
    console.log(`[ANALYZER] Motivo: ${analysis.motivo_produto}`);
    console.log(`[ANALYZER] Arquivo salvo: ${outputFile}`);
    
    process.env.ANALYSIS_RESULT = JSON.stringify(result);
    console.log(`\nANALYSIS_OUTPUT=${JSON.stringify(result)}`);
    
    return result;
    
  } catch (error) {
    console.error('[ANALYZER] Erro:', error.message);
    process.exit(1);
  }
}

analyzeProfile();
