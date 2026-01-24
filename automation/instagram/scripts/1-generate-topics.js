/**
 * 🎨 SCRIPT 1: GERAÇÃO DE TÓPICOS COM IA
 * 
 * O QUE FAZ:
 * - Usa Google Gemini para gerar 28 tópicos de posts Instagram
 * - Distribui tipos de conteúdo (educacional, social proof, vendas)
 * - Salva JSON com todos os tópicos para próximas etapas
 * 
 * COMO FUNCIONA:
 * 1. Conecta na API Gemini (FREE 60 req/min)
 * 2. Envia prompt otimizado com contexto Prismatic Labs
 * 3. Recebe JSON estruturado com tópicos
 * 4. Valida e salva em /generated/topics-{mes}.json
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Configuração
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Argumentos da linha de comando
const mes = process.argv[2] || 'Fevereiro';
const ano = process.argv[3] || '2026';
const totalPosts = parseInt(process.argv[4]) || 28;

async function gerarTopicos() {
  console.log(`🎨 Gerando ${totalPosts} tópicos para ${mes} ${ano}...`);
  
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `
Você é especialista em marketing digital para agência premium de landing pages.

EMPRESA: Prismatic Labs
NICHO: Landing pages dark mode premium para infoprodutores, e-commerces, profissionais liberais
DIFERENCIAL: Design moderno dark mode, entrega 10-15 dias, suporte vitalício
OBJETIVO: Gerar leads qualificados via Instagram

GERE ${totalPosts} TÓPICOS de posts Instagram para ${mes} ${ano}.

DISTRIBUIÇÃO:
- 40% Educacional (ensina, dá dicas, mostra dados)
- 30% Social Proof (cases, depoimentos, antes/depois)
- 20% Vendas (CTA forte, urgência, oferta)
- 10% Autoridade (bastidores, processo, equipe)

RETORNE APENAS JSON VÁLIDO neste formato:
{
  "mes": "${mes}",
  "ano": "${ano}",
  "posts": [
    {
      "numero": 1,
      "dia": 1,
      "tipo": "educacional",
      "tema": "Por que dark mode converte 3x mais",
      "hook": "Seu site está perdendo 70% dos leads por isso...",
      "angulo": "dados + urgência"
    }
  ]
}

TIPOS permitidos: educacional, social-proof, vendas, autoridade
TEMAS devem ser: específicos, curiosos, com dados quando possível
`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpa markdown se vier ```json```
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const topicos = JSON.parse(text);
    
    // Validação
    if (!topicos.posts || topicos.posts.length !== totalPosts) {
      throw new Error(`Esperado ${totalPosts} posts, recebido ${topicos.posts?.length}`);
    }
    
    // Salva
    const outputDir = path.join(__dirname, '../generated');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `topics-${mes.toLowerCase()}-${ano}.json`);
    await fs.writeFile(outputPath, JSON.stringify(topicos, null, 2));
    
    console.log(`✅ ${totalPosts} tópicos gerados com sucesso!`);
    console.log(`📂 Salvos em: ${outputPath}`);
    
    // Mostra resumo
    const tipos = {};
    topicos.posts.forEach(p => {
      tipos[p.tipo] = (tipos[p.tipo] || 0) + 1;
    });
    console.log(`📊 Distribuição:`, tipos);
    
    return topicos;
    
  } catch (error) {
    console.error('❌ Erro ao gerar tópicos:', error.message);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  gerarTopicos();
}

module.exports = gerarTopicos;
