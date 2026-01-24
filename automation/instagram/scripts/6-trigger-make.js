const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

async function triggerMake() {
  console.log('🚀 Disparando Make.com...');

  const mappingPath = path.join(__dirname, '../generated/drive-mapping.json');
  const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf-8'));

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('⚠️ MAKE_WEBHOOK_URL não configurado. Pulando...');
    return;
  }

  const payload = {
    event: 'instagram_posts_ready',
    folder: mapping.folder,
    folder_id: mapping.folderId,
    total_posts: mapping.images.length,
    images: mapping.images,
    captions: mapping.captions,
    timestamp: mapping.timestamp
  };

  const response = await axios.post(webhookUrl, payload);
  
  console.log('✅ Make.com notificado!');
  console.log('📊 Resposta:', response.data);
}

triggerMake().catch(console.error);