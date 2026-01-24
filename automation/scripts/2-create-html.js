#!/usr/bin/env node
/**
 * SCRIPT 2: CRIAÇÃO DE HTMLs DOS POSTS
 * 
 * Função: Transforma tópicos JSON em páginas HTML prontas para screenshot
 * Input: topics-[mes].json
 * Output: 28 arquivos HTML estilizados
 * 
 * Como funciona:
 * 1. Lê tópicos gerados no Script 1
 * 2. Para cada tópico, cria HTML com:
 *    - Cores/fontes Prismatic Labs
 *    - Gradientes animados
 *    - Badges de categoria
 *    - Responsive 1080x1080
 * 3. Salva na pasta generated/html/
 */

const fs = require('fs').promises;
const path = require('path');

const COLORS = {
  purple: '#A855F7',
  teal: '#06D9D7',
  pink: '#FF006E',
  black: '#0a0a0a',
  white: '#ffffff'
};

const VISUAL_STYLES = {
  'dark-gradient': {
    background: `linear-gradient(135deg, ${COLORS.black} 0%, #1a0a2e 100%)`,
    accent: COLORS.purple
  },
  'neon-cards': {
    background: COLORS.black,
    accent: COLORS.teal
  },
  'minimal-stats': {
    background: `linear-gradient(135deg, #0f0f0f 0%, ${COLORS.black} 100%)`,
    accent: COLORS.pink
  },
  'testimonial': {
    background: `radial-gradient(circle at 50% 50%, #1a0a2e 0%, ${COLORS.black} 100%)`,
    accent: COLORS.purple
  }
};

function generateHTML(topic, index) {
  const style = VISUAL_STYLES[topic.visual_style] || VISUAL_STYLES['dark-gradient'];
  const badgeColors = {
    'educacional': COLORS.teal,
    'social-proof': COLORS.purple,
    'vendas': COLORS.pink,
    'bastidores': '#FFD700'
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1080">
  <title>Post ${index + 1} - ${topic.theme}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
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
      background: ${style.background};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px;
      font-family: 'Inter', sans-serif;
      color: ${COLORS.white};
      position: relative;
      overflow: hidden;
    }
    /* Glow effect */
    body::before {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, ${style.accent}40 0%, transparent 70%);
      top: -200px;
      right: -200px;
      border-radius: 50%;
      animation: pulse 4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    .badge {
      background: ${badgeColors[topic.type] || COLORS.purple};
      color: ${COLORS.black};
      padding: 12px 28px;
      border-radius: 50px;
      font-size: 18px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 40px;
      box-shadow: 0 8px 32px ${badgeColors[topic.type] || COLORS.purple}60;
    }
    h1 {
      font-family: 'Poppins', sans-serif;
      font-size: 64px;
      font-weight: 900;
      line-height: 1.2;
      text-align: center;
      margin-bottom: 30px;
      background: linear-gradient(135deg, ${COLORS.white} 0%, ${style.accent} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 20px ${style.accent}40;
    }
    .hook {
      font-size: 28px;
      text-align: center;
      line-height: 1.6;
      color: #cccccc;
      margin-bottom: 50px;
      max-width: 800px;
    }
    .cta {
      background: ${style.accent};
      color: ${COLORS.white};
      padding: 20px 50px;
      border-radius: 12px;
      font-size: 24px;
      font-weight: 700;
      text-transform: uppercase;
      box-shadow: 0 12px 40px ${style.accent}60;
      letter-spacing: 1px;
    }
    .logo {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Poppins', sans-serif;
      font-size: 28px;
      font-weight: 900;
      color: ${COLORS.white};
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="badge">${topic.type.replace('-', ' ')}</div>
  <h1>${topic.theme}</h1>
  <p class="hook">${topic.hook}</p>
  <div class="cta">${topic.cta}</div>
  <div class="logo">PRISMATIC LABS</div>
</body>
</html>`;
}

async function createHTML() {
  try {
    console.log('🏗️ Criando HTMLs dos posts...');

    // 1. Lê tópicos
    const generatedDir = path.join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    const topicsFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    
    if (!topicsFile) {
      throw new Error('Arquivo topics-*.json não encontrado. Execute script 1 primeiro.');
    }

    const topicsPath = path.join(generatedDir, topicsFile);
    const topicsData = JSON.parse(await fs.readFile(topicsPath, 'utf-8'));

    // 2. Cria pasta HTML
    const htmlDir = path.join(generatedDir, 'html');
    await fs.mkdir(htmlDir, { recursive: true });

    // 3. Gera HTML para cada tópico
    for (let i = 0; i < topicsData.topics.length; i++) {
      const topic = topicsData.topics[i];
      const html = generateHTML(topic, i);
      const filename = `post-${String(i + 1).padStart(2, '0')}.html`;
      const filepath = path.join(htmlDir, filename);
      await fs.writeFile(filepath, html);
    }

    console.log(`✅ ${topicsData.topics.length} HTMLs criados com sucesso!`);
    console.log(`📁 Pasta: ${htmlDir}`);

  } catch (error) {
    console.error('❌ Erro ao criar HTMLs:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  createHTML();
}

module.exports = { createHTML };
