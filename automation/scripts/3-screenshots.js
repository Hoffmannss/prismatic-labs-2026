#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function generateScreenshots() {
  console.log('📸 Gerando screenshots com Puppeteer...');
  
  const generatedDir = path.join(__dirname, '../generated');
  const htmlDir = path.join(generatedDir, 'html');
  const imagesDir = path.join(generatedDir, 'images');
  
  try {
    // Verifica se HTML existe
    const htmlFiles = await fs.readdir(htmlDir);
    const postFiles = htmlFiles.filter(f => f.startsWith('post-') && f.endsWith('.html'));
    
    if (postFiles.length === 0) {
      throw new Error('Nenhum arquivo HTML encontrado. Execute 2-create-html.js primeiro.');
    }
    
    // Cria pasta imagens
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Inicia navegador
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    let created = 0;
    
    for (const htmlFile of postFiles) {
      const htmlPath = path.join(htmlDir, htmlFile);
      const imageName = htmlFile.replace('.html', '.png');
      const imagePath = path.join(imagesDir, imageName);
      
      // Detecta formato (post 1:1 ou story 9:16)
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      const isStory = htmlContent.includes('height: 1920px');
      
      // Seta viewport correto
      await page.setViewport({
        width: 1080,
        height: isStory ? 1920 : 1080,
        deviceScaleFactor: 1
      });
      
      // Abre HTML
      await page.goto(`file://${htmlPath}`, {
        waitUntil: 'networkidle0'
      });
      
      // Aguarda fonts carregarem
      await page.waitForTimeout(1000);
      
      // Screenshot
      await page.screenshot({
        path: imagePath,
        type: 'png',
        fullPage: false
      });
      
      created++;
      console.log(`   ✓ ${imageName}`);
    }
    
    await browser.close();
    
    console.log(`✅ ${created} screenshots gerados em: ${imagesDir}`);
    return created;
    
  } catch (error) {
    console.error('❌ Erro ao gerar screenshots:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateScreenshots();
}

module.exports = { generateScreenshots };