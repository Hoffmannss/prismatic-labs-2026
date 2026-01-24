#!/usr/bin/env node
/**
 * PRISMATIC LABS - INSTAGRAM AUTOMATION
 * Script 4: Geração de Legendas com IA
 * 
 * O QUE FAZ:
 * - Lê tópicos gerados
 * - Usa Gemini para criar legendas otimizadas
 * - Estrutura: Hook + Problema + Solução + CTA + Hashtags
 * 
 * INPUT: /generated/topics-[mes].json
 * OUTPUT: /generated/captions/post-[1-28].txt
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

// Prompt para cada tipo de post
const CAPTION_PROMPTS = {
  educacional: `
Crie uma legenda Instagram EDUCACIONAL para:
Tema: {{TEMA}}
Subtema: {{SUBTEMA}}

ESTRUTURA OBRIGATÓRIA:
1. HOOK (1 linha): Estatística ou fato chocante
2. PROBLEMA (2-3 linhas): Dor do cliente
3. SOLUÇÃO (3-4 linhas): Como resolver, dica prática
4. PROVA (1-2 linhas): Dado ou resultado real
5. CTA (1 linha): Convite para ação
6. HASHTAGS (10-12): Mix alcance + nicho

TOM: Educativo mas direto, sem fofura
FORMATO: Espaçamento entre blocos, emojis estratégicos (max 3)
MAX: 1800 caracteres
`,
  vendas: `
Crie uma legenda Instagram VENDAS/CTA para:
Tema: {{TEMA}}
Angulo: {{ANGULO}}

ESTRUTURA OBRIGATÓRIA:
1. HOOK (1 linha): Pergunta provocativa ou afirmação forte
2. RESULTADO (3-4 linhas): Case real com NÚMEROS
3. SOCIAL PROOF (2-3 linhas): Depoimento ou métrica
4. ESCASSEZ (1-2 linhas): Urgência ou limitação
5. CTA (1-2 linhas): Instrução clara (DM, link bio)
6. HASHTAGS (10-12): Focadas em conversão

TOM: Confiante, orientado a resultados, SEM promessas irreais
FORMATO: Bullets para resultados, espaçamento generoso
MAX: 1600 caracteres
`,
  'social-proof': `
Crie uma legenda Instagram SOCIAL PROOF para:
Tema: {{TEMA}}
Valor: {{VALOR}}

ESTRUTURA OBRIGATÓRIA:
1. HOOK (1 linha): "Cliente X alcançou Y resultado"
2. CONTEXTO (2-3 linhas): Situação antes
3. TRANSFORMAÇÃO (3-4 linhas): O que mudou, resultados específicos
4. APRENDIZADO (2-3 linhas): Insight útil para audiência
5. CTA (1 linha): Convite para obter mesmo resultado
6. HASHTAGS (10-12): Mix autoridade + nicho

TOM: Inspirador mas fact-based, celebrar vitória cliente
FORMATO: Story-driven, emojis sutis
MAX: 1700 caracteres
`
};

// Função gerar legenda individual
async function generateCaption(post) {
  const promptTemplate = CAPTION_PROMPTS[post.tipo] || CAPTION_PROMPTS.educacional;
  
  const prompt = promptTemplate
    .replace('{{TEMA}}', post.tema)
    .replace('{{SUBTEMA}}', post.subtema || post.angulo || '')
    .replace('{{ANGULO}}', post.angulo || '')
    .replace('{{VALOR}}', post.valor || '');

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

// Função principal
async function generateCaptions(month) {
  console.log(chalk.blue.bold('\n✍️ ETAPA 4: GERAÇÃO DE LEGENDAS\n'));

  try {
    // Ler tópicos
    const topicsFile = path.join(__dirname, '../generated', `topics-${month.toLowerCase()}.json`);
    const topicsData = await fs.readFile(topicsFile, 'utf-8');
    const topics = JSON.parse(topicsData);

    console.log(chalk.gray(`Tópicos: ${topics.posts.length} posts`));
    console.log(chalk.gray('Modelo: Gemini 1.5 Flash Latest (50 req/dia)'));
    console.log(chalk.gray('Delay: 3s entre requisições (evitar rate limit)\n'));

    // Criar pasta captions
    const captionsDir = path.join(__dirname, '../generated/captions');
    await fs.mkdir(captionsDir, { recursive: true });

    // Gerar legendas (com delay para evitar rate limit)
    for (const [index, post] of topics.posts.entries()) {
      try {
        const caption = await generateCaption(post);
        
        const filename = `post-${String(index + 1).padStart(2, '0')}.txt`;
        const filepath = path.join(captionsDir, filename);
        
        await fs.writeFile(filepath, caption, 'utf-8');
        
        console.log(chalk.green(`✓ ${filename} gerado (${caption.length} caracteres)`));
        
        // Delay 3s entre requisições (mais conservador)
        if (index < topics.posts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Erro post ${index + 1}, tentando novamente em 5s...`));
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const caption = await generateCaption(post);
        const filename = `post-${String(index + 1).padStart(2, '0')}.txt`;
        const filepath = path.join(captionsDir, filename);
        await fs.writeFile(filepath, caption, 'utf-8');
        
        console.log(chalk.green(`✓ ${filename} gerado (retry)`));
      }
    }

    console.log(chalk.green.bold(`\n✓ ${topics.posts.length} legendas geradas com sucesso!\n`));
    console.log(chalk.gray(`Pasta: ${captionsDir}\n`));
    console.log(chalk.blue.bold('ETAPA 4 CONCLUÍDA ✅\n'));

    return captionsDir;

  } catch (error) {
    console.error(chalk.red.bold('\n✗ ERRO na geração de legendas:\n'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const month = process.argv[2] || 'Fevereiro';
  generateCaptions(month);
}

module.exports = generateCaptions;
