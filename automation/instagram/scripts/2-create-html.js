const fs = require('fs').promises;
const path = require('path');

const TEMPLATE_BASE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1080px;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Poppins', sans-serif;
      position: relative;
      overflow: hidden;
    }
    .glow-purple {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%);
      top: -200px;
      right: -200px;
      filter: blur(80px);
    }
    .glow-teal {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(6,217,215,0.2) 0%, transparent 70%);
      bottom: -150px;
      left: -150px;
      filter: blur(100px);
    }
    .container {
      width: 900px;
      padding: 80px;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(90deg, #A855F7, #06D9D7);
      color: white;
      padding: 12px 32px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 40px;
    }
    h1 {
      font-size: 72px;
      font-weight: 900;
      color: white;
      line-height: 1.1;
      margin-bottom: 30px;
      text-shadow: 0 0 30px rgba(168,85,247,0.5);
    }
    .highlight {
      background: linear-gradient(90deg, #A855F7, #FF006E);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      font-size: 28px;
      color: rgba(255,255,255,0.8);
      line-height: 1.6;
      margin-bottom: 50px;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      gap: 15px;
      background: linear-gradient(90deg, #A855F7, #FF006E);
      color: white;
      padding: 20px 50px;
      border-radius: 50px;
      font-size: 24px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 10px 40px rgba(168,85,247,0.4);
    }
    .logo {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 20px;
      color: rgba(255,255,255,0.6);
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="glow-purple"></div>
  <div class="glow-teal"></div>
  <div class="container">
    <div class="badge">{{BADGE}}</div>
    <h1>{{TITLE}}</h1>
    <p>{{SUBTITLE}}</p>
    <div class="cta">{{CTA}}</div>
  </div>
  <div class="logo">PRISMATIC LABS</div>
</body>
</html>`;

async function createHTMLs() {
  console.log('🎨 Criando arquivos HTML...');

  // Encontrar último arquivo topics gerado
  const generatedDir = path.join(__dirname, '../generated');
  const files = await fs.readdir(generatedDir);
  const topicFiles = files.filter(f => f.startsWith('topics-'));
  
  if (topicFiles.length === 0) {
    throw new Error('❌ Nenhum arquivo topics-*.json encontrado!');
  }

  const latestTopicFile = topicFiles.sort().reverse()[0];
  const topicsPath = path.join(generatedDir, latestTopicFile);
  const topics = JSON.parse(await fs.readFile(topicsPath, 'utf-8'));

  const postsDir = path.join(generatedDir, 'posts-html');
  await fs.mkdir(postsDir, { recursive: true });

  for (const topic of topics) {
    const html = TEMPLATE_BASE
      .replace('{{TITLE}}', topic.tema)
      .replace('{{TITLE}}', topic.tema)
      .replace('{{BADGE}}', topic.tipo.toUpperCase())
      .replace('{{SUBTITLE}}', topic.hook)
      .replace('{{CTA}}', topic.cta);

    const filename = `post-${topic.dia.toString().padStart(2, '0')}.html`;
    await fs.writeFile(path.join(postsDir, filename), html);
  }

  console.log(`✅ ${topics.length} arquivos HTML criados!`);
}

createHTMLs().catch(console.error);