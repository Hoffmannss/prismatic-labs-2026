#!/usr/bin/env node
/**
 * PRISMATIC LABS - INSTAGRAM AUTOMATION
 * Script 6: Trigger Make.com para Agendamento
 * 
 * O QUE FAZ:
 * - Envia webhook para Make.com
 * - Payload: mapeamento Drive + configurações
 * - Make.com pega de lá e agenda Instagram
 * 
 * INPUT: /generated/drive-mapping.json
 * OUTPUT: Webhook Make.com (inicia agendamento)
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

// Função principal
async function triggerMake(month) {
  console.log(chalk.blue.bold('\n🚀 ETAPA 6: TRIGGER MAKE.COM\n'));

  try {
    // Ler mapeamento Drive
    const mappingPath = path.join(__dirname, '../generated/drive-mapping.json');
    const mappingData = await fs.readFile(mappingPath, 'utf-8');
    const mapping = JSON.parse(mappingData);

    console.log(chalk.gray(`Posts mapeados: ${mapping.posts.length}`));
    console.log(chalk.gray(`Mês: ${mapping.month} ${mapping.year}\n`));

    // Preparar payload
    const payload = {
      trigger: 'instagram-automation',
      month: mapping.month,
      year: mapping.year,
      totalPosts: mapping.posts.length,
      driveFolders: mapping.folders,
      posts: mapping.posts.map((post, index) => ({
        number: post.postNumber,
        imageUrl: post.image.url,
        imageId: post.image.id,
        captionUrl: post.caption.url,
        captionId: post.caption.id,
        // Make.com vai calcular data de agendamento
      })),
      settings: {
        postsPerWeek: 4,
        preferredTimes: ['10:00', '14:00', '17:00', '19:00'],
        timezone: process.env.TIMEZONE || 'America/Sao_Paulo'
      },
      metadata: {
        generatedAt: mapping.generatedAt,
        triggeredAt: new Date().toISOString(),
        source: 'GitHub Actions'
      }
    };

    // Enviar webhook
    console.log(chalk.cyan('Enviando webhook para Make.com...\n'));
    
    const response = await axios.post(
      process.env.MAKE_WEBHOOK_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(chalk.green('✓ Webhook enviado com sucesso!\n'));
    console.log(chalk.gray(`Status: ${response.status}`));
    console.log(chalk.gray(`Response: ${JSON.stringify(response.data, null, 2)}\n`));

    // Salvar log
    const logPath = path.join(__dirname, '../generated/make-trigger-log.json');
    const logData = {
      payload,
      response: {
        status: response.status,
        data: response.data
      },
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(logPath, JSON.stringify(logData, null, 2), 'utf-8');

    console.log(chalk.green.bold('✓ Make.com disparado com sucesso!\n'));
    console.log(chalk.gray(`Log: ${logPath}\n`));
    console.log(chalk.blue.bold('ETAPA 6 CONCLUÍDA ✅\n'));
    console.log(chalk.magenta.bold('\n🎉 PROCESSO COMPLETO! Make.com está agendando posts agora...\n'));

    return response.data;

  } catch (error) {
    console.error(chalk.red.bold('\n✗ ERRO ao disparar Make.com:\n'));
    console.error(chalk.red(error.message));
    
    if (error.response) {
      console.log(chalk.yellow(`\nStatus: ${error.response.status}`));
      console.log(chalk.yellow(`Data: ${JSON.stringify(error.response.data)}\n`));
    }
    
    if (error.message.includes('ENOENT')) {
      console.log(chalk.yellow('\n⚠️ Execute antes: npm run upload:drive\n'));
    }
    
    if (!process.env.MAKE_WEBHOOK_URL) {
      console.log(chalk.yellow('\n🔗 Configure MAKE_WEBHOOK_URL no .env\n'));
    }
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const month = process.argv[2] || 'Fevereiro';
  triggerMake(month);
}

module.exports = triggerMake;
