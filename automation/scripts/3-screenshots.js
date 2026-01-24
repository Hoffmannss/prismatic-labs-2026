/**
 * SCRIPT 3: SCREENSHOTS AUTOMATIZADOS
 * Usa Puppeteer para gerar imagens PNG 1080x1080 de cada HTML
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function generateScreenshots() {
  console.log('\n📸 ETAPA 3: Gerando screenshots...');
  
  let browser;
  
  try {
    // Encontra pasta com HTMLs
    const generatedDir = path.join(__dirname, '../generated');
    const htmlDir = path.join(generatedDir, 'html-posts');
    
    // Verifica se pasta existe
    try {
      await fs.access(htmlDir);
    } catch {
      throw new Error('Pasta html-posts não encontrada. Execute script 2 primeiro.');
    }
    
    // Lista arquivos HTML
    const files = await fs.readdir(htmlDir);
    const htmlFiles = files.filter(f => f.endsWith('.html')).sort();
    
    if (htmlFiles.length === 0) {
      throw new Error('Nenhum arquivo HTML encontrado.');
    }
    
    console.log(`📂 Encontrados: ${htmlFiles.length} HTMLs`);
    
    // Cria pasta para imagens
    const imagesDir = path.join(generatedDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Inicia Puppeteer
    console.log('🚀 Iniciando Puppeteer...');
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
    
    // Configura viewport exato
    await page.setViewport({
      width: 1080,
      height: 1080,
      deviceScaleFactor: 2 // Retina quality
    });
    
    // Processa cada HTML
    let processed = 0;
    const startTime = Date.now();
    
    for (const htmlFile of htmlFiles) {
      const htmlPath = path.join(htmlDir, htmlFile);
      const imageName = htmlFile.replace('.html', '.png');
      const imagePath = path.join(imagesDir, imageName);
      
      // Carrega HTML
      await page.goto(`file://${htmlPath}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Aguarda fonts carregarem
      await page.evaluateHandle('document.fonts.ready');
      await page.waitForTimeout(500); // Extra safety
      
      // Screenshot
      await page.screenshot({
        path: imagePath,
        type: 'png',
        fullPage: false
      });
      
      processed++;
      
      // Progress
      if (processed % 7 === 0 || processed === htmlFiles.length) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const perImage = (elapsed / processed).toFixed(1);
        console.log(`  ✅ ${processed}/${htmlFiles.length} (${perImage}s/img)`);
      }
    }
    
    await browser.close();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 ${processed} imagens geradas em ${totalTime}s!`);
    console.log(`📁 Pasta: ${imagesDir}`);
    
    // Verifica tamanhos
    const sampleImage = path.join(imagesDir, htmlFiles[0].replace('.html', '.png'));
    const stats = await fs.stat(sampleImage);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 Tamanho médio: ${sizeMB}MB por imagem`);
    
    return imagesDir;
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Erro ao gerar screenshots:', error.message);
    throw error;
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  generateScreenshots()
    .then(() => {
      console.log('\n✅ ETAPA 3 CONCLUÍDA');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ FALHA:', error);
      process.exit(1);
    });
}

module.exports = { generateScreenshots };
