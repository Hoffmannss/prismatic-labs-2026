const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateCaptions() {
  console.log('✍️ Gerando legendas...');

  const generatedDir = path.join(__dirname, '../generated');
  const files = await fs.readdir(generatedDir);
  const topicFiles = files.filter(f => f.startsWith('topics-'));
  const latestTopicFile = topicFiles.sort().reverse()[0];
  const topicsPath = path.join(generatedDir, latestTopicFile);
  const topics = JSON.parse(await fs.readFile(topicsPath, 'utf-8'));

  const captionsDir = path.join(generatedDir, 'captions');
  await fs.mkdir(captionsDir, { recursive: true });

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  for (const topic of topics) {
    const prompt = `
Crie uma legenda Instagram VENDEDORA para:

TEMA: ${topic.tema}
TIPO: ${topic.tipo}
HOOK: ${topic.hook}

ESTRUTURA:
1. Hook impactante (emoji + pergunta/afirmação chocante)
2. Problema (dor do cliente)
3. Solução (o que você oferece)
4. Resultado (transformação/ROI)
5. CTA forte (${topic.cta})
6. Hashtags: #WebDesign #LandingPage #SitesProfissionais #MarketingDigital #Vendas #ROI #PrismaticLabs + 3 do nicho

TOM: Direto, confiante, foco em resultados
TAMANHO: 150-200 palavras
`;

    const result = await model.generateContent(prompt);
    const caption = result.response.text();

    const filename = `post-${topic.dia.toString().padStart(2, '0')}.txt`;
    await fs.writeFile(path.join(captionsDir, filename), caption);
    console.log(`  ✓ Legenda ${topic.dia}`);
  }

  console.log(`✅ ${topics.length} legendas geradas!`);
}

generateCaptions().catch(console.error);