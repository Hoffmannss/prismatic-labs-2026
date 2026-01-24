/**
 * SCRIPT 1: GERAÇÃO DE TÓPICOS
 * Usa Gemini API para gerar 28 tópicos estratégicos para o mês
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuração
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Meses em português
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

async function generateTopics() {
  console.log('🧠 ETAPA 1: Gerando tópicos...');
  
  // Determina mês (próximo mês ou argumento)
  const hoje = new Date();
  const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  const mesNome = MESES[proximoMes.getMonth()];
  const ano = proximoMes.getFullYear();
  
  console.log(`📅 Mês: ${mesNome}/${ano}`);
  
  // Prompt estratégico
  const prompt = `
Você é um estrategista de conteúdo Instagram para Prismatic Labs, uma agência especializada em landing pages PREMIUM dark mode + neon que CONVERTEM.

PÚBLICO-ALVO:
- Infoprodutores (cursos online, mentorias)
- E-commerce premium
- Coaches e consultores
- Profissionais liberais (advogados, arquitetos)

OBJETIVO: Gerar leads qualificados que investem R$3.000-R$15.000 em sites.

CRIE 28 TÓPICOS de posts Instagram para ${mesNome} ${ano} seguindo:

DISTRIBUIÇÃO:
- 40% Educacional (autoridade, dicas, erros comuns)
- 30% Social Proof (cases, depoimentos, antes/depois)
- 20% CTA Vendas (urgência, oferta, escassez)
- 10% Inspiração/Bastidores

FORMATO:
Retorne APENAS um JSON array válido (sem markdown, sem explicações):
[
  {
    "dia": 1,
    "tema": "Título impactante do post",
    "subtitulo": "Complemento que gera curiosidade",
    "tipo": "educacional|social-proof|cta-vendas|inspiracao",
    "badge": "Emoji + Categoria (ex: 💡 Dica de Ouro)",
    "cta": "Texto do botão/CTA",
    "cores": "purple-teal|pink-purple|teal-pink"
  }
]

REGRAS:
1. Títulos <60 caracteres, IMPACTANTES
2. Variar cores a cada post
3. CTAs diferentes (nunca repetir "Link na Bio")
4. Temas complementares (não repetir assunto)
5. Incluir números/percentuais quando possível
6. Tom: profissional mas acessível

GERE OS 28 TÓPICOS AGORA:
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpa markdown se existir
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON
    const topics = JSON.parse(text);
    
    // Validação
    if (!Array.isArray(topics) || topics.length !== 28) {
      throw new Error(`Esperado 28 tópicos, recebido ${topics.length}`);
    }
    
    // Enriquece com metadados
    const enrichedTopics = topics.map((topic, index) => ({
      ...topic,
      id: index + 1,
      mes: mesNome,
      ano: ano,
      geradoEm: new Date().toISOString()
    }));
    
    // Salva arquivo
    const outputDir = path.join(__dirname, '../generated');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, `topics-${mesNome.toLowerCase()}-${ano}.json`);
    await fs.writeFile(outputFile, JSON.stringify(enrichedTopics, null, 2), 'utf8');
    
    console.log(`✅ ${topics.length} tópicos gerados!`);
    console.log(`💾 Salvo em: ${outputFile}`);
    
    // Estatísticas
    const stats = {
      educacional: enrichedTopics.filter(t => t.tipo === 'educacional').length,
      socialProof: enrichedTopics.filter(t => t.tipo === 'social-proof').length,
      ctaVendas: enrichedTopics.filter(t => t.tipo === 'cta-vendas').length,
      inspiracao: enrichedTopics.filter(t => t.tipo === 'inspiracao').length
    };
    
    console.log('\n📊 Distribuição:');
    console.log(`  Educacional: ${stats.educacional} (${Math.round(stats.educacional/28*100)}%)`);
    console.log(`  Social Proof: ${stats.socialProof} (${Math.round(stats.socialProof/28*100)}%)`);
    console.log(`  CTA Vendas: ${stats.ctaVendas} (${Math.round(stats.ctaVendas/28*100)}%)`);
    console.log(`  Inspiração: ${stats.inspiracao} (${Math.round(stats.inspiracao/28*100)}%)`);
    
    return enrichedTopics;
    
  } catch (error) {
    console.error('❌ Erro ao gerar tópicos:', error.message);
    throw error;
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  generateTopics()
    .then(() => {
      console.log('\n✅ ETAPA 1 CONCLUÍDA');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ FALHA:', error);
      process.exit(1);
    });
}

module.exports = { generateTopics };
