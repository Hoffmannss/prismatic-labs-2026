#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

async function triggerMake() {
  console.log('🚀 Disparando Make.com para agendamento...');
  
  try {
    // Carrega mapeamento do Drive
    const mappingPath = path.join(__dirname, '../generated/drive-mapping.json');
    const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf-8'));
    
    // Prepara payload
    const payload = {
      month: mapping.month,
      folder_id: mapping.folder_id,
      total_posts: mapping.posts.length,
      posts: mapping.posts.map(p => ({
        post_number: p.post,
        image_url: p.image_url,
        caption_url: p.caption_url
      })),
      generated_at: new Date().toISOString(),
      source: 'github-actions'
    };
    
    // Envia webhook
    const response = await axios.post(process.env.MAKE_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`✅ Make.com acionado com sucesso!`);
    console.log(`📊 Resposta: ${response.status} ${response.statusText}`);
    console.log(`📅 ${mapping.posts.length} posts serão agendados automaticamente`);
    
    return response.data;
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Erro Make.com:', error.response.status, error.response.data);
    } else {
      console.error('❌ Erro ao disparar Make.com:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  triggerMake();
}

module.exports = { triggerMake };