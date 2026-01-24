#!/usr/bin/env node
/**
 * ✍️ SCRIPT 4: GERAÇÃO DE LEGENDAS (GEMINI AI)
 * 
 * O QUE FAZ:
 * 1. Lê: topics-*.json + images/manifest.json
 * 2. Para cada post: Gemini gera legenda otimizada
 * 3. Estrutura: Hook + Problema + Solução + CTA + Hashtags
 * 4. Salva: TXTs prontos para Instagram
 * 
 * ESTRATÉGIA:
 * - Hook impactante (primeira linha)
 * - Storytelling (problema → solução → resultado)
 * - CTA forte (link bio, DM, whats)
 * - Hashtags estratégicas (alcance + nicho)
 * - Tom: Autoridade + urgência + vendas
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Prompt para legenda
function createCaptionPrompt(post, tipo) {
  const ctaOptions = {
    'educacional': 'Link na bio para aprender mais',
    'social-proof': 'Quer resultado assim? Link na bio',
    'vendas': 'Últimas vagas! Link na bio',
    'urgencia': 'Corre! Link na bio antes que acabe'
  };

  const cta = ctaOptions[tipo] || 'Link na bio';

  return `Você é copywriter especializado em Instagram para vendas B2B premium.

CRIE legenda Instagram para:
TÓPICO: ${post.tema}
TIPO: ${tipo}
HOOK: ${post.hook || 'Crie um hook impactante'}

ESTRATÉGIA:
1. HOOK (primeira linha): Pergunta provocativa ou afirmação impactante
2. PROBLEMA (2-3 linhas): Dor do público (empresas/profissionais)
3. SOLUÇÃO (3-4 linhas): Como Prismatic Labs resolve + benefícios
4. PROVA SOCIAL (1-2 linhas): Números/resultados reais
5. CTA (última linha): ${cta}

TOM:
- Direto e profissional
- Autoridade (não arrogância)
- Urgência sem desespero
- Foco em RESULTADOS e ROI

REGRAS:
- Máximo 2200 caracteres
- Usar emojis estratégicos (não exagerar)
- Quebras de linha para leitura fácil
- NÃO usar clichês
- NÃO prometer milagres
- SIM números e dados

HASHTAGS (final, separado):
15 hashtags mix:
- 5 alto alcance (#WebDesign #MarketingDigital)
- 5 nicho (#LandingPage #SitesPremium)
- 5 local/segmento (#SitesFlorianopolis #Ecommerce)

FORMATO:
[LEGENDA]
...

[HASHTAGS]
#tag1 #tag2 #tag3...

GERE AGORA (apenas legenda + hashtags, sem explicações):`;
}

// Função principal
async function generateCaptions() {
  try {
    console.log('\n✍️ GERANDO LEGENDAS...\n');

    // 1. Ler topics
    const generatedDir = path.join(__dirname, '..', 'generated');
    const files = await fs.readdir(generatedDir);
    const topicsFiles = files.filter(f => f.startsWith('topics-') && f.endsWith('.json'));

    if (topicsFiles.length === 0) {
      throw new Error('Topics não encontrado. Execute: npm run generate-topics');
    }

    topicsFiles.sort().reverse();
    const topicsPath = path.join(generatedDir, topicsFiles[0]);
    const topics = JSON.parse(await fs.readFile(topicsPath, 'utf8'));

    console.log(`📂 Topics: ${topicsFiles[0]}`);
    console.log(`📊 Total posts: ${topics.posts.length}\n`);

    // 2. Criar pasta captions
    const captionsDir = path.join(generatedDir, 'captions');
    await fs.mkdir(captionsDir, { recursive: true });

    // 3. Gerar legendas
    const results = [];
    for (let i = 0; i < topics.posts.length; i++) {
      const post = topics.posts[i];
      const postNumber = String(post.id).padStart(2, '0');
      
      console.log(`  [✍️ ${postNumber}/${topics.posts.length}] ${post.tema.substring(0, 50)}...`);

      try {
        // Chamar Gemini
        const prompt = createCaptionPrompt(post, post.tipo);
        const result = await model.generateContent(prompt);
        const caption = result.response.text().trim();

        // Salvar
        const filename = `post-${postNumber}.txt`;
        const filepath = path.join(captionsDir, filename);
        await fs.writeFile(filepath, caption, 'utf8');

        // Extrair preview
        const firstLine = caption.split('\n')[0];
        const charCount = caption.length;

        results.push({
          id: post.id,
          tema: post.tema,
          tipo: post.tipo,
          file: filename,
          preview: firstLine.substring(0, 60) + '...',
          chars: charCount,
          timestamp: new Date().toISOString()
        });

        console.log(`     ✅ ${filename} (${charCount} caracteres)`);
        console.log(`     💬 "${firstLine.substring(0, 50)}..."\n`);

        // Aguardar para não exceder rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`     ❌ Erro ao gerar legenda ${post.id}:`, error.message);
        results.push({
          id: post.id,
          tema: post.tema,
          tipo: post.tipo,
          file: null,
          error: error.message
        });
      }
    }

    // 4. Salvar manifesto
    const manifestPath = path.join(captionsDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify({
      gerado_em: new Date().toISOString(),
      total: results.length,
      sucesso: results.filter(r => !r.error).length,
      falhas: results.filter(r => r.error).length,
      captions: results
    }, null, 2));

    // 5. Resumo
    const successCount = results.filter(r => !r.error).length;
    const failCount = results.filter(r => r.error).length;

    console.log('\n✅ LEGENDAS GERADAS!\n');
    console.log(`📁 Pasta: ${captionsDir}`);
    console.log(`✅ Sucesso: ${successCount}`);
    if (failCount > 0) {
      console.log(`❌ Falhas: ${failCount}`);
    }
    
    const avgChars = results
      .filter(r => r.chars)
      .reduce((sum, r) => sum + r.chars, 0) / successCount;
    console.log(`📊 Média caracteres: ${Math.round(avgChars)}`);
    
    console.log('\n🚀 Próximo passo: npm run upload-drive\n');

    if (failCount > 0) {
      console.warn('⚠️  Algumas legendas falharam. Verifique rate limit Gemini API.');
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n🔧 Soluções:');
    console.error('1. Verificar GEMINI_API_KEY');
    console.error('2. Verificar cota (60 req/min)');
    console.error('3. Topics existem?\n');
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  generateCaptions();
}

module.exports = { generateCaptions };
