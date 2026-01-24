#!/usr/bin/env node

/**
 * 📸 SCRIPT 3: GERAÇÃO DE SCREENSHOTS
 * 
 * O QUE FAZ:
 * - Abre cada HTML em navegador headless (Puppeteer)
 * - Configura viewport 1080x1080 (Instagram feed)
 * - Aguarda fonts/animações carregarem
 * - Captura screenshot PNG alta qualidade
 * - Salva imagens otimizadas
 * 
 * ENTRADA: generated/html/post-*.html
 * SAÍDA: generated/images/post-*.png
 * 
 * USO:
 * node 3-screenshots.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURAÇÕES
// ========================================

const CONFIG = {
  htmlDir: path.join(__dirname, '../generated/html'),
  outputDir: path.join(__dirname, '../generated/images'),
  
  // Dimensões Instagram
  viewport: {
    width: 1080,
    height: 1080,
    deviceScaleFactor: 2 // Retina/alta qualidade
  },
  
  // Qualidade screenshot
  screenshot: {
    type: 'png',
    quality: 100, // Máxima qualidade
    omitBackground: false
  },
  
  // Tempo aguardar antes screenshot (fonts, animações)
  waitTime: 2000 // 2 segundos
};

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function generateScreenshots() {
  console.log('📸 Gerando screenshots com Puppeteer...\n');
  
  try {
    // Verificar se existem HTMLs
    if (!fs.existsSync(CONFIG.htmlDir)) {
      console.error('❌ ERRO: Pasta de HTMLs não encontrada!');
      console.error('🔧 Execute primeiro: node 2-create-html.js\n');
      process.exit(1);
    }
    
    const htmlFiles = fs.readdirSync(CONFIG.htmlDir)
      .filter(f => f.endsWith('.html'))
      .sort();
    
    if (htmlFiles.length === 0) {
      console.error('❌ ERRO: Nenhum arquivo HTML encontrado!');
      console.error('🔧 Execute primeiro: node 2-create-html.js\n');
      process.exit(1);
    }
    
    console.log(`📂 Encontrados ${htmlFiles.length} arquivos HTML\n`);
    
    // Criar diretório de saída
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Iniciar Puppeteer
    console.log('🌐 Iniciando navegador headless...\n');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport(CONFIG.viewport);
    
    // Processar cada HTML
    for (let i = 0; i < htmlFiles.length; i++) {
      const htmlFile = htmlFiles[i];
      const htmlPath = path.join(CONFIG.htmlDir, htmlFile);
      const imageName = htmlFile.replace('.html', '.png');
      const imagePath = path.join(CONFIG.outputDir, imageName);
      
      console.log(`📸 [${i + 1}/${htmlFiles.length}] ${htmlFile}...`);
      
      try {
        // Abrir HTML
        await page.goto(`file://${htmlPath}`, {
          waitUntil: 'networkidle0'
        });
        
        // Aguardar fonts e animações
        await page.waitForTimeout(CONFIG.waitTime);
        
        // Capturar screenshot
        await page.screenshot({
          path: imagePath,
          type: CONFIG.screenshot.type,
          omitBackground: CONFIG.screenshot.omitBackground
        });
        
        // Verificar tamanho arquivo
        const stats = fs.statSync(imagePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`   ✅ Salvo: ${imageName} (${sizeMB} MB)`);
        
      } catch (error) {
        console.error(`   ❌ Erro em ${htmlFile}:`, error.message);
      }
    }
    
    await browser.close();
    
    console.log(`\n🎉 ${htmlFiles.length} screenshots gerados com sucesso!`);
    console.log(`📁 Local: ${CONFIG.outputDir}`);
    console.log(`\n🎯 Próxima etapa: Script 4 (gerar legendas)\n`);
    
  } catch (error) {
    console.error('❌ ERRO ao gerar screenshots:', error.message);
    console.error('\n🔧 Dica: Certifique-se que Puppeteer foi instalado corretamente:');
    console.error('   npm install puppeteer\n');
    process.exit(1);
  }
}

// ========================================
// EXECUÇÃO
// ========================================

if (require.main === module) {
  generateScreenshots();
}

module.exports = { generateScreenshots };
