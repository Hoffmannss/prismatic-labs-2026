# 🚀 GUIA DE DEPLOY - PRISMATIC LABS

## Deploy Imediato (5-10 minutos)

### 🎯 Opção 1: Netlify (RECOMENDADO)

**Por que Netlify?**
- SSL/HTTPS automático
- Deploy em segundos
- Domínio gratuito (.netlify.app)
- Formulários nativos (sem backend)

**Passo a passo:**

1. **Acesse**: [https://www.netlify.com](https://www.netlify.com)

2. **Conecte o GitHub**:
   - "New site from Git"
   - Escolha "GitHub"
   - Selecione `prismatic-labs-2026`

3. **Configure o Build**:
   ```
   Base directory: 05-PORTFOLIO
   Build command: (deixe vazio)
   Publish directory: 05-PORTFOLIO
   ```

4. **Deploy!** ✅
   - Site publicado em: `prismatic-labs.netlify.app`

5. **Domínio Customizado** (Opcional):
   - Site settings → Domain management
   - Add custom domain
   - Configure DNS (ex: `prismaticlabs.com.br`)

---

### 📲 Opção 2: Vercel

**Via Interface Web:**

1. Acesse: [https://vercel.com](https://vercel.com)
2. "New Project" → Import from GitHub
3. Selecione `prismatic-labs-2026`
4. Configure:
   ```
   Root Directory: 05-PORTFOLIO
   Framework Preset: Other
   ```
5. Deploy! ✔️

**Via CLI:**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Navegar para o portfolio
cd 05-PORTFOLIO

# Deploy
vercel --prod
```

---

### 📚 Opção 3: GitHub Pages

1. **Criar branch gh-pages**:
```bash
git checkout -b gh-pages
cd 05-PORTFOLIO
cp index.html styles.css script.js ../
git add ../index.html ../styles.css ../script.js
git commit -m "Deploy portfolio"
git push origin gh-pages
```

2. **Ativar Pages**:
   - Repo Settings → Pages
   - Source: `gh-pages` branch
   - Save

3. **URL**: `https://hoffmannss.github.io/prismatic-labs-2026/`

---

## ⚙️ Integrações Essenciais

### 1. Formulário de Contato (Netlify Forms)

**Edição no index.html** (mais fácil):

Substitua a tag `<form>` por:

```html
<form class="contact-form" name="contato" method="POST" data-netlify="true" netlify-honeypot="bot-field">
    <input type="hidden" name="form-name" value="contato">
    
    <!-- Resto do formulário fica igual -->
    <div class="form-row">
        <input type="text" name="name" placeholder="Seu nome" required>
        <input type="email" name="email" placeholder="Seu melhor e-mail" required>
    </div>
    <!-- ... -->
</form>
```

**Pronto!** Netlify captura submissões automaticamente em:
`Site Settings → Forms`

---

### 2. Google Analytics

**Adicione no `<head>` do index.html**:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX'); // Substitua pelo seu ID
</script>
```

**Obter ID Analytics**:
1. [https://analytics.google.com](https://analytics.google.com)
2. Criar propriedade
3. Copiar "Measurement ID" (G-XXXXXXXXXX)

---

### 3. Hotjar (Heatmaps + Sessões)

**Adicione antes do `</head>`**:

```html
<!-- Hotjar Tracking Code -->
<script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:XXXXXXX,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
```

**Setup Hotjar**:
1. [https://www.hotjar.com](https://www.hotjar.com) (free tier)
2. Add new site
3. Copiar código tracking

---

### 4. WhatsApp Business Link

**Substitua no index.html**:

```html
<!-- Linha atual -->
<a href="https://wa.me/5548999999999" target="_blank">WhatsApp: (48) 99999-9999</a>

<!-- Novo com mensagem pré-definida -->
<a href="https://wa.me/5548999999999?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20landing%20pages" target="_blank">WhatsApp: (48) 99999-9999</a>
```

---

## 🇬 SEO Essencial

### Meta Tags Open Graph (Redes Sociais)

**Adicione no `<head>`**:

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://prismaticlabs.com.br/">
<meta property="og:title" content="PRISMATIC LABS | Landing Pages Premium Dark Mode">
<meta property="og:description" content="Agência especializada em landing pages com dark mode + neon colors. Aumento de 40%+ em conversão para infoprodutores e e-commerce.">
<meta property="og:image" content="https://prismaticlabs.com.br/og-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://prismaticlabs.com.br/">
<meta property="twitter:title" content="PRISMATIC LABS | Landing Pages Premium">
<meta property="twitter:description" content="Landing pages dark mode + neon colors com foco em conversão.">
<meta property="twitter:image" content="https://prismaticlabs.com.br/og-image.jpg">
```

### Criar og-image.jpg

**Dimensões**: 1200x630px  
**Conteúdo**:
- Logo PRISMATIC LABS
- Tagline: "Landing Pages que Convertem 40%+"
- Fundo dark com gradiente neon

**Ferramentas**:
- Canva: [https://www.canva.com](https://www.canva.com)
- Figma: Design customizado

---

### Sitemap.xml

**Criar arquivo `sitemap.xml` na pasta 05-PORTFOLIO**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://prismaticlabs.com.br/</loc>
    <lastmod>2026-01-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://prismaticlabs.com.br/#portfolio</loc>
    <lastmod>2026-01-08</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://prismaticlabs.com.br/#precos</loc>
    <lastmod>2026-01-08</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**Submeter**:
- Google Search Console: [https://search.google.com/search-console](https://search.google.com/search-console)

---

## 📊 Performance Checklist

### Antes do Deploy:

- [ ] Testar em Chrome/Firefox/Safari
- [ ] Validar responsividade (mobile, tablet, desktop)
- [ ] Verificar formulário (envio de teste)
- [ ] Checar links (todos funcionam?)
- [ ] Revisar textos (ortografia/gramática)

### Após Deploy:

- [ ] Google PageSpeed Insights (score 90+)
- [ ] SSL/HTTPS funcionando
- [ ] Analytics tracking
- [ ] Formulário capturando leads
- [ ] Compartilhar no LinkedIn/Instagram

---

## 💰 Domínio Customizado

### Registrar Domínio:

**Opções Brasil**:
- [Registro.br](https://registro.br) - R$40/ano (.br)
- [GoDaddy](https://godaddy.com) - R$50-80/ano (.com.br)
- [HostGator](https://hostgator.com.br) - R$40/ano

**Sugestões**:
- `prismaticlabs.com.br`
- `prismaticlab.com.br`
- `agencianeon.com.br`
- `landingpageneon.com.br`

### Configurar DNS:

**Netlify**:
```
Type: A Record
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: prismatic-labs.netlify.app
```

**Vercel**:
```
Type: A Record
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Propagação DNS: 24-48h

---

## 🔥 Quick Wins Imediatos

### Semana 1:

1. **Deploy no Netlify** (hoje)
2. **Configurar Analytics** (hoje)
3. **Postar no LinkedIn**:
   > "🚀 Acabei de lançar o site da PRISMATIC LABS!  
   > Agência especializada em landing pages premium com dark mode + neon colors.  
   > Foco em conversão mensurável para infoprodutores e e-commerce.  
   > Confira: [LINK]  
   > #webdesign #landingpages #ux #darkmode"

4. **Instagram Story** (3-5 posts):
   - Screenshot hero section
   - Portfolio cases
   - Pricing cards
   - CTA: "Link na bio"

5. **Enviar para 10 prospects**:
   - Template: "Oi [NOME], acabei de lançar meu portfolio de landing pages premium. Dá uma olhada e me diz o que achou? [LINK]"

---

## 🔧 Troubleshooting

### Problema: Formulário não funciona

**Solução**: Verificar:
- `name="contato"` no form
- `data-netlify="true"` presente
- Deploy refeito após alterações

### Problema: CSS não carrega

**Solução**:
- Verificar path: `<link rel="stylesheet" href="styles.css">`
- Cache do navegador: Ctrl+Shift+R

### Problema: Performance baixa

**Solução**:
- Comprimir imagens (TinyPNG)
- Minificar CSS/JS
- Lazy loading em imagens

---

## ✅ Checklist Final

**Antes de divulgar**:

- [ ] Site no ar com SSL
- [ ] Analytics configurado
- [ ] Formulário testado (envio real)
- [ ] Todas as links funcionando
- [ ] Responsivo em mobile
- [ ] WhatsApp com número correto
- [ ] E-mail configurado
- [ ] Meta tags OG (preview redes sociais)
- [ ] Favicon adicionado
- [ ] Google Search Console configurado

**Próximos passos**:
- [ ] Cases reais com screenshots
- [ ] Depoimentos de clientes
- [ ] Blog/conteúdo SEO
- [ ] Calculadora ROI
- [ ] Página de agradecimento (after submit)

---

**Status**: ✅ Pronto para lançar!  
**Tempo estimado**: 30-60 minutos  
**Custo**: R$0 (free tier)

🚀 **BOA SORTE COM O LANÇAMENTO!**