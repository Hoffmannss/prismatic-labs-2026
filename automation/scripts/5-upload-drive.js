#!/usr/bin/env node
/**
 * SCRIPT 5: UPLOAD GOOGLE DRIVE
 * 
 * Função: Envia todas as imagens e legendas para Google Drive
 * Input: generated/images/ e generated/captions/
 * Output: Arquivos no Drive + JSON com mapeamento URLs
 * 
 * Como funciona:
 * 1. Autentica Google Drive API
 * 2. Cria pasta organizada (Instagram/[Mes]-2026)
 * 3. Upload batch de todos arquivos
 * 4. Gera URLs públicas
 * 5. Salva mapeamento para Make.com usar
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let drive;

async function authenticateDrive() {
  const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || '{}');
  
  if (!credentials.client_email) {
    throw new Error('GOOGLE_DRIVE_CREDENTIALS inválida. Use Service Account JSON.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES
  });

  drive = google.drive({ version: 'v3', auth });
  return drive;
}

async function createFolder(name, parentId = null) {
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] })
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, webViewLink'
  });

  return response.data;
}

async function uploadFile(filePath, folderId) {
  const fileName = path.basename(filePath);
  const fileContent = await fs.readFile(filePath);

  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const media = {
    mimeType: fileName.endsWith('.png') ? 'image/png' : 'text/plain',
    body: fileContent
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink, webContentLink'
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

async function uploadToDrive() {
  try {
    console.log('☁️ Fazendo upload para Google Drive...');

    // 1. Autentica
    await authenticateDrive();
    console.log('✅ Autenticado no Google Drive');

    // 2. Lê estrutura local
    const generatedDir = path.join(__dirname, '../generated');
    const imagesDir = path.join(generatedDir, 'images');
    const captionsDir = path.join(generatedDir, 'captions');

    const imageFiles = await fs.readdir(imagesDir);
    const captionFiles = await fs.readdir(captionsDir);

    // 3. Cria estrutura de pastas no Drive
    const files = await fs.readdir(generatedDir);
    const topicsFile = files.find(f => f.startsWith('topics-'));
    const monthName = topicsFile.match(/topics-(\w+)\.json/)[1];
    const folderName = `Instagram-${monthName.charAt(0).toUpperCase() + monthName.slice(1)}-2026`;

    console.log(`📁 Criando pasta: ${folderName}`);
    const mainFolder = await createFolder(folderName);
    const imagesFolder = await createFolder('Imagens', mainFolder.id);
    const captionsFolder = await createFolder('Legendas', mainFolder.id);

    // 4. Upload imagens
    console.log(`🖼️ Uploadando ${imageFiles.length} imagens...`);
    const imageUploads = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      console.log(`   [${i + 1}/${imageFiles.length}] ${file}`);
      const filePath = path.join(imagesDir, file);
      const uploaded = await uploadFile(filePath, imagesFolder.id);
      imageUploads.push({
        filename: file,
        url: `https://drive.google.com/uc?export=view&id=${uploaded.id}`,
        id: uploaded.id
      });
    }

    // 5. Upload legendas
    console.log(`📝 Uploadando ${captionFiles.length} legendas...`);
    const captionUploads = [];
    for (let i = 0; i < captionFiles.length; i++) {
      const file = captionFiles[i];
      console.log(`   [${i + 1}/${captionFiles.length}] ${file}`);
      const filePath = path.join(captionsDir, file);
      const uploaded = await uploadFile(filePath, captionsFolder.id);
      captionUploads.push({
        filename: file,
        url: `https://drive.google.com/uc?export=view&id=${uploaded.id}`,
        id: uploaded.id
      });
    }

    // 6. Salva mapeamento
    const mapping = {
      uploaded_at: new Date().toISOString(),
      month: monthName,
      drive_folder: mainFolder.webViewLink,
      images_folder: imagesFolder.id,
      captions_folder: captionsFolder.id,
      posts: imageUploads.map((img, i) => ({
        post_number: i + 1,
        image: img,
        caption: captionUploads[i]
      }))
    };

    const mappingPath = path.join(generatedDir, 'drive-mapping.json');
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));

    console.log(`✅ Upload concluído!`);
    console.log(`🔗 Pasta Drive: ${mainFolder.webViewLink}`);
    console.log(`📊 Total posts: ${mapping.posts.length}`);

    return mapping;

  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  uploadToDrive();
}

module.exports = { uploadToDrive };
