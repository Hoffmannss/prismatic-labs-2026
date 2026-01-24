#!/usr/bin/env node
/**
 * SCRIPT 6: TRIGGER MAKE.COM
 * 
 * Função: Notifica Make.com que conteúdo está pronto para agendamento
 * Input: drive-mapping.json
 * Output: Webhook POST para Make.com iniciar agendamento Instagram
 * 
 * Como funciona:
 * 1. Lê mapeamento Drive
 * 2. Envia payload para webhook Make.com
 * 3. Make.com recebe e inicia scenario de agendamento
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

async function triggerMake() {
  try {
    console.log('🚀 Disparando Make.com webhook...');

    if (!MAKE_WEBHOOK_URL) {
      throw new Error('MAKE_WEBHOOK_URL não configurada');
    }

    // 1. Lê mapeamento Drive
    const generatedDir = path.join(__dirname, '../generated');
    const mappingPath = path.join(generatedDir, 'drive-mapping.json');
    const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf-8'));

    // 2. Prepara payload
    const payload = {
      trigger: 'instagram-automation',
      timestamp: new Date().toISOString(),
      month: mapping.month,
      drive_folder: mapping.drive_folder,
      total_posts: mapping.posts.length,
      posts: mapping.posts.map(post => ({
        number: post.post_number,
        image_url: post.image.url,
        caption_url: post.caption.url,
        image_id: post.image.id,
        caption_id: post.caption.id
      }))
    };

    // 3. Envia webhook
    console.log(`📤 Enviando ${payload.total_posts} posts para Make.com...`);
    const response = await axios.post(MAKE_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`✅ Webhook enviado com sucesso!`);
    console.log(`🔗 Response: ${response.status} ${response.statusText}`);
    console.log(`📱 Make.com iniciará agendamento automático no Instagram`);

    return response.data;

  } catch (error) {
    if (error.response) {
      console.error('❌ Erro na resposta Make.com:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ Erro na requisição (sem resposta)');
    } else {
      console.error('❌ Erro:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  triggerMake();
}

module.exports = { triggerMake };
