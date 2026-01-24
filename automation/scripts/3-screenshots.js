#!/usr/bin/env node
/**
 * PRISMATIC LABS - INSTAGRAM AUTOMATION
 * Script 3: Geração de Screenshots
 * 
 * O QUE FAZ:
 * - Abre cada HTML em navegador headless (Puppeteer)
 * - Aguarda fonts carregarem
 * - Captura screenshot 1080x1080 alta qualidade
 * - Salva PNG otimizado
 * 
 * INPUT: /generated/posts/*.html
 * OUTPUT: /generated/images/post-[1-28].png
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Configurações screenshot
const VIEWPORT = {
  width: 1080,
  height: 1080,
  deviceScaleFactor: 2 // Retina quality
};

// Função principal
async function generateScreenshots(month) {
  console.log(chalk.blue.bold('\n📸 ETAPA 3: GERAÇÃO DE SCREENSHOTS\n'));
  
  let browser;
  
  try {
    // Iniciar navegador
    console.log(chalk.gray('Iniciando navegador headless...\n'));
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Criar pasta imagens
    const imagesDir = path.join(__dirname, '../generated/images');
    await fs.mkdir(imagesDir, { recursive: true });

    // Listar HTMLs
    const postsDir = path.join(__dirname, '../generated/posts');
    const files = await fs.readdir(postsDir);
    const htmlFiles = files.filter(f => f.endsWith('.html')).sort();

    console.log(chalk.gray(`Encontrados: ${htmlFiles.length} HTMLs\n`));

    // Processar cada HTML
    for (const [index, filename] of htmlFiles.entries()) {
      const htmlPath = path.join(postsDir, filename);
      const imageName = filename.replace('.html', '.png');
      const imagePath = path.join(imagesDir, imageName);

      // Criar nova página
      const page = await browser.newPage();
      await page.setViewport(VIEWPORT);

      // Carregar HTML
      const fileUrl = `file://${htmlPath}`;
      await page.goto(fileUrl, { waitUntil: 'networkidle0' });

      // Aguardar fontes (importante!)
      await page.evaluateHandle('document.fonts.ready');
      await page.waitForTimeout(500); // Segurança extra

      // Screenshot
      await page.screenshot({
        path: imagePath,
        type: 'png',
        fullPage: false
      });

      await page.close();

      console.log(chalk.green(`✓ ${imageName} gerado (${index + 1}/${htmlFiles.length})`));
    }

    await browser.close();

    console.log(chalk.green.bold(`\n✓ ${htmlFiles.length} screenshots gerados com sucesso!\n`));
    console.log(chalk.gray(`Pasta: ${imagesDir}\n`));
    console.log(chalk.blue.bold('ETAPA 3 CONCLUÍDA ✅\n'));

    return imagesDir;

  } catch (error) {
    if (browser) await browser.close();
    
    console.error(chalk.red.bold('\n✗ ERRO na geração de screenshots:\n'));
    console.error(chalk.red(error.message));
    
    if (error.message.includes('Could not find')) {
      console.log(chalk.yellow('\n🔧 Instale Chromium: npx puppeteer browsers install chrome\n'));
    }
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const month = process.argv[2] || 'Fevereiro';
  generateScreenshots(month);
}

module.exports = generateScreenshots;
