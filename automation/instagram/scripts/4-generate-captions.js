#!/usr/bin/env node

/**
 * ✍️ SCRIPT 4: GERAÇÃO DE LEGENDAS
 * 
 * O QUE FAZ:
 * - Lê tópicos gerados
 * - Para cada post, gera legenda otimizada com Gemini
 * - Estrutura: Hook + Conteúdo + CTA + Hashtags
 * - Salva 1 arquivo .txt por post
 * 
 * ENTRADA: generated/topics-{mes}.json
 * SAÍDA: generated/captions/post-*.txt
 * 
 * USO:
 * node 4-generate-captions.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ========================================
// CONFIGURAÇÕES
// ========================================

const CONFIG = {
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash-exp',
  generatedDir: path.join(__dirname, '../generated'),
  outputDir: path.join(__dirname, '../generated/captions'),
  
  // Hashtags Prismatic Labs
  hashtags: [
    '#WebDesign', '#SitesProfissionais', '#DesignModerno',
    '#MarketingDigital', '#WebDevelopment', '#SitesQueConvertem',
    '#PrismaticLabs', '#LandingPage', '#Ecommerce', '#Vendas',
    '#ConversaoDigital', '#ROI', '#Automacao', '#IA'
  ],
  
  // CTA padrão
  cta: '➡️ Link na bio para orçamento grátis',
  bioUrl: 'https://hoffmannss.github.io/prismatic-labs-2026/'
};

// ========================================
// FUNÇÃO GERAÇÃO LEGENDA
// ========================================

async function generateCaption(post, genAI) {
  const model = genAI.getGenerativeModel({ model: CONFIG.model });
  
  const prompt = `
Você é um copywriter especialista em Instagram para empresas de tecnologia.

Gere uma legenda otimizada para este post Instagram da PRISMATIC LABS:

TIPO: ${post.type}
TÍTULO: ${post.title}
SUBTÍTULO: ${post.subtitle}
HOOK: ${post.hook}
TEMA: ${post.theme}

CONTEXTO DA EMPRESA:
- Desenvolvimento de landing pages premium e sites corporativos
- Público: Empreendedores, infoprodutores, e-commerces, profissionais liberais
- Objetivo: Gerar leads e vendas de sites (ticket médio R$3k-15k)
- Tom: Profissional, confiável, direto, sem enrolação

ESTRUTURA OBRIGATÓRIA:

1. HOOK (primeira linha - impactante, gera curiosidade)
   - Use o hook fornecido ou crie melhor
   - Máx 80 caracteres
   - Deve parar o scroll

2. CONTEÚDO (2-3 parágrafos curtos)
   - Parágrafo 1: Problema/dor do cliente
   - Parágrafo 2: Solução/benefício
   - Parágrafo 3: Resultado/prova social (se aplicável)
   - Usar bullets • se listar itens
   - Usar emojis estrategicamente (1-2 por parágrafo)

3. CTA (call-to-action)
   - Claro e direto
   - Exemplo: "➡️ Link na bio para orçamento grátis"
   - Ou: "Comenta AI que mando DM com portfólio completo"

4. HASHTAGS (linha separada)
   - 10-15 hashtags relevantes
   - Mix: nichos específicos + amplas
   - Incluir sempre: #PrismaticLabs

REGRAS:
- Máx 2200 caracteres total
- Linguagem YOU ("seu site", "você", "sua empresa")
- Evitar clichês: "revolucionário", "inacreditável", "game changer"
- Usar dados/números quando possível
- Espaçamento entre parágrafos para leitura
- Tom confiante mas não arrogante

RETORNE APENAS A LEGENDA - SEM EXPLICAÇÕES OU NOTAS
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`   ❌ Erro ao gerar legenda: ${error.message}`);
    
    // Fallback simples se API falhar
    return `${post.hook}\n\n${post.subtitle}\n\n${post.cta}\n\n${CONFIG.hashtags.slice(0, 10).join(' ')}`;
  }
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function generateCaptions() {
  console.log('✍️ Gerando legendas com Gemini AI...\n');
  
  try {
    // Encontrar arquivo de tópicos mais recente
    const files = fs.readdirSync(CONFIG.generatedDir)
      .filter(f => f.startsWith('topics-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(CONFIG.generatedDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.error('❌ ERRO: Nenhum arquivo de tópicos encontrado!');
      console.error('🔧 Execute primeiro: node 1-generate-topics.js\n');
      process.exit(1);
    }
    
    const topicsFile = path.join(CONFIG.generatedDir, files[0].name);
    console.log(`📂 Lendo: ${files[0].name}\n`);
    
    const data = JSON.parse(fs.readFileSync(topicsFile, 'utf8'));
    const posts = data.posts;
    
    // Criar diretório de saída
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Inicializar Gemini
    const genAI = new GoogleGenerativeAI(CONFIG.apiKey);
    
    // Gerar legenda para cada post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const filename = `post-${String(i + 1).padStart(2, '0')}.txt`;
      const filepath = path.join(CONFIG.outputDir, filename);
      
      console.log(`✍️ [${i + 1}/${posts.length}] ${post.title.substring(0, 40)}...`);
      
      const caption = await generateCaption(post, genAI);
      
      fs.writeFileSync(filepath, caption, 'utf8');
      console.log(`   ✅ Salvo: ${filename}`);
      
      // Delay para evitar rate limit (Gemini FREE = 60 req/min)
      if (i < posts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    console.log(`\n🎉 ${posts.length} legendas geradas com sucesso!`);
    console.log(`📁 Local: ${CONFIG.outputDir}`);
    console.log(`\n🎯 Próxima etapa: Script 5 (upload Google Drive)\n`);
    
  } catch (error) {
    console.error('❌ ERRO ao gerar legendas:', error.message);
    
    if (error.message.includes('API key')) {
      console.error('\n🔑 Verifique se GEMINI_API_KEY está configurada.');
    }
    
    process.exit(1);
  }
}

// ========================================
// EXECUÇÃO
// ========================================

if (require.main === module) {
  if (!CONFIG.apiKey) {
    console.error('❌ ERRO: GEMINI_API_KEY não encontrada!');
    console.error('Configure no arquivo .env\n');
    process.exit(1);
  }
  
  generateCaptions();
}

module.exports = { generateCaptions };
