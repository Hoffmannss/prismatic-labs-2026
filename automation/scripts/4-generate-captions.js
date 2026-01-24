/**
 * SCRIPT 4: GERAÇÃO DE LEGENDAS
 * Usa Gemini para criar legendas vendedoras para cada post
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Hashtags padrão
const HASHTAGS_BASE = [
  '#WebDesign', '#SitesProfissionais', '#DesignModerno',
  '#MarketingDigital', '#WebDevelopment', '#SitesQueConvertem',
  '#PrismaticLabs', '#LandingPage', '#ConversaoDigital'
];

const HASHTAGS_NICHO = {
  'educacional': ['#DicasDeDesign', '#AprendaWeb', '#TipsDesign'],
  'social-proof': ['#CasosDeSuccesso', '#Resultados', '#DepoimentosReais'],
  'cta-vendas': ['#Vendas', '#OportunidadeUnica', '#InvistaAgora'],
  'inspiracao': ['#Inspiracao', '#Criatividade', '#DesignInspiration']
};

async function generateCaption(topic, index, total) {
  const prompt = `
Você é um copywriter especializado em Instagram para vendas B2B premium.

PÚBLICO: Empreendedores que investem R$3k-R$15k em sites.
OBJETIVO: Gerar leads qualificados via DM ou link bio.

TÓPICO DO POST:
Titulo: ${topic.tema}
Subtítulo: ${topic.subtitulo}
Tipo: ${topic.tipo}
CTA visual: ${topic.cta}

CRIE UMA LEGENDA VENDEDORA seguindo:

ESTRUTURA:
1. HOOK (1 linha impactante com emoji)
2. PROBLEMA (2-3 linhas identificando dor)
3. SOLUÇÃO (2-3 linhas apresentando benefícios)
4. PROVA/DADOS (1-2 linhas com números/resultados)
5. CTA (1 linha clara e direta)
6. HASHTAGS (separadas, 1 por linha)

REGRAS:
- Tom: Profissional mas acessível
- Use emojis estratégicos (não exagere)
- Números/percentuais quando possível
- CTA: varie entre "Link na bio", "Manda DM", "Comenta X"
- Máx 2200 caracteres
- Quebras de linha para leitura fácil
- Se tipo=cta-vendas: adicione urgência/escassez
- Se tipo=social-proof: mencione resultado real
- Se tipo=educacional: agregue valor genuino

GERE APENAS A LEGENDA (sem título, sem explicações):
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let caption = response.text().trim();
    
    // Adiciona hashtags se não tiver
    if (!caption.includes('#')) {
      const hashtagsNicho = HASHTAGS_NICHO[topic.tipo] || [];
      const hashtags = [...HASHTAGS_BASE, ...hashtagsNicho]
        .slice(0, 12)
        .join(' ');
      caption += `\n\n${hashtags}`;
    }
    
    // Log progress
    console.log(`  ✅ ${index}/${total}: ${topic.tema.substring(0, 40)}...`);
    
    return caption;
    
  } catch (error) {
    console.error(`  ❌ Erro no post ${index}:`, error.message);
    // Fallback simples
    return `${topic.tema}\n\n${topic.subtitulo}\n\n➡️ ${topic.cta}\n\n${HASHTAGS_BASE.join(' ')}`;
  }
}

async function generateAllCaptions() {
  console.log('\n✍️ ETAPA 4: Gerando legendas...');
  
  try {
    // Lê tópicos
    const generatedDir = path.join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    const topicsFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    
    if (!topicsFile) {
      throw new Error('Arquivo de tópicos não encontrado.');
    }
    
    const topicsData = await fs.readFile(path.join(generatedDir, topicsFile), 'utf8');
    const topics = JSON.parse(topicsData);
    
    console.log(`📂 ${topics.length} legendas para gerar`);
    console.log('⏳ Aguarde... (leva ~3-4min)\n');
    
    // Cria pasta
    const captionsDir = path.join(generatedDir, 'captions');
    await fs.mkdir(captionsDir, { recursive: true });
    
    // Gera legendas (com delay para evitar rate limit)
    const captions = [];
    for (let i = 0; i < topics.length; i++) {
      const caption = await generateCaption(topics[i], i + 1, topics.length);
      
      // Salva individual
      const filename = `post-${String(topics[i].dia).padStart(2, '0')}.txt`;
      await fs.writeFile(
        path.join(captionsDir, filename),
        caption,
        'utf8'
      );
      
      captions.push({
        dia: topics[i].dia,
        tema: topics[i].tema,
        caption: caption,
        caracteres: caption.length
      });
      
      // Delay entre requests (Gemini free tier)
      if (i < topics.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Salva todas juntas também
    const allCaptionsPath = path.join(generatedDir, 'all-captions.json');
    await fs.writeFile(allCaptionsPath, JSON.stringify(captions, null, 2), 'utf8');
    
    // Stats
    const avgLength = Math.round(
      captions.reduce((sum, c) => sum + c.caracteres, 0) / captions.length
    );
    
    console.log(`\n🎉 ${captions.length} legendas geradas!`);
    console.log(`📁 Pasta: ${captionsDir}`);
    console.log(`📊 Média: ${avgLength} caracteres`);
    
    return captionsDir;
    
  } catch (error) {
    console.error('❌ Erro ao gerar legendas:', error.message);
    throw error;
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  generateAllCaptions()
    .then(() => {
      console.log('\n✅ ETAPA 4 CONCLUÍDA');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ FALHA:', error);
      process.exit(1);
    });
}

module.exports = { generateAllCaptions };
