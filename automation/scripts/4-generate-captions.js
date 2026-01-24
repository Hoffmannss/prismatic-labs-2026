#!/usr/bin/env node
/**
 * SCRIPT 4: GERAÇÃO DE LEGENDAS
 * 
 * Função: Cria legendas otimizadas para Instagram usando Gemini AI
 * Input: topics-[mes].json
 * Output: 28 arquivos TXT com legendas completas
 * 
 * Como funciona:
 * 1. Para cada tópico:
 *    - Envia prompt ao Gemini
 *    - Recebe legenda estruturada
 *    - Adiciona hashtags estratégicas
 * 2. Salva cada legenda em arquivo separado
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const HASHTAGS_BASE = `#WebDesign #SitesProfissionais #DesignModerno #MarketingDigital #WebDevelopment #SitesQueConvertem #PrismaticLabs #LandingPage #ConversaoDigital #ROI #VendasOnline #EmpresaDigital`;

async function generateCaption(topic, index) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
Crie uma legenda Instagram otimizada para vendas B2B.

TÓPICO: ${topic.theme}
TIPO: ${topic.type}
HOOK: ${topic.hook}
CTA: ${topic.cta}

ESTRUTURA:
1. Hook impactante (1 linha que para scroll)
2. Problema que o público enfrenta (2-3 linhas)
3. Solução Prismatic Labs (3-4 linhas com bullets ou emojis)
4. Resultado/Transformação (2 linhas)
5. CTA direto e urgente (1 linha)
6. Bio link reminder

TOM: Autoridade + Urgency + Empatia
TAMANHO: 150-200 palavras
EMOJIS: Usar estrategicamente (não exagerar)

NÃO incluir hashtags (serão adicionadas depois).
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

async function generateCaptions() {
  try {
    console.log('✍️ Gerando legendas com Gemini AI...');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    // 1. Lê tópicos
    const generatedDir = path.join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    const topicsFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    
    if (!topicsFile) {
      throw new Error('Arquivo topics-*.json não encontrado');
    }

    const topicsPath = path.join(generatedDir, topicsFile);
    const topicsData = JSON.parse(await fs.readFile(topicsPath, 'utf-8'));

    // 2. Cria pasta captions
    const captionsDir = path.join(generatedDir, 'captions');
    await fs.mkdir(captionsDir, { recursive: true });

    // 3. Gera legenda para cada tópico
    for (let i = 0; i < topicsData.topics.length; i++) {
      const topic = topicsData.topics[i];
      console.log(`   [${i + 1}/${topicsData.topics.length}] ${topic.theme}...`);

      const caption = await generateCaption(topic, i);
      const fullCaption = `${caption}\n\n---\n\n${HASHTAGS_BASE}`;
      
      const filename = `caption-${String(i + 1).padStart(2, '0')}.txt`;
      const filepath = path.join(captionsDir, filename);
      await fs.writeFile(filepath, fullCaption);

      // Rate limit: 1 requisição por segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ ${topicsData.topics.length} legendas geradas!`);
    console.log(`📁 Pasta: ${captionsDir}`);

  } catch (error) {
    console.error('❌ Erro ao gerar legendas:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateCaptions();
}

module.exports = { generateCaptions };
