#!/usr/bin/env node
/**
 * PRISMATIC LABS - INSTAGRAM AUTOMATION
 * Script 5: Upload para Google Drive
 * 
 * O QUE FAZ:
 * - Cria pasta organizada no Drive: /Instagram/[Mês]-2026/
 * - Upload 28 imagens + 28 legendas
 * - Gera URLs públicas
 * - Salva mapeamento para Make.com
 * 
 * INPUT: /generated/images/*.png + /generated/captions/*.txt
 * OUTPUT: Google Drive + /generated/drive-mapping.json
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

// Inicializar Google Drive API
async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_DRIVE_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  
  const authClient = await auth.getClient();
  return google.drive({ version: 'v3', auth: authClient });
}

// Criar estrutura de pastas
async function createFolderStructure(drive, month, year) {
  // Pasta raiz: Instagram
  const rootFolder = await drive.files.create({
    requestBody: {
      name: 'Instagram Automation',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    },
    fields: 'id'
  });

  // Pasta do mês: Fevereiro-2026
  const monthFolder = await drive.files.create({
    requestBody: {
      name: `${month}-${year}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolder.data.id]
    },
    fields: 'id'
  });

  // Subpastas: Imagens e Legendas
  const imagesFolder = await drive.files.create({
    requestBody: {
      name: 'Imagens',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [monthFolder.data.id]
    },
    fields: 'id'
  });

  const captionsFolder = await drive.files.create({
    requestBody: {
      name: 'Legendas',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [monthFolder.data.id]
    },
    fields: 'id'
  });

  return {
    month: monthFolder.data.id,
    images: imagesFolder.data.id,
    captions: captionsFolder.data.id
  };
}

// Upload arquivo
async function uploadFile(drive, filePath, folderId, mimeType) {
  const fileContent = await fs.readFile(filePath);
  const fileName = path.basename(filePath);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType,
      body: require('stream').Readable.from(fileContent)
    },
    fields: 'id, webViewLink, webContentLink'
  });

  // Tornar público
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  return {
    id: file.data.id,
    name: fileName,
    url: file.data.webContentLink
  };
}

// Função principal
async function uploadToDrive(month) {
  console.log(chalk.blue.bold('\n☁️ ETAPA 5: UPLOAD GOOGLE DRIVE\n'));

  try {
    const drive = await getDriveClient();
    const year = new Date().getFullYear();

    console.log(chalk.gray('Criando estrutura de pastas...\n'));
    const folders = await createFolderStructure(drive, month, year);

    // Paths locais
    const imagesDir = path.join(__dirname, '../generated/images');
    const captionsDir = path.join(__dirname, '../generated/captions');

    // Listar arquivos
    const imageFiles = await fs.readdir(imagesDir);
    const captionFiles = await fs.readdir(captionsDir);

    console.log(chalk.gray(`Imagens: ${imageFiles.length} arquivos`));
    console.log(chalk.gray(`Legendas: ${captionFiles.length} arquivos\n`));

    const mapping = [];

    // Upload imagens
    console.log(chalk.cyan('Uploading imagens...\n'));
    for (const [index, filename] of imageFiles.entries()) {
      const filePath = path.join(imagesDir, filename);
      const uploaded = await uploadFile(drive, filePath, folders.images, 'image/png');
      
      mapping.push({
        postNumber: index + 1,
        image: uploaded
      });
      
      console.log(chalk.green(`✓ ${filename} (${index + 1}/${imageFiles.length})`));
    }

    // Upload legendas
    console.log(chalk.cyan('\nUploading legendas...\n'));
    for (const [index, filename] of captionFiles.entries()) {
      const filePath = path.join(captionsDir, filename);
      const uploaded = await uploadFile(drive, filePath, folders.captions, 'text/plain');
      
      mapping[index].caption = uploaded;
      
      console.log(chalk.green(`✓ ${filename} (${index + 1}/${captionFiles.length})`));
    }

    // Salvar mapeamento
    const mappingPath = path.join(__dirname, '../generated/drive-mapping.json');
    const mappingData = {
      month,
      year,
      folders,
      posts: mapping,
      generatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(mappingPath, JSON.stringify(mappingData, null, 2), 'utf-8');

    console.log(chalk.green.bold(`\n✓ Upload completo! ${mapping.length} posts no Drive\n`));
    console.log(chalk.gray(`Mapeamento: ${mappingPath}\n`));
    console.log(chalk.blue.bold('ETAPA 5 CONCLUÍDA ✅\n'));

    return mappingData;

  } catch (error) {
    console.error(chalk.red.bold('\n✗ ERRO no upload Drive:\n'));
    console.error(chalk.red(error.message));
    
    if (error.message.includes('credentials')) {
      console.log(chalk.yellow('\n🔑 Configure Google Drive API:\n'));
      console.log(chalk.gray('1. https://console.cloud.google.com/apis/credentials'));
      console.log(chalk.gray('2. Criar Service Account'));
      console.log(chalk.gray('3. Baixar JSON credentials'));
      console.log(chalk.gray('4. Configurar GOOGLE_DRIVE_CREDENTIALS no .env\n'));
    }
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const month = process.argv[2] || 'Fevereiro';
  uploadToDrive(month);
}

module.exports = uploadToDrive;
