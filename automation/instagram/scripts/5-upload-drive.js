const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

async function uploadToDrive() {
  console.log('☁️ Fazendo upload para Google Drive...');

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  const drive = google.drive({ version: 'v3', auth });

  // Criar pasta principal
  const now = new Date();
  const folderName = `Instagram-${now.toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
  
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id'
  });

  console.log(`📁 Pasta criada: ${folderName}`);

  // Upload imagens
  const imagesDir = path.join(__dirname, '../generated/images');
  const imageFiles = (await fs.readdir(imagesDir)).filter(f => f.endsWith('.png'));

  const uploadedImages = [];
  for (const imageFile of imageFiles) {
    const fileMetadata = {
      name: imageFile,
      parents: [folder.data.id]
    };
    const media = {
      mimeType: 'image/png',
      body: require('fs').createReadStream(path.join(imagesDir, imageFile))
    };
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });
    
    // Tornar público
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });

    uploadedImages.push({ name: imageFile, url: file.data.webViewLink });
    console.log(`  ✓ ${imageFile}`);
  }

  // Upload legendas
  const captionsDir = path.join(__dirname, '../generated/captions');
  const captionFiles = (await fs.readdir(captionsDir)).filter(f => f.endsWith('.txt'));

  const uploadedCaptions = [];
  for (const captionFile of captionFiles) {
    const fileMetadata = {
      name: captionFile,
      parents: [folder.data.id]
    };
    const media = {
      mimeType: 'text/plain',
      body: require('fs').createReadStream(path.join(captionsDir, captionFile))
    };
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    uploadedCaptions.push({ name: captionFile, url: file.data.webViewLink });
  }

  // Salvar mapeamento
  const mapping = {
    folder: folderName,
    folderId: folder.data.id,
    images: uploadedImages,
    captions: uploadedCaptions,
    timestamp: now.toISOString()
  };

  await fs.writeFile(
    path.join(__dirname, '../generated/drive-mapping.json'),
    JSON.stringify(mapping, null, 2)
  );

  console.log(`✅ ${imageFiles.length} imagens + ${captionFiles.length} legendas no Drive!`);
  return mapping;
}

uploadToDrive().catch(console.error);