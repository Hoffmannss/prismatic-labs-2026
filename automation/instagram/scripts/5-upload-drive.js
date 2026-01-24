/**
 * ☁️ SCRIPT 5: UPLOAD GOOGLE DRIVE
 * 
 * O QUE FAZ:
 * - Faz upload de todas as imagens e legendas para Google Drive
 * - Organiza em pastas por mês
 * - Gera URLs públicas para cada arquivo
 * - Salva mapeamento JSON
 * 
 * COMO FUNCIONA:
 * 1. Autentica com service account do Google
 * 2. Cria estrutura de pastas organizada
 * 3. Upload paralelo de arquivos
 * 4. Configura permissões públicas
 * 5. Salva mapping.json com todos os links
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function uploadDrive() {
  console.log('☁️ Fazendo upload para Google Drive...');
  
  try {
    // Autenticação
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Encontra pasta raiz (configurada nos secrets)
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Lê tópicos para pegar mês/ano
    const generatedDir = path.join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    const topicsFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    const topicsData = await fs.readFile(path.join(generatedDir, topicsFile), 'utf8');
    const topics = JSON.parse(topicsData);
    
    const folderName = `${topics.mes}-${topics.ano}`;
    
    // Cria estrutura de pastas
    console.log(`📁 Criando pasta: ${folderName}...`);
    
    const monthFolder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId]
      },
      fields: 'id'
    });
    
    const monthFolderId = monthFolder.data.id;
    
    // Subpastas
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
    
    const imagesFolderId = imagesFolder.data.id;
    const captionsFolderId = captionsFolder.data.id;
    
    // Upload imagens
    console.log('📸 Fazendo upload de imagens...');
    const imagesDir = path.join(generatedDir, 'images');
    const imageFiles = await fs.readdir(imagesDir);
    const imageMapping = [];
    
    for (const imageFile of imageFiles) {
      const filePath = path.join(imagesDir, imageFile);
      const fileBuffer = await fs.readFile(filePath);
      
      const response = await drive.files.create({
        requestBody: {
          name: imageFile,
          parents: [imagesFolderId]
        },
        media: {
          mimeType: 'image/png',
          body: require('stream').Readable.from(fileBuffer)
        },
        fields: 'id, webViewLink'
      });
      
      // Torna público
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      
      imageMapping.push({
        numero: parseInt(imageFile.match(/\d+/)[0]),
        filename: imageFile,
        fileId: response.data.id,
        url: `https://drive.google.com/uc?id=${response.data.id}`
      });
      
      console.log(`  ✅ ${imageFile}`);
    }
    
    // Upload legendas
    console.log('📝 Fazendo upload de legendas...');
    const captionsDir = path.join(generatedDir, 'captions');
    const captionFiles = await fs.readdir(captionsDir);
    const captionMapping = [];
    
    for (const captionFile of captionFiles) {
      const filePath = path.join(captionsDir, captionFile);
      const content = await fs.readFile(filePath, 'utf8');
      
      const response = await drive.files.create({
        requestBody: {
          name: captionFile,
          parents: [captionsFolderId]
        },
        media: {
          mimeType: 'text/plain',
          body: require('stream').Readable.from(content)
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
      
      captionMapping.push({
        numero: parseInt(captionFile.match(/\d+/)[0]),
        filename: captionFile,
        fileId: response.data.id,
        url: response.data.webViewLink,
        text: content
      });
      
      console.log(`  ✅ ${captionFile}`);
    }
    
    // Salva mapeamento completo
    const mapping = {
      mes: topics.mes,
      ano: topics.ano,
      drive: {
        monthFolderId,
        imagesFolderId,
        captionsFolderId,
        monthFolderUrl: `https://drive.google.com/drive/folders/${monthFolderId}`
      },
      posts: topics.posts.map(post => {
        const image = imageMapping.find(i => i.numero === post.numero);
        const caption = captionMapping.find(c => c.numero === post.numero);
        return {
          numero: post.numero,
          tipo: post.tipo,
          tema: post.tema,
          image: image || null,
          caption: caption || null
        };
      })
    };
    
    const mappingPath = path.join(generatedDir, 'mapping.json');
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
    
    console.log(`✅ Upload completo!`);
    console.log(`📁 Pasta Drive: ${mapping.drive.monthFolderUrl}`);
    console.log(`🗂️ Mapeamento salvo: ${mappingPath}`);
    
    return mapping;
    
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  uploadDrive();
}

module.exports = uploadDrive;
