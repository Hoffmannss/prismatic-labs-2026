#!/usr/bin/env node
/**
 * SCRIPT 1: GERAÇÃO DE TÓPICOS COM GEMINI AI
 * 
 * Função: Gera ideias de conteúdo para Instagram usando IA
 * Input: Mês, ano, quantidade de posts
 * Output: JSON com tópicos estruturados
 * 
 * Como funciona:
 * 1. Conecta Gemini API (Google)
 * 2. Envia prompt otimizado para vendas B2B
 * 3. Recebe 28 ideias variadas (educação + social proof + vendas)
 * 4. Salva JSON para próximo script
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Configuração
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Parâmetros
const month = process.argv[2] || 'Fevereiro';
const year = process.argv[3] || '2026';
const postCount = parseInt(process.argv[4]) || 28;

console.log(`🤖 Gerando ${postCount} tópicos para ${month}/${year}...`);

async function generateTopics() {
  try {
    // 1. Configura modelo Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 2. Prompt otimizado
    const prompt = `
Você é especialista em marketing digital B2B para empresas de tecnologia premium.

CONTEXTO:
- Empresa: Prismatic Labs (landing pages + sites premium)
- Público: Infoprodutores, e-commerces, profissionais liberais
- Objetivo: Gerar ${postCount} ideias de posts Instagram para ${month} ${year}
- Tom: Autoridade + Urgency + Social Proof

DISTRIBUIÇÃO:
- 40% Educacional (dicas, estatísticas, insights)
- 30% Social Proof (cases, depoimentos, resultados)
- 20% Vendas diretas (CTA, urgency, ofertas)
- 10% Bastidores (processo, equipe, cultura)

FORMATO JSON:
{
  "topics": [
    {
      "day": 1,
      "theme": "Título impactante do post",
      "type": "educacional|social-proof|vendas|bastidores",
      "hook": "Primeira frase que prende atenção",
      "cta": "Call-to-action específico",
      "visual_style": "dark-gradient|neon-cards|minimal-stats|testimonial"
    }
  ]
}

Gere ${postCount} tópicos variados, estratégicos e focados em CONVERSÃO.
`;

    console.log('⏳ Consultando Gemini AI...');
    
    // 3. Chama API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. Extrai JSON do response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta não contém JSON válido');
    }

    const topics = JSON.parse(jsonMatch[0]);

    // 5. Valida e enriquece dados
    if (!topics.topics || topics.topics.length < postCount) {
      throw new Error(`Esperado ${postCount} tópicos, recebido ${topics.topics?.length || 0}`);
    }

    // 6. Adiciona metadados
    const enrichedData = {
      generated_at: new Date().toISOString(),
      month,
      year,
      total_posts: postCount,
      distribution: {
        educacional: topics.topics.filter(t => t.type === 'educacional').length,
        'social-proof': topics.topics.filter(t => t.type === 'social-proof').length,
        vendas: topics.topics.filter(t => t.type === 'vendas').length,
        bastidores: topics.topics.filter(t => t.type === 'bastidores').length
      },
      topics: topics.topics
    };

    // 7. Cria pasta generated se não existir
    const outputDir = path.join(__dirname, '../generated');
    await fs.mkdir(outputDir, { recursive: true });

    // 8. Salva arquivo
    const outputPath = path.join(outputDir, `topics-${month.toLowerCase()}.json`);
    await fs.writeFile(outputPath, JSON.stringify(enrichedData, null, 2));

    console.log(`✅ ${postCount} tópicos gerados com sucesso!`);
    console.log(`📁 Arquivo salvo: ${outputPath}`);
    console.log(`📊 Distribuição:`);
    console.log(`   - Educacional: ${enrichedData.distribution.educacional}`);
    console.log(`   - Social Proof: ${enrichedData.distribution['social-proof']}`);
    console.log(`   - Vendas: ${enrichedData.distribution.vendas}`);
    console.log(`   - Bastidores: ${enrichedData.distribution.bastidores}`);

    return enrichedData;

  } catch (error) {
    console.error('❌ Erro ao gerar tópicos:', error.message);
    process.exit(1);
  }
}

// Executa
if (require.main === module) {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY não configurada!');
    console.log('🔑 Obtenha sua chave em: https://makersuite.google.com/app/apikey');
    process.exit(1);
  }
  
  generateTopics();
}

module.exports = { generateTopics };
