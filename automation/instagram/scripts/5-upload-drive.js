#!/usr/bin/env node
/**
 * ☁️ SCRIPT 5: UPLOAD GOOGLE DRIVE
 * 
 * O QUE FAZ:
 * 1. Autentica: Service Account Google
 * 2. Cria estrutura: /Instagram/[Mês]/Imagens e /Legendas
 * 3. Upload: Todas imagens + legendas
 * 4. Gera: URLs públicas para cada arquivo
 * 5. Salva: mapping.json (imagem ↔ legenda)
 * 
 * ORGANIZAÇÃO DRIVE:
 * Instagram Automation/
 *   └─ Fevereiro-2026/
 *      ├─ Imagens/
 *      │  ├─ post-01.png
 *      │  ├─ post-02.png
 *      │  └─ ...
 *      └─ Legendas/
 *         ├─ post-01.txt
 *         ├─ post-02.txt
 *         └─ ...
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// Autenticar Google Drive
function authenticateDrive() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  return google.drive({ version: 'v3', auth });
}

// Criar pasta no Drive
async function createFolder(drive, name, parentId) {
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : []
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name, webViewLink'
  });

  // Tornar público
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  return response.data;
}

// Upload arquivo
async function uploadFile(drive, filepath, filename, folderId) {
  const fileMetadata = {
    name: filename,
    parents: [folderId]
  };

  const media = {
    mimeType: filename.endsWith('.png') ? 'image/png' : 'text/plain',
    body: require('fs').createReadStream(filepath)
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink, webContentLink'
  });

  // Tornar público
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // URL direta (não preview)
  const directUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

  return {
    ...response.data,
    directUrl
  };
}

// Função principal
async function uploadToDrive() {
  try {
    console.log('\n☁️ UPLOAD GOOGLE DRIVE...\n');

    // 1. Autenticar
    console.log('🔑 Autenticando...');
    const drive = authenticateDrive();
    console.log('✅ Autenticado!\n');

    // 2. Verificar arquivos locais
    const generatedDir = path.join(__dirname, '..', 'generated');
    const imagesDir = path.join(generatedDir, 'images');
    const captionsDir = path.join(generatedDir, 'captions');

    const imageFiles = (await fs.readdir(imagesDir))
      .filter(f => f.endsWith('.png'));
    const captionFiles = (await fs.readdir(captionsDir))
      .filter(f => f.endsWith('.txt'));

    console.log(`📂 Imagens: ${imageFiles.length}`);
    console.log(`📂 Legendas: ${captionFiles.length}\n`);

    if (imageFiles.length === 0) {
      throw new Error('Sem imagens. Execute: npm run screenshots');
    }

    // 3. Obter mês/ano
    const topicsFiles = (await fs.readdir(generatedDir))
      .filter(f => f.startsWith('topics-'));
    topicsFiles.sort().reverse();
    const topicsData = JSON.parse(
      await fs.readFile(path.join(generatedDir, topicsFiles[0]), 'utf8')
    );
    const monthYear = `${topicsData.meta.mes}-${topicsData.meta.ano}`;

    // 4. Criar estrutura pastas Drive
    console.log('📁 Criando estrutura Drive...');
    
    const rootFolderId = process.env.DRIVE_FOLDER_ID;
    
    const monthFolder = await createFolder(drive, monthYear, rootFolderId);
    console.log(`  ✅ Pasta: ${monthYear}`);

    const imagesFolder = await createFolder(drive, 'Imagens', monthFolder.id);
    console.log(`  ✅ Subpasta: Imagens`);

    const captionsFolder = await createFolder(drive, 'Legendas', monthFolder.id);
    console.log(`  ✅ Subpasta: Legendas\n`);

    // 5. Upload imagens
    console.log('📸 Uploading imagens...\n');
    const uploadedImages = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const filepath = path.join(imagesDir, file);
      
      console.log(`  [${i+1}/${imageFiles.length}] ${file}`);
      
      const uploaded = await uploadFile(drive, filepath, file, imagesFolder.id);
      uploadedImages.push({
        filename: file,
        id: uploaded.id,
        url: uploaded.directUrl,
        webViewLink: uploaded.webViewLink
      });
      
      console.log(`     ✅ ${uploaded.directUrl.substring(0, 60)}...\n`);
    }

    // 6. Upload legendas
    console.log('\n✍️ Uploading legendas...\n');
    const uploadedCaptions = [];
    
    for (let i = 0; i < captionFiles.length; i++) {
      const file = captionFiles[i];
      const filepath = path.join(captionsDir, file);
      
      console.log(`  [${i+1}/${captionFiles.length}] ${file}`);
      
      const uploaded = await uploadFile(drive, filepath, file, captionsFolder.id);
      uploadedCaptions.push({
        filename: file,
        id: uploaded.id,
        url: uploaded.directUrl,
        webViewLink: uploaded.webViewLink
      });
      
      console.log(`     ✅ Uploaded\n`);
    }

    // 7. Criar mapeamento
    const mapping = [];
    for (let i = 0; i < Math.max(uploadedImages.length, uploadedCaptions.length); i++) {
      const postNumber = String(i + 1).padStart(2, '0');
      mapping.push({
        post_id: i + 1,
        post_number: postNumber,
        image: uploadedImages[i] || null,
        caption: uploadedCaptions[i] || null
      });
    }

    // 8. Salvar mapping local
    const mappingPath = path.join(generatedDir, 'mapping.json');
    await fs.writeFile(mappingPath, JSON.stringify({
      gerado_em: new Date().toISOString(),
      mes_ano: monthYear,
      drive_folder: monthFolder.webViewLink,
      total_posts: mapping.length,
      posts: mapping
    }, null, 2));

    console.log('\n✅ UPLOAD COMPLETO!\n');
    console.log(`📁 Pasta Drive: ${monthFolder.webViewLink}`);
    console.log(`📸 Imagens: ${uploadedImages.length}`);
    console.log(`✍️ Legendas: ${uploadedCaptions.length}`);
    console.log(`\n💾 Mapping salvo: ${mappingPath}`);
    console.log('\n🚀 Próximo passo: npm run trigger-make\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n🔧 Soluções:');
    console.error('1. GOOGLE_CREDENTIALS correto?');
    console.error('2. DRIVE_FOLDER_ID correto?');
    console.error('3. Service account tem permissão na pasta?');
    console.error('4. Drive API ativada no projeto?\n');
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  uploadToDrive();
}

module.exports = { uploadToDrive };
