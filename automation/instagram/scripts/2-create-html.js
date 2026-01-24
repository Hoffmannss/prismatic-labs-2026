#!/usr/bin/env node

/**
 * 🎨 SCRIPT 2: CRIAÇÃO AUTOMÁTICA DE HTMLs
 * 
 * O QUE FAZ:
 * - Lê tópicos gerados pelo Script 1
 * - Cria HTML para cada post com design Prismatic Labs
 * - Aplica cores, fontes, glows, animações
 * - Salva 1 HTML por post
 * 
 * ENTRADA: generated/topics-{mes}.json
 * SAÍDA: generated/html/post-{N}.html
 * 
 * USO:
 * node 2-create-html.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURAÇÕES
// ========================================

const CONFIG = {
  generatedDir: path.join(__dirname, '../generated'),
  outputDir: path.join(__dirname, '../generated/html'),
  
  // Cores Prismatic Labs
  colors: {
    purple: '#A855F7',
    teal: '#06D9D7',
    pink: '#FF006E',
    black: '#0a0a0a',
    darkGray: '#1a1a1a',
    lightGray: '#e0e0e0'
  },
  
  // Fontes
  fonts: {
    heading: 'Poppins',
    body: 'Inter'
  }
};

// ========================================
// TEMPLATE HTML BASE
// ========================================

function createHTMLTemplate(post, index) {
  // Escolher cor primária baseada no tipo
  let primaryColor, secondaryColor, badge;
  
  switch(post.type) {
    case 'educational':
      primaryColor = CONFIG.colors.purple;
      secondaryColor = CONFIG.colors.teal;
      badge = '🎯 APRENDA';
      break;
    case 'sales':
      primaryColor = CONFIG.colors.pink;
      secondaryColor = CONFIG.colors.purple;
      badge = '🚀 OFERTA';
      break;
    case 'socialProof':
      primaryColor = CONFIG.colors.teal;
      secondaryColor = CONFIG.colors.pink;
      badge = '✅ RESULTADO';
      break;
    default:
      primaryColor = CONFIG.colors.purple;
      secondaryColor = CONFIG.colors.teal;
      badge = '💡 DICA';
  }
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post ${index + 1} - ${post.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 1080px;
      height: 1080px;
      background: linear-gradient(135deg, ${CONFIG.colors.black} 0%, ${CONFIG.colors.darkGray} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: '${CONFIG.fonts.body}', system-ui, sans-serif;
      overflow: hidden;
      position: relative;
    }
    
    /* Glows de fundo */
    .glow-1 {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, ${primaryColor}40 0%, transparent 70%);
      top: -200px;
      right: -200px;
      border-radius: 50%;
      filter: blur(80px);
      animation: pulse 4s ease-in-out infinite;
    }
    
    .glow-2 {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, ${secondaryColor}30 0%, transparent 70%);
      bottom: -150px;
      left: -150px;
      border-radius: 50%;
      filter: blur(60px);
      animation: pulse 5s ease-in-out infinite reverse;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.8; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    
    /* Container principal */
    .container {
      width: 900px;
      height: 900px;
      background: rgba(26, 26, 26, 0.7);
      backdrop-filter: blur(20px);
      border-radius: 40px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 10;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    /* Badge */
    .badge {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: white;
      padding: 12px 30px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 40px;
      box-shadow: 0 4px 20px ${primaryColor}60;
    }
    
    /* Emoji */
    .emoji {
      font-size: 100px;
      margin-bottom: 30px;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
    }
    
    /* Título */
    h1 {
      font-family: '${CONFIG.fonts.heading}', sans-serif;
      font-size: 64px;
      font-weight: 900;
      line-height: 1.1;
      color: white;
      margin-bottom: 30px;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 30px ${primaryColor}40;
    }
    
    /* Subtítulo */
    .subtitle {
      font-size: 28px;
      font-weight: 600;
      color: ${CONFIG.colors.lightGray};
      line-height: 1.4;
      margin-bottom: 40px;
      max-width: 700px;
    }
    
    /* Logo/CTA */
    .cta {
      margin-top: 50px;
      padding: 20px 40px;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid ${primaryColor};
      border-radius: 20px;
      color: white;
      font-size: 20px;
      font-weight: 700;
      box-shadow: 0 0 30px ${primaryColor}40;
    }
    
    /* Logo Prismatic Labs */
    .logo {
      position: absolute;
      bottom: 40px;
      right: 60px;
      font-family: '${CONFIG.fonts.heading}', sans-serif;
      font-size: 24px;
      font-weight: 900;
      color: white;
      opacity: 0.6;
    }
    
    .logo span {
      background: linear-gradient(135deg, ${CONFIG.colors.purple}, ${CONFIG.colors.teal});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  
  <div class="container">
    <div class="badge">${badge}</div>
    <div class="emoji">${post.emoji}</div>
    <h1>${post.title}</h1>
    <div class="subtitle">${post.subtitle}</div>
    <div class="cta">${post.cta}</div>
  </div>
  
  <div class="logo">
    <span>PRISMATIC</span> LABS
  </div>
</body>
</html>`;
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function createHTMLs() {
  console.log('🎨 Criando HTMLs dos posts...\n');
  
  try {
    // Encontrar arquivo de tópicos mais recente
    const files = fs.readdirSync(CONFIG.generatedDir)
      .filter(f => f.startsWith('topics-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(CONFIG.generatedDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.error('❌ ERRO: Nenhum arquivo de tópicos encontrado!');
      console.error('🔧 Execute primeiro: node 1-generate-topics.js\n');
      process.exit(1);
    }
    
    const topicsFile = path.join(CONFIG.generatedDir, files[0].name);
    console.log(`📂 Lendo: ${files[0].name}\n`);
    
    const data = JSON.parse(fs.readFileSync(topicsFile, 'utf8'));
    const posts = data.posts;
    
    // Criar diretório de saída
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Criar HTML para cada post
    posts.forEach((post, index) => {
      const html = createHTMLTemplate(post, index);
      const filename = `post-${String(index + 1).padStart(2, '0')}.html`;
      const filepath = path.join(CONFIG.outputDir, filename);
      
      fs.writeFileSync(filepath, html, 'utf8');
      console.log(`✅ ${filename} - ${post.type} - ${post.title.substring(0, 30)}...`);
    });
    
    console.log(`\n🎉 ${posts.length} HTMLs criados com sucesso!`);
    console.log(`📁 Local: ${CONFIG.outputDir}`);
    console.log(`\n🎯 Próxima etapa: Script 3 (gerar screenshots)\n`);
    
  } catch (error) {
    console.error('❌ ERRO ao criar HTMLs:', error.message);
    process.exit(1);
  }
}

// ========================================
// EXECUÇÃO
// ========================================

if (require.main === module) {
  createHTMLs();
}

module.exports = { createHTMLs };
