#!/usr/bin/env node
/**
 * 🧠 SCRIPT 1: GERAÇÃO DE TÓPICOS (GEMINI AI)
 * 
 * O QUE FAZ:
 * 1. Recebe: Mês, ano, quantidade posts
 * 2. Usa Gemini para gerar tópicos estratégicos
 * 3. Salva: JSON com todos os tópicos
 * 
 * EXEMPLO OUTPUT:
 * {
 *   "mes": "Fevereiro",
 *   "ano": 2026,
 *   "total": 28,
 *   "posts": [
 *     {"dia": 1, "tema": "Sites rápidos vendem 3x mais", "tipo": "educacional"},
 *     {"dia": 2, "tema": "Case: Cliente +400% conversão", "tipo": "social-proof"},
 *     ...
 *   ]
 * }
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Criar pasta generated se não existir
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Prompt otimizado para geração tópicos
function createPrompt(month, year, count) {
  return `Você é especialista em marketing digital para agências web premium.

Gere EXATAMENTE ${count} tópicos para posts Instagram da PRISMATIC LABS:
- Foco: Landing pages, sites premium, automação, vendas
- Objetivo: Gerar leads qualificados (empresas/profissionais que pagam R$5k-50k)
- Tom: Autoridade + urgencia + social proof
- Mês: ${month} ${year}

DISTRIBUIÇÃO:
- 40% Educacionais (problemas/soluções)
- 30% Vendas diretas (CTAs fortes)
- 30% Social proof (cases, resultados)

RETORNE JSON PURO (sem markdown, sem explicações):
{
  "posts": [
    {"dia": 1, "tema": "Dark mode aumenta conversões em 40%", "tipo": "educacional", "hook": "Seu site está perdendo 40% das vendas?"},
    {"dia": 2, "tema": "Case: Cliente faturou R$180k no primeiro mês", "tipo": "social-proof", "hook": "De R$0 para R$180k em 30 dias"},
    ...
  ]
}

TEMAS PRIORITÁRIOS:
- Performance (velocidade, conversão, ROI)
- Design premium (dark mode, minimalismo, tipografia)
- Automação (Zapier, IA, chatbots)
- Cases reais (números, antes/depois)
- Comparações (site profissional vs amador)
- Urgência (vagas limitadas, promoções)

EVITE:
- Tópicos genéricos
- Repetições
- Teoria sem prática
- Conteúdo que não vende

GERE AGORA:`;
}

// Função principal
async function generateTopics() {
  try {
    // 1. Ler argumentos
    const month = process.argv[2] || 'Próximo';
    const year = process.argv[3] || new Date().getFullYear();
    const count = parseInt(process.argv[4]) || 28;

    console.log('\n🧠 GERANDO TÓPICOS...');
    console.log(`📅 Mês: ${month} ${year}`);
    console.log(`📊 Quantidade: ${count} posts\n`);

    // 2. Criar pasta
    const outputDir = path.join(__dirname, '..', 'generated');
    await ensureDir(outputDir);

    // 3. Chamar Gemini
    console.log('⏳ Consultando Gemini AI...');
    const prompt = createPrompt(month, year, count);
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // 4. Parsear resposta
    console.log('🔍 Processando resposta...');
    
    // Remover markdown se existir
    let jsonText = response.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const data = JSON.parse(jsonText);

    // 5. Validar
    if (!data.posts || !Array.isArray(data.posts)) {
      throw new Error('Resposta inválida do Gemini: posts não é array');
    }

    if (data.posts.length !== count) {
      console.warn(`⚠️ Gemini retornou ${data.posts.length} posts, esperado ${count}`);
    }

    // 6. Adicionar metadados
    const output = {
      meta: {
        mes: month,
        ano: year,
        total: data.posts.length,
        gerado_em: new Date().toISOString(),
        versao: '1.0.0'
      },
      posts: data.posts.map((post, index) => ({
        id: index + 1,
        dia: post.dia || index + 1,
        tema: post.tema,
        tipo: post.tipo,
        hook: post.hook || '',
        gerado: true
      }))
    };

    // 7. Salvar
    const filename = `topics-${month.toLowerCase()}-${year}.json`;
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(output, null, 2), 'utf8');

    // 8. Resumo
    console.log('\n✅ TÓPICOS GERADOS COM SUCESSO!\n');
    console.log(`📁 Arquivo: ${filename}`);
    console.log(`📊 Total: ${output.posts.length} posts`);
    console.log('\n📊 Distribuição:');
    
    const tipos = output.posts.reduce((acc, post) => {
      acc[post.tipo] = (acc[post.tipo] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(tipos).forEach(([tipo, count]) => {
      console.log(`  - ${tipo}: ${count} (${Math.round(count/output.posts.length*100)}%)`);
    });

    console.log('\n🚀 Próximo passo: npm run create-html\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n🔧 Soluções:');
    console.error('1. Verificar GEMINI_API_KEY no .env');
    console.error('2. Verificar cota API (60 req/min)');
    console.error('3. Testar chave: https://aistudio.google.com/apikey\n');
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  generateTopics();
}

module.exports = { generateTopics };
