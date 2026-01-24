#!/usr/bin/env node

/**
 * 🤖 SCRIPT 1: GERAÇÃO AUTOMÁTICA DE TÓPICOS
 * 
 * O QUE FAZ:
 * - Conecta com Google Gemini API
 * - Gera N tópicos estratégicos para Instagram
 * - Distribui tipos de conteúdo (educacional, vendas, social proof)
 * - Salva JSON com todos os tópicos
 * 
 * ENTRADA: Mês, Ano, Quantidade
 * SAÍDA: generated/topics-{mes}.json
 * 
 * USO:
 * node 1-generate-topics.js "Fevereiro" "2026" "28"
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
  model: 'gemini-2.0-flash-exp', // Modelo mais avançado e FREE
  outputDir: path.join(__dirname, '../generated'),
  
  // Mix de conteúdo (Prismatic Labs)
  contentMix: {
    educational: 40, // 40% educacional (autoridade)
    sales: 30,       // 30% vendas diretas (conversão)
    socialProof: 30  // 30% cases/depoimentos (confiança)
  },
  
  // Temas Prismatic Labs
  themes: [
    'Landing pages que convertem',
    'Dark mode e design premium',
    'Velocidade e performance',
    'UX/UI para vendas',
    'Automação e IA',
    'Cases de sucesso',
    'ROI de sites profissionais',
    'Tendências web design 2026'
  ]
};

// ========================================
// FUNÇÕES PRINCIPAIS
// ========================================

async function generateTopics(month, year, totalPosts) {
  console.log(`🤖 Gerando ${totalPosts} tópicos para ${month}/${year}...\n`);
  
  // Inicializar Gemini
  const genAI = new GoogleGenerativeAI(CONFIG.apiKey);
  const model = genAI.getGenerativeModel({ model: CONFIG.model });
  
  // Calcular distribuição de tipos
  const distribution = {
    educational: Math.round(totalPosts * CONFIG.contentMix.educational / 100),
    sales: Math.round(totalPosts * CONFIG.contentMix.sales / 100),
    socialProof: Math.round(totalPosts * CONFIG.contentMix.socialProof / 100)
  };
  
  console.log('🎯 Distribuição de conteúdo:');
  console.log(`   Educacional: ${distribution.educational} posts`);
  console.log(`   Vendas: ${distribution.sales} posts`);
  console.log(`   Social Proof: ${distribution.socialProof} posts\n`);
  
  // Prompt estratégico para Gemini
  const prompt = `
Você é um especialista em marketing digital e Instagram para empresas de tecnologia.

Gere exatamente ${totalPosts} tópicos de posts Instagram para a PRISMATIC LABS:
- Empresa: Desenvolvimento de landing pages premium, sites corporativos e automações com IA
- Público: Empreendedores, infoprodutores, e-commerces, profissionais liberais (advogados, médicos, coaches)
- Objetivo: Gerar leads qualificados e vendas de sites/landing pages
- Tom: Profissional, confiável, mas direto e sem enrolação

DISTRIBUIÇÃO:
- ${distribution.educational} posts EDUCACIONAIS (autoridade, ensinar, dicas valiosas)
- ${distribution.sales} posts VENDAS (CTA direto, urgencia, oferta)
- ${distribution.socialProof} posts SOCIAL PROOF (cases, resultados, depoimentos)

TEMAS PRINCIPAIS:
${CONFIG.themes.map((t, i) => `${i + 1}. ${t}`).join('\n')}

FORMATO OBRIGATÓRIO - RETORNAR APENAS JSON VÁLIDO:
{
  "posts": [
    {
      "day": 1,
      "type": "educational|sales|socialProof",
      "theme": "um dos temas da lista",
      "title": "Título impactante (max 60 caracteres)",
      "subtitle": "Subtitulo complementar (max 80 caracteres)",
      "hook": "Frase de impacto para iniciar a legenda",
      "cta": "Call-to-action específico",
      "emoji": "emoji relevante"
    }
  ]
}

REGRAS:
1. Títulos devem gerar curiosidade ou urgencia
2. Evitar clichês ("revolucionário", "inacreditável")
3. Usar dados/números quando possível ("40% mais vendas")
4. CTAs variados (não repetir)
5. Mix de emojis sem exagero
6. RETORNAR APENAS JSON - SEM TEXTO ANTES OU DEPOIS
`;

  try {
    console.log('💬 Enviando prompt para Gemini AI...\n');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpar markdown se vier com ```json
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const data = JSON.parse(text);
    
    console.log(`✅ ${data.posts.length} tópicos gerados com sucesso!\n`);
    
    // Adicionar metadados
    const output = {
      metadata: {
        month,
        year,
        totalPosts: data.posts.length,
        generated: new Date().toISOString(),
        distribution
      },
      posts: data.posts
    };
    
    // Criar diretorio se não existir
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Salvar JSON
    const filename = `topics-${month.toLowerCase()}-${year}.json`;
    const filepath = path.join(CONFIG.outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf8');
    
    console.log(`💾 Salvo em: ${filepath}`);
    console.log(`\n🎯 Próxima etapa: Script 2 (criar HTMLs)\n`);
    
    return output;
    
  } catch (error) {
    console.error('❌ ERRO ao gerar tópicos:', error.message);
    
    if (error.message.includes('API key')) {
      console.error('\n🔑 Verifique se GEMINI_API_KEY está configurada corretamente.');
      console.error('Obtenha em: https://makersuite.google.com/app/apikey\n');
    }
    
    process.exit(1);
  }
}

// ========================================
// EXECUÇÃO
// ========================================

if (require.main === module) {
  // Pegar argumentos da linha de comando
  const args = process.argv.slice(2);
  
  const month = args[0] || 'Fevereiro';
  const year = args[1] || '2026';
  const totalPosts = parseInt(args[2]) || 28;
  
  if (!CONFIG.apiKey) {
    console.error('❌ ERRO: GEMINI_API_KEY não encontrada!');
    console.error('🔧 Solução:');
    console.error('1. Copie .env.example para .env');
    console.error('2. Adicione sua chave Gemini em GEMINI_API_KEY');
    console.error('3. Obtenha em: https://makersuite.google.com/app/apikey\n');
    process.exit(1);
  }
  
  generateTopics(month, year, totalPosts);
}

module.exports = { generateTopics };
