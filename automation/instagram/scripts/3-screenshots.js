/**
 * 📸 SCRIPT 3: GERA SCREENSHOTS AUTOMATIZADOS
 * 
 * O QUE FAZ:
 * - Usa Puppeteer (navegador headless) para abrir cada HTML
 * - Tira screenshot em alta qualidade 1080x1080
 * - Salva PNG otimizado para Instagram
 * 
 * COMO FUNCIONA:
 * 1. Inicia navegador Chrome invisível
 * 2. Para cada HTML: abre → aguarda fonts → screenshot
 * 3. Salva em /generated/images/
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function gerarScreenshots() {
  console.log('📸 Gerando screenshots...');
  
  let browser;
  
  try {
    // Encontra pasta de HTMLs
    const htmlDir = path.join(__dirname, '../generated/html');
    const files = await fs.readdir(htmlDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      throw new Error('Nenhum HTML encontrado. Execute script 2 primeiro.');
    }
    
    // Cria pasta para imagens
    const imagesDir = path.join(__dirname, '../generated/images');
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Inicia navegador
    console.log('🌐 Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Configura viewport Instagram (1080x1080)
    await page.setViewport({
      width: 1080,
      height: 1080,
      deviceScaleFactor: 2  // Retina para melhor qualidade
    });
    
    // Processa cada HTML
    for (let i = 0; i < htmlFiles.length; i++) {
      const htmlFile = htmlFiles[i];
      const htmlPath = path.join(htmlDir, htmlFile);
      const imageName = htmlFile.replace('.html', '.png');
      const imagePath = path.join(imagesDir, imageName);
      
      console.log(`  [${i+1}/${htmlFiles.length}] Processando ${htmlFile}...`);
      
      // Abre HTML
      await page.goto(`file://${htmlPath}`, {
        waitUntil: 'networkidle0'
      });
      
      // Aguarda fonts carregarem (crucial para qualidade)
      await page.evaluateHandle('document.fonts.ready');
      await page.waitForTimeout(500);  // Margem de segurança
      
      // Screenshot
      await page.screenshot({
        path: imagePath,
        type: 'png',
        omitBackground: false
      });
    }
    
    console.log(`✅ ${htmlFiles.length} screenshots gerados com sucesso!`);
    console.log(`📂 Salvos em: ${imagesDir}`);
    
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
  gerarScreenshots();
}

module.exports = gerarScreenshots;
