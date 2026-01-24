#!/usr/bin/env node
/**
 * 📸 SCRIPT 3: SCREENSHOTS AUTOMATIZADOS
 * 
 * O QUE FAZ:
 * 1. Lê: HTMLs gerados pelo script 2
 * 2. Abre cada HTML em navegador headless (Puppeteer)
 * 3. Aguarda fonts carregarem
 * 4. Tira screenshot 1080x1080 alta qualidade
 * 5. Salva: PNGs prontos para Instagram
 * 
 * QUALIDADE:
 * - Resolução: 1080x1080 (feed Instagram)
 * - Formato: PNG (sem compressão)
 * - DPI: 72 (web)
 * - Fontes: Carregadas do Google Fonts
 */

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

// Função principal
async function takeScreenshots() {
  let browser;
  
  try {
    console.log('\n📸 GERANDO SCREENSHOTS...\n');

    // 1. Verificar HTMLs
    const generatedDir = path.join(__dirname, '..', 'generated');
    const htmlDir = path.join(generatedDir, 'html');
    
    try {
      await fs.access(htmlDir);
    } catch {
      throw new Error('Pasta html/ não encontrada. Execute: npm run create-html');
    }

    const files = await fs.readdir(htmlDir);
    const htmlFiles = files.filter(f => f.startsWith('post-') && f.endsWith('.html'));

    if (htmlFiles.length === 0) {
      throw new Error('Nenhum HTML encontrado. Execute: npm run create-html');
    }

    htmlFiles.sort();
    console.log(`📂 Encontrados: ${htmlFiles.length} HTMLs\n`);

    // 2. Criar pasta images
    const imagesDir = path.join(generatedDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    // 3. Iniciar Puppeteer
    console.log('🌐 Iniciando navegador headless...\n');
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

    // Configurar viewport exato Instagram
    await page.setViewport({
      width: 1080,
      height: 1080,
      deviceScaleFactor: 2 // Retina quality
    });

    // 4. Processar cada HTML
    const results = [];
    for (let i = 0; i < htmlFiles.length; i++) {
      const htmlFile = htmlFiles[i];
      const postNumber = String(i + 1).padStart(2, '0');
      
      console.log(`  [📸 ${postNumber}/${htmlFiles.length}] ${htmlFile}`);

      // Carregar HTML
      const htmlPath = path.join(htmlDir, htmlFile);
      const fileUrl = `file://${htmlPath}`;
      
      await page.goto(fileUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Aguardar fonts Google carregarem
      await page.waitForTimeout(2000);

      // Verificar se renderizou
      const hasContent = await page.evaluate(() => {
        return document.body.offsetHeight > 0;
      });

      if (!hasContent) {
        throw new Error(`HTML ${htmlFile} não renderizou corretamente`);
      }

      // Screenshot
      const imageName = htmlFile.replace('.html', '.png');
      const imagePath = path.join(imagesDir, imageName);
      
      await page.screenshot({
        path: imagePath,
        type: 'png',
        omitBackground: false,
        clip: {
          x: 0,
          y: 0,
          width: 1080,
          height: 1080
        }
      });

      // Verificar tamanho arquivo
      const stats = await fs.stat(imagePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

      results.push({
        id: i + 1,
        html: htmlFile,
        image: imageName,
        size: `${sizeMB}MB`,
        timestamp: new Date().toISOString()
      });

      console.log(`     ✅ ${imageName} (${sizeMB}MB)\n`);
    }

    // 5. Salvar manifesto
    const manifestPath = path.join(imagesDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify({
      gerado_em: new Date().toISOString(),
      total: results.length,
      resolucao: '1080x1080',
      formato: 'PNG',
      images: results
    }, null, 2));

    // 6. Resumo
    console.log('\n✅ SCREENSHOTS GERADOS COM SUCESSO!\n');
    console.log(`📁 Pasta: ${imagesDir}`);
    console.log(`📊 Total: ${results.length} imagens`);
    
    const totalSize = results.reduce((sum, r) => {
      return sum + parseFloat(r.size);
    }, 0);
    console.log(`💾 Tamanho total: ${totalSize.toFixed(2)}MB`);
    
    console.log('\n🚀 Próximo passo: npm run generate-captions\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n🔧 Soluções:');
    console.error('1. Verificar HTMLs existem');
    console.error('2. Instalar Puppeteer: npm install');
    console.error('3. Linux: sudo apt-get install chromium-browser');
    console.error('4. Mac: Chromium instala automaticamente\n');
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Executar
if (require.main === module) {
  takeScreenshots();
}

module.exports = { takeScreenshots };
