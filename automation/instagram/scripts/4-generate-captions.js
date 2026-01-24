/**
 * ✍️ SCRIPT 4: GERA LEGENDAS COM IA
 * 
 * O QUE FAZ:
 * - Usa Gemini para criar legendas otimizadas para cada post
 * - Segue estrutura: Hook + Problema + Solução + CTA + Hashtags
 * - Salva .txt para cada post
 * 
 * COMO FUNCIONA:
 * 1. Lê tópicos gerados
 * 2. Para cada um, pede legenda customizada ao Gemini
 * 3. Salva em /generated/captions/
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function gerarLegendas() {
  console.log('✍️ Gerando legendas com IA...');
  
  try {
    // Encontra arquivo de tópicos
    const generatedDir = path.join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    const topicsFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    
    if (!topicsFile) {
      throw new Error('Arquivo de tópicos não encontrado.');
    }
    
    const topicsPath = path.join(generatedDir, topicsFile);
    const topicsData = await fs.readFile(topicsPath, 'utf8');
    const topics = JSON.parse(topicsData);
    
    // Cria pasta para legendas
    const captionsDir = path.join(generatedDir, 'captions');
    await fs.mkdir(captionsDir, { recursive: true });
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Gera legenda para cada post
    for (let i = 0; i < topics.posts.length; i++) {
      const post = topics.posts[i];
      console.log(`  [${i+1}/${topics.posts.length}] Gerando legenda: ${post.tema}...`);
      
      const prompt = `
Você é copywriter especialista em Instagram para agência premium.

CONTEXTO:
Empresa: Prismatic Labs
Oferta: Landing pages dark mode premium
Público: Infoprodutores, e-commerces, profissionais liberais com orçamento R$3k-10k
Objetivo: Gerar leads via DM

POST:
Tipo: ${post.tipo}
Tema: ${post.tema}
Hook: ${post.hook}
Ângulo: ${post.angulo}

CRIE UMA LEGENDA INSTAGRAM seguindo EXATAMENTE esta estrutura:

1. HOOK (1 linha impactante, pode usar emoji)
2. LINHA EM BRANCO
3. PROBLEMA (2-3 linhas mostrando dor/urgência)
4. LINHA EM BRANCO
5. SOLUÇÃO (3-4 linhas com benefícios/dados)
6. LINHA EM BRANCO
7. PROVA SOCIAL (1-2 linhas se aplicável)
8. LINHA EM BRANCO
9. CTA (1-2 linhas, direto ao ponto)
10. LINHA EM BRANCO
11. HASHTAGS (15-20 hashtags otimizadas)

TOM: Direto, confiante, sem floreios. Use "você". Dados quando possível.
EVITE: Emojis excessivos, promessas vagas, textos longos

RETORNE APENAS O TEXTO DA LEGENDA, sem títulos ou explicações.
`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const caption = response.text().trim();
      
      // Salva legenda
      const filename = `caption-${String(post.numero).padStart(2, '0')}.txt`;
      const filepath = path.join(captionsDir, filename);
      await fs.writeFile(filepath, caption);
      
      // Delay para evitar rate limit (60 req/min = 1 req/segundo)
      if (i < topics.posts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }
    
    console.log(`✅ ${topics.posts.length} legendas geradas com sucesso!`);
    console.log(`📂 Salvas em: ${captionsDir}`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar legendas:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  gerarLegendas();
}

module.exports = gerarLegendas;
