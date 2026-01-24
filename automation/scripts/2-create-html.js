/**
 * SCRIPT 2: CRIAÇÃO DE HTMLS
 * Gera arquivos HTML para cada tópico usando template base
 */

const fs = require('fs').promises;
const path = require('path');

// Template HTML base (cores Prismatic)
function createHTMLTemplate(topic) {
  const { tema, subtitulo, badge, cta, cores } = topic;
  
  // Define cores baseado no esquema
  const colorSchemes = {
    'purple-teal': { glow1: '#A855F7', glow2: '#06D9D7', gradient: 'linear-gradient(135deg, #A855F7, #06D9D7)' },
    'pink-purple': { glow1: '#FF006E', glow2: '#A855F7', gradient: 'linear-gradient(135deg, #FF006E, #A855F7)' },
    'teal-pink': { glow1: '#06D9D7', glow2: '#FF006E', gradient: 'linear-gradient(135deg, #06D9D7, #FF006E)' }
  };
  
  const scheme = colorSchemes[cores] || colorSchemes['purple-teal'];
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1080">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: 1080px;
      height: 1080px;
      background: radial-gradient(circle at 30% 20%, #1a0033 0%, #000000 50%, #0a0014 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
      position: relative;
    }
    
    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(140px);
      opacity: 0.4;
    }
    
    .glow-1 {
      width: 600px;
      height: 600px;
      background: ${scheme.glow1};
      top: -200px;
      right: -200px;
    }
    
    .glow-2 {
      width: 500px;
      height: 500px;
      background: ${scheme.glow2};
      bottom: -150px;
      left: -150px;
    }
    
    .container {
      position: relative;
      z-index: 1;
      width: 880px;
      text-align: center;
      padding: 60px;
    }
    
    .logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 4px;
      margin-bottom: 120px;
      background: ${scheme.gradient};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-transform: uppercase;
    }
    
    .badge {
      display: inline-block;
      background: rgba(168, 85, 247, 0.15);
      border: 2px solid ${scheme.glow1};
      color: ${scheme.glow1};
      font-size: 18px;
      font-weight: 700;
      padding: 10px 28px;
      border-radius: 50px;
      margin-bottom: 50px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .title {
      font-size: 82px;
      font-weight: 900;
      line-height: 1.05;
      margin-bottom: 45px;
      color: #FFFFFF;
      text-shadow: 0 0 60px rgba(168, 85, 247, 0.6);
    }
    
    .highlight {
      background: ${scheme.gradient};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: block;
      margin-top: 10px;
    }
    
    .subtitle {
      font-size: 34px;
      font-weight: 400;
      color: #D0D0D0;
      line-height: 1.5;
      margin-bottom: 70px;
    }
    
    .cta {
      display: inline-block;
      background: ${scheme.gradient};
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 700;
      padding: 22px 55px;
      border-radius: 14px;
      text-decoration: none;
      box-shadow: 0 25px 70px rgba(168, 85, 247, 0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="glow glow-1"></div>
  <div class="glow glow-2"></div>
  
  <div class="container">
    <div class="logo">Prismatic Labs</div>
    
    <div class="badge">${badge}</div>
    
    <h1 class="title">
      ${tema.split(' ').slice(0, -2).join(' ')}
      <span class="highlight">${tema.split(' ').slice(-2).join(' ')}</span>
    </h1>
    
    <p class="subtitle">
      ${subtitulo}
    </p>
    
    <div class="cta">${cta}</div>
  </div>
</body>
</html>`;
}

async function createHTMLs() {
  console.log('\n📝 ETAPA 2: Criando HTMLs...');
  
  try {
    // Lê tópicos gerados
    const generatedDir = path.join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    const topicsFile = files.find(f => f.startsWith('topics-') && f.endsWith('.json'));
    
    if (!topicsFile) {
      throw new Error('Arquivo de tópicos não encontrado. Execute script 1 primeiro.');
    }
    
    const topicsPath = path.join(generatedDir, topicsFile);
    const topicsData = await fs.readFile(topicsPath, 'utf8');
    const topics = JSON.parse(topicsData);
    
    console.log(`📂 Lido: ${topicsFile} (${topics.length} tópicos)`);
    
    // Cria pasta para HTMLs
    const htmlDir = path.join(generatedDir, 'html-posts');
    await fs.mkdir(htmlDir, { recursive: true });
    
    // Gera HTML para cada tópico
    let created = 0;
    for (const topic of topics) {
      const html = createHTMLTemplate(topic);
      const filename = `post-${String(topic.dia).padStart(2, '0')}.html`;
      const filepath = path.join(htmlDir, filename);
      
      await fs.writeFile(filepath, html, 'utf8');
      created++;
      
      if (created % 7 === 0 || created === topics.length) {
        console.log(`  ✅ Criados: ${created}/${topics.length}`);
      }
    }
    
    console.log(`\n🎉 ${created} arquivos HTML criados!`);
    console.log(`📁 Pasta: ${htmlDir}`);
    
    return htmlDir;
    
  } catch (error) {
    console.error('❌ Erro ao criar HTMLs:', error.message);
    throw error;
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  createHTMLs()
    .then(() => {
      console.log('\n✅ ETAPA 2 CONCLUÍDA');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ FALHA:', error);
      process.exit(1);
    });
}

module.exports = { createHTMLs };
