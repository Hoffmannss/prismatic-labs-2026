#!/usr/bin/env node
/**
 * SCRIPT 3: GERAÇÃO DE SCREENSHOTS
 * 
 * Função: Transforma HTMLs em imagens PNG de alta qualidade
 * Input: Arquivos HTML da pasta generated/html/
 * Output: PNGs 1080x1080 prontos para Instagram
 * 
 * Como funciona:
 * 1. Abre navegador headless (Puppeteer)
 * 2. Para cada HTML:
 *    - Carrega página
 *    - Aguarda fontes/animações
 *    - Captura screenshot
 * 3. Salva PNG otimizado
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function generateScreenshots() {
  let browser;
  
  try {
    console.log('📸 Gerando screenshots...');

    // 1. Lê arquivos HTML
    const generatedDir = path.join(__dirname, '../generated');
    const htmlDir = path.join(generatedDir, 'html');
    const htmlFiles = await fs.readdir(htmlDir);
    const sortedFiles = htmlFiles.filter(f => f.endsWith('.html')).sort();

    if (sortedFiles.length === 0) {
      throw new Error('Nenhum HTML encontrado. Execute script 2 primeiro.');
    }

    // 2. Cria pasta imagens
    const imagesDir = path.join(generatedDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    // 3. Inicia navegador
    console.log('🌐 Iniciando navegador headless...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();

    // 4. Configura viewport
    await page.setViewport({
      width: 1080,
      height: 1080,
      deviceScaleFactor: 2 // Retina quality
    });

    // 5. Processa cada HTML
    for (let i = 0; i < sortedFiles.length; i++) {
      const htmlFile = sortedFiles[i];
      const htmlPath = path.join(htmlDir, htmlFile);
      const pngFile = htmlFile.replace('.html', '.png');
      const pngPath = path.join(imagesDir, pngFile);

      console.log(`   [${i + 1}/${sortedFiles.length}] ${htmlFile}...`);

      // Carrega HTML
      await page.goto(`file://${htmlPath}`, {
        waitUntil: 'networkidle0'
      });

      // Aguarda fontes carregarem
      await page.evaluateHandle('document.fonts.ready');
      
      // Aguarda animações iniciarem
      await page.waitForTimeout(500);

      // Screenshot
      await page.screenshot({
        path: pngPath,
        type: 'png',
        omitBackground: false
      });
    }

    console.log(`✅ ${sortedFiles.length} screenshots gerados!`);
    console.log(`📁 Pasta: ${imagesDir}`);

  } catch (error) {
    console.error('❌ Erro ao gerar screenshots:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  generateScreenshots();
}

module.exports = { generateScreenshots };
