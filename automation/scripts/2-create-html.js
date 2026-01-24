#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const TEMPLATE_POST = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 1080px;
      height: 1080px;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
      overflow: hidden;
      position: relative;
    }
    
    /* Glows de fundo */
    .glow-purple {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
      top: -200px;
      right: -200px;
      filter: blur(80px);
    }
    
    .glow-teal {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(6, 217, 215, 0.12) 0%, transparent 70%);
      bottom: -150px;
      left: -150px;
      filter: blur(70px);
    }
    
    /* Container principal */
    .container {
      position: relative;
      z-index: 1;
      width: 900px;
      padding: 80px;
      text-align: center;
    }
    
    /* Badge superior */
    .badge {
      display: inline-block;
      padding: 12px 28px;
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 50px;
      color: #A855F7;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 40px;
      backdrop-filter: blur(10px);
    }
    
    /* Título principal */
    h1 {
      font-size: 72px;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 32px;
      background: linear-gradient(135deg, #FFFFFF 0%, #A855F7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -2px;
    }
    
    /* Subtítulo */
    .subtitle {
      font-size: 28px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.4;
      margin-bottom: 60px;
      font-weight: 400;
    }
    
    /* CTA */
    .cta {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 20px 40px;
      background: linear-gradient(135deg, #A855F7 0%, #06D9D7 100%);
      border-radius: 12px;
      color: #0a0a0a;
      font-size: 18px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 20px 60px rgba(168, 85, 247, 0.4);
      transition: transform 0.3s;
    }
    
    .cta:hover {
      transform: translateY(-2px);
    }
    
    /* Logo rodapé */
    .footer {
      position: absolute;
      bottom: 60px;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 16px;
      font-weight: 600;
    }
    
    .logo-text {
      font-size: 24px;
      font-weight: 900;
      background: linear-gradient(135deg, #A855F7 0%, #06D9D7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  </style>
</head>
<body>
  <div class="glow-purple"></div>
  <div class="glow-teal"></div>
  
  <div class="container">
    <div class="badge">{{BADGE}}</div>
    <h1>{{TITLE}}</h1>
    <div class="subtitle">{{SUBTITLE}}</div>
    <div class="cta">{{CTA}} →</div>
  </div>
  
  <div class="footer">
    <span class="logo-text">PRISMATIC</span>
    <span>LABS</span>
  </div>
</body>
</html>`;

const TEMPLATE_STORY = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 1080px;
      height: 1920px;
      background: linear-gradient(180deg, #0a0a0a 0%, #1a0a1a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
      overflow: hidden;
      position: relative;
    }
    
    .glow {
      position: absolute;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      filter: blur(100px);
    }
    
    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      padding: 120px 80px;
      text-align: center;
    }
    
    h1 {
      font-size: 96px;
      font-weight: 900;
      line-height: 1;
      margin-bottom: 48px;
      background: linear-gradient(135deg, #FFFFFF 0%, #A855F7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -3px;
    }
    
    .subtitle {
      font-size: 36px;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.3;
      margin-bottom: 80px;
    }
    
    .cta {
      font-size: 28px;
      color: #06D9D7;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .footer {
      position: absolute;
      bottom: 100px;
      left: 0;
      right: 0;
      text-align: center;
    }
    
    .logo-text {
      font-size: 32px;
      font-weight: 900;
      background: linear-gradient(135deg, #A855F7 0%, #06D9D7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  
  <div class="container">
    <h1>{{TITLE}}</h1>
    <div class="subtitle">{{SUBTITLE}}</div>
    <div class="cta">{{CTA}}</div>
  </div>
  
  <div class="footer">
    <div class="logo-text">PRISMATIC LABS</div>
  </div>
</body>
</html>`;

function generateBadge(tipo) {
  const badges = {
    'educacional': 'APRENDA',
    'social-proof': 'RESULTADOS REAIS',
    'vendas': 'OPORTUNIDADE',
    'engajamento': 'VOCÊ SABIA?'
  };
  return badges[tipo] || 'PRISMATIC LABS';
}

function generateCTA(tipo) {
  const ctas = {
    'educacional': 'Saiba mais',
    'social-proof': 'Ver cases completos',
    'vendas': 'Quero meu site',
    'engajamento': 'Comente aqui'
  };
  return ctas[tipo] || 'Link na bio';
}

async function createHTML() {
  console.log('🎨 Criando arquivos HTML...');
  
  try {
    // Encontra arquivo de tópicos mais recente
    const generatedDir = path.join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    const topicFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    
    if (!topicFile) {
      throw new Error('Arquivo de tópicos não encontrado. Execute 1-generate-topics.js primeiro.');
    }
    
    const topicsPath = path.join(generatedDir, topicFile);
    const topics = JSON.parse(await fs.readFile(topicsPath, 'utf-8'));
    
    // Cria pasta HTML
    const htmlDir = path.join(generatedDir, 'html');
    await fs.mkdir(htmlDir, { recursive: true });
    
    let created = 0;
    
    for (const topic of topics) {
      const template = topic.formato === 'story' ? TEMPLATE_STORY : TEMPLATE_POST;
      
      // Gera título e subtítulo a partir do tema
      const [title, ...subtitleParts] = topic.tema.split(' - ');
      const subtitle = subtitleParts.join(' ') || 'Resultados que seus concorrentes não querem que você veja';
      
      const html = template
        .replace(/{{BADGE}}/g, generateBadge(topic.tipo))
        .replace(/{{TITLE}}/g, title)
        .replace(/{{SUBTITLE}}/g, subtitle)
        .replace(/{{CTA}}/g, generateCTA(topic.tipo));
      
      const filename = `post-${String(topic.dia).padStart(2, '0')}.html`;
      const filepath = path.join(htmlDir, filename);
      
      await fs.writeFile(filepath, html);
      created++;
    }
    
    console.log(`✅ ${created} arquivos HTML criados em: ${htmlDir}`);
    return created;
    
  } catch (error) {
    console.error('❌ Erro ao criar HTML:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  createHTML();
}

module.exports = { createHTML };