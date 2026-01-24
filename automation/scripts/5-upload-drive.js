#!/usr/bin/env node
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

async function uploadToDrive() {
  console.log('☁️ Fazendo upload para Google Drive...');
  
  const generatedDir = path.join(__dirname, '../generated');
  const imagesDir = path.join(generatedDir, 'images');
  const captionsDir = path.join(generatedDir, 'captions');
  
  try {
    // Autenticação
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Pega nome do mês dos tópicos
    const files = await fs.readdir(generatedDir);
    const topicFile = files.find(f => f.startsWith('topics-'));
    const monthMatch = topicFile.match(/topics-([a-z]+)-([0-9]+)/);
    const monthName = monthMatch ? `${monthMatch[1]}-${monthMatch[2]}` : 'posts';
    
    // Cria pasta do mês
    const monthFolder = await drive.files.create({
      requestBody: {
        name: `Instagram-${monthName}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [process.env.DRIVE_FOLDER_ID]
      },
      fields: 'id'
    });
    
    const monthFolderId = monthFolder.data.id;
    console.log(`📁 Pasta criada: Instagram-${monthName}`);
    
    // Cria subpastas
    const imagesFolder = await drive.files.create({
      requestBody: {
        name: 'Imagens',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [monthFolderId]
      },
      fields: 'id'
    });
    
    const captionsFolder = await drive.files.create({
      requestBody: {
        name: 'Legendas',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [monthFolderId]
      },
      fields: 'id'
    });
    
    // Upload imagens
    const imageFiles = await fs.readdir(imagesDir);
    const mapping = [];
    
    for (const imageFile of imageFiles) {
      const imagePath = path.join(imagesDir, imageFile);
      const fileStream = require('fs').createReadStream(imagePath);
      
      const response = await drive.files.create({
        requestBody: {
          name: imageFile,
          parents: [imagesFolder.data.id]
        },
        media: {
          mimeType: 'image/png',
          body: fileStream
        },
        fields: 'id, webViewLink, webContentLink'
      });
      
      // Torna público
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      
      const postNumber = imageFile.match(/post-(\d+)/)[1];
      mapping.push({
        post: parseInt(postNumber),
        image_id: response.data.id,
        image_url: `https://drive.google.com/uc?export=view&id=${response.data.id}`
      });
      
      console.log(`   ✓ ${imageFile}`);
    }
    
    // Upload legendas
    const captionFiles = await fs.readdir(captionsDir);
    
    for (const captionFile of captionFiles) {
      const captionPath = path.join(captionsDir, captionFile);
      const fileStream = require('fs').createReadStream(captionPath);
      
      const response = await drive.files.create({
        requestBody: {
          name: captionFile,
          parents: [captionsFolder.data.id]
        },
        media: {
          mimeType: 'text/plain',
          body: fileStream
        },
        fields: 'id, webViewLink'
      });
      
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      
      const postNumber = captionFile.match(/caption-(\d+)/)[1];
      const mapEntry = mapping.find(m => m.post === parseInt(postNumber));
      if (mapEntry) {
        mapEntry.caption_id = response.data.id;
        mapEntry.caption_url = response.data.webViewLink;
      }
      
      console.log(`   ✓ ${captionFile}`);
    }
    
    // Salva mapeamento
    const mappingPath = path.join(generatedDir, 'drive-mapping.json');
    await fs.writeFile(mappingPath, JSON.stringify({
      month: monthName,
      folder_id: monthFolderId,
      posts: mapping
    }, null, 2));
    
    console.log(`✅ Upload completo! ${imageFiles.length} imagens + ${captionFiles.length} legendas`);
    console.log(`🔗 Pasta: https://drive.google.com/drive/folders/${monthFolderId}`);
    
    return { monthFolderId, mapping };
    
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  uploadToDrive();
}

module.exports = { uploadToDrive };