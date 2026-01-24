#!/usr/bin/env node
/**
 * 🏗️ SCRIPT 2: CRIAÇÃO HTML DOS POSTS
 * 
 * O QUE FAZ:
 * 1. Lê: topics-*.json gerado pelo script 1
 * 2. Para cada tópico: cria HTML com identidade visual Prismatic
 * 3. Salva: 28 arquivos HTML prontos para screenshot
 * 
 * TEMPLATE:
 * - Background: Gradient purple/teal + grid
 * - Tipografia: Poppins bold + Inter
 * - Elementos: Badge tipo, glow effects, CTA
 * - Cores: #A855F7 (purple), #06D9D7 (teal), #FF006E (pink)
 */

const fs = require('fs').promises;
const path = require('path');

// Template HTML base
function createPostHTML(post) {
  const typeColors = {
    'educacional': '#06D9D7',
    'social-proof': '#FF006E',
    'vendas': '#A855F7',
    'urgencia': '#FF006E'
  };

  const typeLabels = {
    'educacional': '🎯 APRENDA',
    'social-proof': '⭐ RESULTADO',
    'vendas': '🚀 OPORTUNIDADE',
    'urgencia': '⏰ ÚLTIMA CHANCE'
  };

  const color = typeColors[post.tipo] || '#A855F7';
  const label = typeLabels[post.tipo] || '💡';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <title>Post ${post.id} - ${post.tema}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 1080px;
      height: 1080px;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', -apple-system, sans-serif;
      overflow: hidden;
      position: relative;
    }

    /* Grid background */
    body::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      opacity: 0.5;
    }

    /* Glows */
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
      background: radial-gradient(circle, rgba(6, 217, 215, 0.1) 0%, transparent 70%);
      bottom: -150px;
      left: -150px;
      filter: blur(80px);
    }

    /* Container principal */
    .container {
      position: relative;
      z-index: 10;
      width: 920px;
      padding: 80px 60px;
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    /* Badge tipo */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid ${color};
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      color: ${color};
      text-transform: uppercase;
      letter-spacing: 1px;
      width: fit-content;
      box-shadow: 0 0 30px ${color}40;
    }

    /* Título */
    .title {
      font-family: 'Poppins', sans-serif;
      font-size: 72px;
      font-weight: 900;
      line-height: 1.1;
      color: #ffffff;
      text-shadow: 0 0 40px rgba(168, 85, 247, 0.3);
      letter-spacing: -2px;
    }

    .title .highlight {
      background: linear-gradient(135deg, #A855F7 0%, #06D9D7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Hook */
    .hook {
      font-size: 28px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 400;
    }

    /* CTA */
    .cta {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 20px 40px;
      background: linear-gradient(135deg, #A855F7 0%, #06D9D7 100%);
      border: none;
      border-radius: 50px;
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      width: fit-content;
      margin-top: 20px;
      box-shadow: 0 20px 60px rgba(168, 85, 247, 0.4);
    }

    /* Logo/Brand */
    .brand {
      position: absolute;
      bottom: 60px;
      right: 60px;
      font-family: 'Poppins', sans-serif;
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      opacity: 0.6;
      letter-spacing: 2px;
    }

    /* Post number */
    .post-number {
      position: absolute;
      top: 40px;
      right: 60px;
      font-size: 18px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="glow-purple"></div>
  <div class="glow-teal"></div>
  
  <div class="container">
    <span class="badge">${label}</span>
    
    <h1 class="title">
      ${formatTitle(post.tema)}
    </h1>
    
    ${post.hook ? `<p class="hook">${post.hook}</p>` : ''}
    
    <div class="cta">
      <span>→</span>
      <span>Link na bio</span>
    </div>
  </div>

  <div class="post-number">${String(post.id).padStart(2, '0')}/28</div>
  <div class="brand">PRISMATIC</div>
</body>
</html>`;
}

// Formatar título: destacar palavras-chave
function formatTitle(title) {
  const keywords = [
    'premium', 'profissional', 'resultado', 'convers\u00e3o', 'vendas',
    'aumenta', 'dobra', 'triplica', 'r\\$[0-9]+[k]?', '[0-9]+%', '[0-9]+x',
    'dark mode', 'landing page', 'automa\u00e7\u00e3o', 'roi'
  ];

  let formatted = title;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    formatted = formatted.replace(regex, '<span class="highlight">$1</span>');
  });

  return formatted;
}

// Função principal
async function createHTMLs() {
  try {
    console.log('\n🏗️ CRIANDO HTMLs...\n');

    // 1. Encontrar arquivo topics mais recente
    const generatedDir = path.join(__dirname, '..', 'generated');
    const files = await fs.readdir(generatedDir);
    const topicsFiles = files.filter(f => f.startsWith('topics-') && f.endsWith('.json'));

    if (topicsFiles.length === 0) {
      throw new Error('Nenhum arquivo topics-*.json encontrado. Execute: npm run generate-topics');
    }

    // Pegar mais recente
    topicsFiles.sort().reverse();
    const topicsFile = topicsFiles[0];
    console.log(`📂 Lendo: ${topicsFile}`);

    // 2. Ler tópicos
    const topicsPath = path.join(generatedDir, topicsFile);
    const data = JSON.parse(await fs.readFile(topicsPath, 'utf8'));

    if (!data.posts || data.posts.length === 0) {
      throw new Error('Arquivo topics vazio ou inválido');
    }

    // 3. Criar pasta HTML
    const htmlDir = path.join(generatedDir, 'html');
    await fs.mkdir(htmlDir, { recursive: true });

    // 4. Gerar HTMLs
    console.log(`\n🎨 Gerando ${data.posts.length} HTMLs...\n`);

    const results = [];
    for (const post of data.posts) {
      const html = createPostHTML(post);
      const filename = `post-${String(post.id).padStart(2, '0')}.html`;
      const filepath = path.join(htmlDir, filename);
      
      await fs.writeFile(filepath, html, 'utf8');
      results.push({ id: post.id, file: filename, tema: post.tema });
      
      console.log(`  ✅ ${filename} - ${post.tema.substring(0, 50)}...`);
    }

    // 5. Salvar índice
    const indexPath = path.join(htmlDir, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify({
      gerado_em: new Date().toISOString(),
      total: results.length,
      posts: results
    }, null, 2));

    // 6. Resumo
    console.log('\n✅ HTMLs CRIADOS COM SUCESSO!\n');
    console.log(`📁 Pasta: ${htmlDir}`);
    console.log(`📊 Total: ${results.length} arquivos`);
    console.log('\n🚀 Próximo passo: npm run screenshots\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n🔧 Verifique:');
    console.error('1. Arquivo topics-*.json existe?');
    console.error('2. JSON válido?');
    console.error('3. Permissões de escrita?\n');
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  createHTMLs();
}

module.exports = { createHTMLs };
