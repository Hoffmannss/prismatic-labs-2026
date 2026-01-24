const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function generateScreenshots() {
  console.log('📸 Gerando screenshots...');

  const postsDir = path.join(__dirname, '../generated/posts-html');
  const imagesDir = path.join(__dirname, '../generated/images');
  await fs.mkdir(imagesDir, { recursive: true });

  const htmlFiles = (await fs.readdir(postsDir))
    .filter(f => f.endsWith('.html'))
    .sort();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(postsDir, htmlFile);
    const imageName = htmlFile.replace('.html', '.png');
    const imagePath = path.join(imagesDir, imageName);

    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000); // Aguarda fonts carregarem
    await page.screenshot({ path: imagePath, type: 'png' });

    console.log(`  ✓ ${imageName}`);
  }

  await browser.close();
  console.log(`✅ ${htmlFiles.length} screenshots gerados!`);
}

generateScreenshots().catch(console.error);