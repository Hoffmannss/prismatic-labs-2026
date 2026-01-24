/**
 * 🖼️ SCRIPT 2: CRIA HTMLs DOS POSTS
 * 
 * O QUE FAZ:
 * - Lê tópicos gerados pela IA
 * - Cria um HTML para cada post usando template Prismatic
 * - Aplica cores, fontes e estilo da marca
 * 
 * COMO FUNCIONA:
 * 1. Lê topics-{mes}.json
 * 2. Para cada tópico, injeta no template HTML
 * 3. Salva post-{numero}.html em /generated/html/
 */

const fs = require('fs').promises;
const path = require('path');

// Cores oficiais Prismatic Labs
const COLORS = {
  purple: '#A855F7',
  teal: '#06D9D7',
  pink: '#FF006E',
  black: '#0a0a0a',
  grayDark: '#1a1a1a',
  grayLight: '#2a2a2a'
};

// Template base HTML
function criarTemplateHTML(post) {
  const tipoEmoji = {
    'educacional': '🎯',
    'social-proof': '⭐',
    'vendas': '🚀',
    'autoridade': '👑'
  };
  
  const tipoCor = {
    'educacional': COLORS.purple,
    'social-proof': COLORS.teal,
    'vendas': COLORS.pink,
    'autoridade': COLORS.purple
  };
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1080">
    <title>Post ${post.numero} - Prismatic Labs</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            width: 1080px;
            height: 1080px;
            background: linear-gradient(135deg, ${COLORS.black} 0%, ${COLORS.grayDark} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            position: relative;
            overflow: hidden;
        }
        
        /* Glows de fundo */
        .glow-purple {
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, ${COLORS.purple}40 0%, transparent 70%);
            top: -200px;
            right: -200px;
            filter: blur(80px);
        }
        
        .glow-teal {
            position: absolute;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, ${COLORS.teal}30 0%, transparent 70%);
            bottom: -150px;
            left: -150px;
            filter: blur(80px);
        }
        
        /* Container principal */
        .container {
            width: 920px;
            height: 920px;
            background: ${COLORS.grayDark};
            border: 2px solid ${COLORS.grayLight};
            border-radius: 32px;
            padding: 60px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            z-index: 1;
        }
        
        /* Badge tipo */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: ${tipoCor[post.tipo]}20;
            border: 1px solid ${tipoCor[post.tipo]};
            border-radius: 100px;
            color: ${tipoCor[post.tipo]};
            font-size: 18px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            width: fit-content;
        }
        
        /* Conteúdo */
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 32px;
        }
        
        h1 {
            font-family: 'Poppins', sans-serif;
            font-size: 68px;
            font-weight: 900;
            line-height: 1.1;
            color: white;
            text-shadow: 0 0 40px ${tipoCor[post.tipo]}40;
        }
        
        .hook {
            font-size: 28px;
            line-height: 1.5;
            color: #ffffff90;
            font-weight: 500;
        }
        
        .highlight {
            color: ${tipoCor[post.tipo]};
            font-weight: 700;
        }
        
        /* Footer */
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 40px;
            border-top: 1px solid ${COLORS.grayLight};
        }
        
        .logo {
            font-family: 'Poppins', sans-serif;
            font-size: 32px;
            font-weight: 900;
            color: white;
            letter-spacing: -1px;
        }
        
        .logo-gradient {
            background: linear-gradient(135deg, ${COLORS.purple} 0%, ${COLORS.teal} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .cta {
            font-size: 20px;
            color: #ffffff70;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="glow-purple"></div>
    <div class="glow-teal"></div>
    
    <div class="container">
        <div class="badge">
            <span>${tipoEmoji[post.tipo]}</span>
            <span>${post.tipo.toUpperCase()}</span>
        </div>
        
        <div class="content">
            <h1>${post.tema}</h1>
            <p class="hook">${post.hook}</p>
        </div>
        
        <div class="footer">
            <div class="logo">
                <span class="logo-gradient">PRISMATIC</span> LABS
            </div>
            <div class="cta">→ Link na bio</div>
        </div>
    </div>
</body>
</html>`;
}

async function criarHTMLs() {
  console.log('🖼️ Criando HTMLs dos posts...');
  
  try {
    // Encontra arquivo de tópicos mais recente
    const generatedDir = path.join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    const topicsFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    
    if (!topicsFile) {
      throw new Error('Arquivo de tópicos não encontrado. Execute script 1 primeiro.');
    }
    
    // Lê tópicos
    const topicsPath = path.join(generatedDir, topicsFile);
    const topicsData = await fs.readFile(topicsPath, 'utf8');
    const topics = JSON.parse(topicsData);
    
    // Cria pasta para HTMLs
    const htmlDir = path.join(generatedDir, 'html');
    await fs.mkdir(htmlDir, { recursive: true });
    
    // Gera HTML para cada post
    for (const post of topics.posts) {
      const html = criarTemplateHTML(post);
      const filename = `post-${String(post.numero).padStart(2, '0')}.html`;
      const filepath = path.join(htmlDir, filename);
      await fs.writeFile(filepath, html);
    }
    
    console.log(`✅ ${topics.posts.length} HTMLs criados com sucesso!`);
    console.log(`📂 Salvos em: ${htmlDir}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar HTMLs:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  criarHTMLs();
}

module.exports = criarHTMLs;
