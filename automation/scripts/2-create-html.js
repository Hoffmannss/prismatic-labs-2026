#!/usr/bin/env node
/**
 * PRISMATIC LABS - INSTAGRAM AUTOMATION
 * Script 2: Criação de HTMLs para Posts
 * 
 * O QUE FAZ:
 * - Lê tópicos gerados (script 1)
 * - Cria 28 arquivos HTML com design Prismatic
 * - Injeta: título, subtema, badges, glows
 * 
 * INPUT: /generated/topics-[mes].json
 * OUTPUT: /generated/posts/post-[1-28].html
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Template HTML base (design Prismatic)
const HTML_TEMPLATE = `<!DOCTYPE html>
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
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      position: relative;
      overflow: hidden;
    }
    
    /* Glow effects */
    .glow-purple {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%);
      top: -200px;
      left: -200px;
      animation: pulse 4s ease-in-out infinite;
    }
    
    .glow-teal {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(6, 217, 215, 0.3) 0%, transparent 70%);
      bottom: -150px;
      right: -150px;
      animation: pulse 4s ease-in-out infinite 2s;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    
    .container {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 80px;
      max-width: 900px;
    }
    
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #A855F7, #06D9D7);
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 12px 28px;
      border-radius: 25px;
      margin-bottom: 40px;
      box-shadow: 0 8px 32px rgba(168, 85, 247, 0.4);
    }
    
    h1 {
      font-size: 72px;
      font-weight: 900;
      line-height: 1.1;
      color: #fff;
      margin-bottom: 30px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    
    .gradient-text {
      background: linear-gradient(135deg, #A855F7, #06D9D7, #FF006E);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      font-size: 28px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.4;
      margin-bottom: 60px;
    }
    
    .logo {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      opacity: 0.8;
    }
    
    .logo span {
      background: linear-gradient(135deg, #A855F7, #06D9D7);
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
    <h1>{{TITLE_PART1}}<br><span class="gradient-text">{{TITLE_PART2}}</span></h1>
    <div class="subtitle">{{SUBTITLE}}</div>
  </div>
  
  <div class="logo">
    <span>PRISMATIC</span> LABS
  </div>
</body>
</html>`;

// Função para dividir título em 2 partes
function splitTitle(title) {
  const words = title.split(' ');
  const mid = Math.ceil(words.length / 2);
  return {
    part1: words.slice(0, mid).join(' '),
    part2: words.slice(mid).join(' ')
  };
}

// Função para gerar badge baseado no tipo
function getBadge(type) {
  const badges = {
    'educacional': 'APRENDA AGORA',
    'vendas': 'RESULTADO REAL',
    'social-proof': 'CASO DE SUCESSO',
    'cta': 'OPORTUNIDADE'
  };
  return badges[type] || 'PRISMATIC LABS';
}

// Função principal
async function createHTML(month) {
  console.log(chalk.blue.bold('\n🎨 ETAPA 2: CRIAÇÃO DE HTMLs\n'));

  try {
    // Ler tópicos
    const topicsFile = path.join(__dirname, '../generated', `topics-${month.toLowerCase()}.json`);
    const topicsData = await fs.readFile(topicsFile, 'utf-8');
    const topics = JSON.parse(topicsData);

    console.log(chalk.gray(`Tópicos carregados: ${topics.posts.length} posts\n`));

    // Criar pasta de destino
    const outputDir = path.join(__dirname, '../generated/posts');
    await fs.mkdir(outputDir, { recursive: true });

    // Gerar HTMLs
    for (const [index, post] of topics.posts.entries()) {
      const { part1, part2 } = splitTitle(post.tema);
      const badge = getBadge(post.tipo);
      
      const html = HTML_TEMPLATE
        .replace('{{TITLE}}', post.tema)
        .replace('{{BADGE}}', badge)
        .replace('{{TITLE_PART1}}', part1)
        .replace('{{TITLE_PART2}}', part2)
        .replace('{{SUBTITLE}}', post.subtema || post.angulo || '');

      const filename = `post-${String(index + 1).padStart(2, '0')}.html`;
      const filepath = path.join(outputDir, filename);
      
      await fs.writeFile(filepath, html, 'utf-8');
      
      console.log(chalk.green(`✓ ${filename} criado`));
    }

    console.log(chalk.green.bold(`\n✓ ${topics.posts.length} HTMLs criados com sucesso!\n`));
    console.log(chalk.gray(`Pasta: ${outputDir}\n`));
    console.log(chalk.blue.bold('ETAPA 2 CONCLUÍDA ✅\n'));

    return outputDir;

  } catch (error) {
    console.error(chalk.red.bold('\n✗ ERRO na criação de HTMLs:\n'));
    console.error(chalk.red(error.message));
    
    if (error.code === 'ENOENT') {
      console.log(chalk.yellow('\n⚠️ Execute primeiro: npm run generate:topics\n'));
    }
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const month = process.argv[2] || 'Fevereiro';
  createHTML(month);
}

module.exports = createHTML;
