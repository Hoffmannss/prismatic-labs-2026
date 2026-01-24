#!/usr/bin/env node
/**
 * 🚀 SCRIPT 6: TRIGGER MAKE.COM
 * 
 * O QUE FAZ:
 * 1. Lê: mapping.json (URLs Drive)
 * 2. Envia: Webhook para Make.com
 * 3. Make.com: Agenda posts no Instagram
 * 
 * PAYLOAD:
 * {
 *   "mes": "Fevereiro",
 *   "ano": 2026,
 *   "total_posts": 28,
 *   "drive_folder": "https://drive.google.com/...",
 *   "posts": [
 *     {
 *       "id": 1,
 *       "image_url": "https://drive.google.com/uc?...",
 *       "caption_url": "https://drive.google.com/uc?..."
 *     },
 *     ...
 *   ]
 * }
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Função principal
async function triggerMake() {
  try {
    console.log('\n🚀 TRIGGER MAKE.COM...\n');

    // 1. Verificar webhook URL
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('MAKE_WEBHOOK_URL não configurado no .env');
    }

    console.log(`🔗 Webhook: ${webhookUrl.substring(0, 50)}...\n`);

    // 2. Ler mapping
    const generatedDir = path.join(__dirname, '..', 'generated');
    const mappingPath = path.join(generatedDir, 'mapping.json');
    
    try {
      await fs.access(mappingPath);
    } catch {
      throw new Error('mapping.json não encontrado. Execute: npm run upload-drive');
    }

    const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf8'));
    console.log(`📂 Mapping carregado`);
    console.log(`📊 Posts: ${mapping.total_posts}\n`);

    // 3. Preparar payload
    const payload = {
      trigger_time: new Date().toISOString(),
      source: 'github-actions',
      mes: mapping.mes_ano.split('-')[0],
      ano: parseInt(mapping.mes_ano.split('-')[1]),
      total_posts: mapping.total_posts,
      drive_folder: mapping.drive_folder,
      posts: mapping.posts.map(post => ({
        id: post.post_id,
        post_number: post.post_number,
        image_url: post.image?.url || null,
        image_id: post.image?.id || null,
        caption_url: post.caption?.url || null,
        caption_id: post.caption?.id || null
      }))
    };

    console.log('📦 Payload preparado:');
    console.log(`  - Mês/Ano: ${payload.mes} ${payload.ano}`);
    console.log(`  - Posts: ${payload.total_posts}`);
    console.log(`  - Drive: ${payload.drive_folder.substring(0, 50)}...\n`);

    // 4. Enviar webhook
    console.log('📤 Enviando para Make.com...');
    
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // 5. Verificar resposta
    if (response.status === 200 || response.status === 202) {
      console.log('✅ Webhook enviado com sucesso!\n');
      console.log(`📊 Status: ${response.status}`);
      
      if (response.data) {
        console.log(`📝 Resposta: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }

      // 6. Salvar log
      const logPath = path.join(generatedDir, 'make-trigger-log.json');
      await fs.writeFile(logPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'success',
        webhook_status: response.status,
        payload_summary: {
          mes: payload.mes,
          ano: payload.ano,
          posts: payload.total_posts
        },
        response: response.data
      }, null, 2));

      console.log('\n✅ AUTOMAÇÃO COMPLETA!\n');
      console.log('🎉 Próximos passos:');
      console.log('1. Make.com começará agendamento em ~2-5min');
      console.log('2. Acompanhar: https://www.make.com/scenarios');
      console.log('3. Verificar Instagram Creator Studio em ~10min');
      console.log('4. Posts aparecerão agendados por 4 semanas');
      console.log('\n📱 Conferir: https://business.facebook.com/creatorstudio\n');

    } else {
      throw new Error(`Make.com retornou status ${response.status}`);
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    
    if (error.response) {
      console.error('\n📝 Resposta Make.com:');
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }

    console.error('\n🔧 Soluções:');
    console.error('1. Verificar MAKE_WEBHOOK_URL correto');
    console.error('2. Make.com scenario está ATIVADO?');
    console.error('3. Testar webhook manual: Postman/Insomnia');
    console.error('4. Verificar logs Make.com: https://www.make.com/scenarios\n');
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  triggerMake();
}

module.exports = { triggerMake };
