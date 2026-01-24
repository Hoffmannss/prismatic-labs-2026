#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

const MONTH = process.argv[2] || 'próximo mês';
const YEAR = process.argv[3] || '2026';

const PROMPT_TOPICS = `Você é especialista em marketing Instagram para empresas de tecnologia premium.

Gere 28 tópicos estratégicos para posts Instagram da Prismatic Labs em ${MONTH} ${YEAR}.

CONTEXTO PRISMATIC LABS:
- Empresa: Landing pages e sites premium high-ticket (R$8k-R$50k)
- Público: Infoprodutores, e-commerces, consultores, coaches
- Fase: Pré-vendas, precisa gerar leads rápido
- Diferencial: Dark mode, performance extrema, design premium
- Resultados clientes: +40-60% conversão, +240% leads

DISTRIBUIÇÃO CONTEÚDO (mix estratégico):
- 40% Educacional (autoridade técnica)
- 30% Social Proof (cases, depoimentos, números)
- 20% Vendas/CTA (ofertas, urgência, escassez)
- 10% Engajamento (perguntas, enquetes, bastidores)

FORMATO JSON (exatamente assim):
[
  {
    "dia": 1,
    "tema": "Por que dark mode converte 3x mais",
    "tipo": "educacional",
    "formato": "post",
    "horario": "10:00"
  },
  ...
]

TIPOS: educacional, social-proof, vendas, engajamento
FORMATOS: post (feed 1:1), story (9:16)
HORÁRIOS: 10:00, 14:00, 17:00, 19:00

REGRAS:
- Posts variados (não repetir ângulos)
- Temas específicos com números/dados sempre que possível
- Stories apenas sex/sab/dom
- CTAs claros nos posts de vendas
- Tópicos que gerem curiosidade/urgência

Retorne APENAS o array JSON, sem explicações.`;

async function generateTopics() {
  console.log('🎯 Gerando tópicos com Gemini AI...');
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  try {
    const result = await model.generateContent(PROMPT_TOPICS);
    const response = result.response.text();
    
    // Limpa markdown e extrai JSON
    const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Resposta não contém JSON válido');
    }
    
    const topics = JSON.parse(jsonMatch[0]);
    
    // Valida estrutura
    if (!Array.isArray(topics) || topics.length !== 28) {
      throw new Error(`Esperado 28 tópicos, recebido ${topics.length}`);
    }
    
    // Cria pasta generated
    const outputDir = path.join(__dirname, '../generated');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Salva JSON
    const outputPath = path.join(outputDir, `topics-${MONTH.toLowerCase()}-${YEAR}.json`);
    await fs.writeFile(outputPath, JSON.stringify(topics, null, 2));
    
    console.log(`✅ ${topics.length} tópicos gerados: ${outputPath}`);
    console.log(`📊 Distribuição:`);
    
    const distribution = topics.reduce((acc, t) => {
      acc[t.tipo] = (acc[t.tipo] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(distribution).forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count} (${Math.round(count/28*100)}%)`);
    });
    
    return topics;
  } catch (error) {
    console.error('❌ Erro ao gerar tópicos:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateTopics();
}

module.exports = { generateTopics };