# 🎨 PRISMATIC LABS - Portfolio Website

## Overview

Portfolio completo e funcional da PRISMATIC LABS com design dark mode + neon colors.

## 🚀 Estrutura de Arquivos

```
05-PORTFOLIO/
├── index.html      # HTML completo (hero, portfolio, processo, preços, contato)
├── styles.css      # CSS com design system neon + dark mode
├── script.js       # JavaScript (smooth scroll, animações, formulário)
└── README.md       # Este arquivo
```

## 🎨 Design System

### Cores Neon
- **Neon Purple**: `#A855F7` (headlines, destaques)
- **Neon Teal**: `#06D9D7` (borders, links)
- **Hot Pink CTA**: `#FF006E` (botões principais)
- **Pure Black**: `#000000` (backgrounds)
- **Off-White**: `#F5F5F5` (texto)

### Tipografia
- **Display**: Space Grotesk (logo)
- **Body**: Inter (texto geral)

## 📦 Deploy Rápido

### Opção 1: Netlify (Recomendado)

1. Faça upload dos 3 arquivos (index.html, styles.css, script.js)
2. Configure domínio customizado (ex: prismaticlabs.com.br)
3. SSL automático incluído

### Opção 2: Vercel

```bash
npm install -g vercel
cd 05-PORTFOLIO
vercel --prod
```

### Opção 3: GitHub Pages

1. Crie branch `gh-pages`
2. Push dos arquivos
3. Ative Pages nas configurações

## 🔧 Integrações Necessárias

### Formulário de Contato

Atualmente o formulário apenas simula envio. Integre com:

**Opção 1: EmailJS** (Grátis)
```javascript
emailjs.send("service_id", "template_id", data)
```

**Opção 2: Google Sheets + Apps Script**
```javascript
fetch('SCRIPT_URL', { method: 'POST', body: JSON.stringify(data) })
```

**Opção 3: Webhook (Zapier/Make)**
```javascript
fetch('WEBHOOK_URL', { method: 'POST', body: JSON.stringify(data) })
```

### Analytics

Adicione no `<head>` do index.html:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Heatmaps

```html
<!-- Hotjar -->
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

## 📊 SEO Checklist

- [x] Meta description
- [x] Titles semânticos (H1, H2, H3)
- [x] Responsive design
- [ ] Open Graph tags (redes sociais)
- [ ] Schema.org markup
- [ ] Sitemap.xml
- [ ] robots.txt

### Adicionar no `<head>`:

```html
<!-- Open Graph -->
<meta property="og:title" content="PRISMATIC LABS | Landing Pages Premium">
<meta property="og:description" content="Especializados em landing pages dark mode + neon colors com foco em conversão.">
<meta property="og:image" content="URL_DA_IMAGEM">
<meta property="og:url" content="https://prismaticlabs.com.br">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="PRISMATIC LABS">
<meta name="twitter:description" content="Landing pages premium com dark mode + neon colors">
<meta name="twitter:image" content="URL_DA_IMAGEM">
```

## 🎯 Próximos Passos

1. **Imagens Reais**: Substituir placeholders por screenshots de projetos
2. **Case Studies**: Criar páginas individuais para cada case
3. **Blog**: Adicionar seção de conteúdo (SEO)
4. **Depoimentos**: Vídeos/textos de clientes
5. **Calculadora ROI**: Ferramenta interativa

## 🔒 Segurança

- HTTPS obrigatório (Netlify/Vercel incluem SSL)
- Validação de formulários no backend
- Rate limiting em APIs
- Sanitização de inputs

## 📱 Performance

Resultados esperados no Google PageSpeed:
- **Desktop**: 90-100
- **Mobile**: 85-95

Otimizações aplicadas:
- CSS minificado
- Fonts otimizadas (Google Fonts)
- Lazy loading em imagens
- Smooth scroll nativo

## 🆘 Suporte

Problemas ou dúvidas:
1. Verifique console do navegador (F12)
2. Teste em diferentes browsers
3. Valide HTML/CSS com W3C Validator

---

**Status**: ✅ Pronto para deploy
**Última atualização**: Janeiro 2026
**Versão**: 1.0.0