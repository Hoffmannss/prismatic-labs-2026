const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateTopics(month) {
  console.log(`🎯 Gerando tópicos para: ${month}`);

  const prompt = `
Gere EXATAMENTE 28 tópicos para posts Instagram sobre landing pages e sites premium.

CRITÉRIOS:
- Mix: 40% educacional, 30% social proof, 30% vendas
- Hooks impactantes (dor/desejo/urgência)
- Foco: conversão, ROI, resultados
- Público: empreendedores, infoprodutores, e-commerce

FORMATO JSON (retorne APENAS o JSON, sem markdown):
[
  {
    "dia": 1,
    "tema": "Dark mode converte 3x mais que sites claros",
    "tipo": "educacional",
    "hook": "🌑 Seu site está perdendo 67% das vendas",
    "cta": "Link na bio para orçamento"
  }
]

TIPOS: educacional, social-proof, vendas, urgencia, dica-rapida
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Remove markdown code blocks se existir
  const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const topics = JSON.parse(jsonText);

  // Salvar
  const outputDir = path.join(__dirname, '../generated');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, `topics-${month.toLowerCase()}.json`),
    JSON.stringify(topics, null, 2)
  );

  console.log(`✅ ${topics.length} tópicos gerados!`);
  return topics;
}

const month = process.argv[2] || 'Fevereiro';
generateTopics(month).catch(console.error);