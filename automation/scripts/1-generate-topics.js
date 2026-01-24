#!/usr/bin/env node
/**
 * PRISMATIC LABS - INSTAGRAM AUTOMATION
 * Script 1: Geração de Tópicos com IA
 * 
 * O QUE FAZ:
 * - Usa Groq (Llama 3.3 70B) para gerar 28 tópicos estratégicos
 * - Mix: 40% educacional, 30% vendas, 30% social proof
 * - Distribuição semanal otimizada
 * 
 * INPUT: Mês desejado (ex: "Fevereiro")
 * OUTPUT: /generated/topics-[mes].json
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

// Configuração Groq API - 100% gratuito, sem limites
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Prompt otimizado para geração de tópicos
const PROMPT_TEMPLATE = `
Você é especialista em marketing digital e Instagram para empresas de tecnologia premium.

Gere EXATAMENTE 28 tópicos para posts Instagram da PRISMATIC LABS.

**CONTEXTO:**
- Empresa: Desenvolvimento sites/landing pages premium
- Público: Infoprodutores, e-commerces, profissionais liberais
- Objetivo: Gerar leads qualificados e demonstrar autoridade
- Tom: Profissional, direto, orientado a resultados

**DISTRIBUIÇÃO (obrigatória):**
- 11 posts EDUCACIONAIS (40%): dicas, tendências, como fazer
- 9 posts VENDAS/CTA (30%): cases, resultados, prova social  
- 8 posts SOCIAL PROOF (30%): depoimentos, bastidores, portfólio

**TEMAS PRIORITÁRIOS:**
- Dark mode e design premium
- Velocidade e performance
- Conversão e ROI
- SEO e autoridade
- Cases reais com números
- Comparações (site profissional vs amador)
- Obreções ("site é caro", "demora muito")

**FORMATO JSON OBRIGATÓRIO:**
{
  "mes": "{{MONTH}}",
  "ano": 2026,
  "total": 28,
  "posts": [
    {
      "dia": 1,
      "tipo": "educacional",
      "tema": "Título curto e impactante",
      "subtema": "Subtema específico",
      "angulo": "Como abordar o tema",
      "valor": "Que problema resolve"
    }
  ]
}

**REGRAS:**
1. Variar temas (não repetir assuntos)
2. Alternar tipos ao longo do mês
3. Títulos com max 50 caracteres
4. Focar em RESULTADOS e NÚMEROS quando possível
5. Evitar clichês de "dicas genéricas"

Retorne APENAS o JSON válido, sem markdown ou explicações.
`;

// Função principal
async function generateTopics(month) {
  console.log(chalk.blue.bold('\n🧠 ETAPA 1: GERAÇÃO DE TÓPICOS\n'));
  console.log(chalk.gray(`Mês: ${month}`));
  console.log(chalk.gray('Modelo: Llama 3.3 70B via Groq (GRATUITO)'));
  console.log(chalk.gray('Aguarde... isso pode levar 20-30 segundos\n'));

  try {
    // Verificar API key
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY não configurada no .env');
    }

    // Preparar prompt
    const prompt = PROMPT_TEMPLATE.replace('{{MONTH}}', month);

    // Chamar Groq API
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em marketing digital e geração de conteúdo para Instagram. Retorne sempre JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extrair resposta
    let text = response.data.choices[0].message.content;

    // Limpar markdown se houver
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Validar JSON
    const topics = JSON.parse(text);
    
    if (!topics.posts || topics.posts.length !== 28) {
      throw new Error(`Esperado 28 posts, recebido ${topics.posts?.length || 0}`);
    }

    // Validar distribuição
    const distribution = topics.posts.reduce((acc, post) => {
      acc[post.tipo] = (acc[post.tipo] || 0) + 1;
      return acc;
    }, {});

    console.log(chalk.green('✓ Tópicos gerados com sucesso!\n'));
    console.log(chalk.cyan('Distribuição:'));
    Object.entries(distribution).forEach(([tipo, count]) => {
      const percent = ((count / 28) * 100).toFixed(0);
      console.log(chalk.gray(`  ${tipo}: ${count} posts (${percent}%)`));
    });

    // Salvar arquivo
    const outputDir = path.join(__dirname, '../generated');
    await fs.mkdir(outputDir, { recursive: true });
    
    const filename = `topics-${month.toLowerCase()}.json`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(topics, null, 2), 'utf-8');
    
    console.log(chalk.green(`\n✓ Arquivo salvo: ${filepath}\n`));
    console.log(chalk.blue.bold('ETAPA 1 CONCLUÍDA ✅\n'));

    return topics;

  } catch (error) {
    console.error(chalk.red.bold('\n✗ ERRO na geração de tópicos:\n'));
    console.error(chalk.red(error.message));
    
    if (error.message.includes('GROQ_API_KEY')) {
      console.log(chalk.yellow('\n🔑 Configure GROQ_API_KEY no arquivo .env'));
      console.log(chalk.gray('Obtenha GRÁTIS em: https://console.groq.com/keys\n'));
    }
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const month = process.argv[2] || 'Fevereiro';
  generateTopics(month);
}

module.exports = generateTopics;
