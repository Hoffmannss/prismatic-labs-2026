#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

const PROMPT_CAPTION = (tema, tipo) => `Crie uma legenda Instagram VENDAS para post da Prismatic Labs.

TEMA DO POST: ${tema}
TIPO: ${tipo}

CONTEXTO EMPRESA:
- Prismatic Labs: Landing pages e sites premium high-ticket
- Público: Infoprodutores, e-commerces, consultores (faturamento R$50k+/mês)
- Ticket médio: R$8k-R$50k
- Diferencial: Dark mode premium, performance extrema, entrega 10-15 dias
- Resultados clientes reais: +40-60% conversão, +240% leads, R$180k/mês
- Fase: Pré-vendas, precisa LEADS qualificados RÁPIDO

ESTRUTURA LEGENDA:

1. HOOK (1 linha impactante com emoji)
   - Número específico OU pergunta provocativa OU afirmação polêmica
   - Exemplos: "🚫 73% dos sites perdem clientes nos primeiros 3 segundos"
   
2. PROBLEMA (2-3 linhas)
   - Dor específica do público
   - Consequência financeira/emocional
   
3. SOLUÇÃO (3-4 linhas com bullets)
   - Como resolvemos
   - Resultados específicos (números reais)
   - Bullets com emojis
   
4. PROVA SOCIAL (1-2 linhas)
   - Dado concreto de cliente
   - Resultado mensurável
   
5. CTA FORTE (2 linhas)
   - Urgência/escassez se tipo="vendas"
   - Direção clara (link bio/DM/comentário)
   - Emoji de ação

6. HASHTAGS (linha separada)
   - 8-12 tags mix: nicho + alcance
   - Incluir sempre: #PrismaticLabs #SitesProfissionais

TOM:
- Direto, sem enrolação
- Confiança (não arrogância)
- Números/dados sempre que possível
- Evitar clichês ("revolucionar", "game changer")
- Focar ROI e resultados mensuráveis

EXEMPLO ESTRUTURA:

🚫 73% dos sites perdem vendas nos primeiros 3 segundos

Seu site pode ser lindo, mas se demora +2s pra carregar, você está jogando R$15-30k/mês no lixo.

Na Prismatic Labs, sites carregam em 0.8s (98% mais rápido que a média):
✅ Core Web Vitals 100/100
✅ +40% taxa de conversão
✅ -65% taxa de rejeição
✅ Performance que seus concorrentes não conseguem copiar

Último cliente (e-commerce): De R$45k → R$180k/mês em 90 dias.

Você tá perdendo dinheiro AGORA.
👉 Link na bio pra orçamento grátis (só 2 vagas Janeiro)

#WebDesign #SitesProfissionais #Performance #Conversao #PrismaticLabs #LandingPage #Ecommerce #VendasOnline

Retorne APENAS a legenda pronta, sem títulos ou explicações.`;

async function generateCaptions() {
  console.log('✍️ Gerando legendas com Gemini AI...');
  
  const generatedDir = path.join(__dirname, '../generated');
  
  try {
    // Carrega tópicos
    const files = await fs.readdir(generatedDir);
    const topicFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    
    if (!topicFile) {
      throw new Error('Arquivo de tópicos não encontrado.');
    }
    
    const topics = JSON.parse(await fs.readFile(path.join(generatedDir, topicFile), 'utf-8'));
    
    // Cria pasta captions
    const captionsDir = path.join(generatedDir, 'captions');
    await fs.mkdir(captionsDir, { recursive: true });
    
    // Inicializa Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    let created = 0;
    
    for (const topic of topics) {
      const prompt = PROMPT_CAPTION(topic.tema, topic.tipo);
      
      try {
        const result = await model.generateContent(prompt);
        const caption = result.response.text().trim();
        
        const filename = `caption-${String(topic.dia).padStart(2, '0')}.txt`;
        const filepath = path.join(captionsDir, filename);
        
        await fs.writeFile(filepath, caption);
        created++;
        console.log(`   ✓ ${filename}`);
        
        // Rate limit: 60 req/min = 1 req/segundo
        await new Promise(resolve => setTimeout(resolve, 1100));
        
      } catch (error) {
        console.warn(`   ⚠️ Erro no dia ${topic.dia}: ${error.message}`);
      }
    }
    
    console.log(`✅ ${created} legendas geradas em: ${captionsDir}`);
    return created;
    
  } catch (error) {
    console.error('❌ Erro ao gerar legendas:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateCaptions();
}

module.exports = { generateCaptions };