# 🎨 Biblioteca de Assets - Prismatic Labs

**Biblioteca profissional de elementos reutilizáveis para posts do Instagram**

---

## 📚 Índice

1. [Ícones SVG](#ícones-svg)
2. [Gradientes CSS](#gradientes-css)
3. [Como Usar](#como-usar)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Convenções](#convenções)

---

## 🔶 Ícones SVG

**Arquivo:** `icons-library.svg`  
**Total:** 20+ ícones vetoriais profissionais

### Categorias Disponíveis

#### ⚡ Velocidade & Performance
- `icon-speed-timer` - Cronômetro com raio (velocidade)
- `icon-speedometer` - Velocímetro minimalista
- `icon-rocket` - Foguete com chamas (lançamento)

#### 📱 Mobile & Responsivo
- `icon-mobile` - Smartphone moderno
- `icon-devices` - Múltiplos dispositivos (monitor + tablet + mobile)

#### 🎨 UI/UX & Design
- `icon-cursor-click` - Cursor com animação de clique
- `icon-grid` - Grid de layout 2x2

#### 📊 Conversão & CTA
- `icon-arrow-up` - Seta para cima (crescimento)
- `icon-check` - Check em círculo (verificação)
- `icon-star` - Estrela (destaque)

#### 🔷 Formas Geométricas
- `shape-hexagon` - Hexágono
- `shape-tri-circle` - Triângulo com círculo interno
- `shape-waves` - Ondas fluidas

#### ✨ Efeitos Decorativos
- `effect-sparkles` - Brilhos/sparkles
- `effect-speed-lines` - Linhas de velocidade

#### ➡️ Navegação
- `icon-refresh` - Seta circular (processo)
- `icon-arrow-right` - Seta direita moderna

### Como Usar Ícones

```html
<!-- Incluir biblioteca no HTML -->
<object data="icons-library.svg" style="display: none;"></object>

<!-- Usar um ícone -->
<svg width="64" height="64" style="color: #667eea;">
  <use href="#icon-speed-timer"></use>
</svg>

<!-- Com classe CSS para cor -->
<svg width="80" height="80" class="icon-primary">
  <use href="#icon-rocket"></use>
</svg>
```

**Nota:** Todos os ícones usam `currentColor`, então você pode mudar a cor apenas alterando a propriedade `color` do CSS!

---

## 🌈 Gradientes CSS

**Arquivo:** `gradients-library.css`  
**Total:** 15+ gradientes + padrões + animações

### Categorias de Gradientes

#### 💻 Tech/Moderno
```css
.gradient-tech-blue      /* Azul tech (#667eea → #764ba2) */
.gradient-tech-cyan      /* Ciano vibrante */
.gradient-neon-purple    /* Neon roxo/rosa */
.gradient-dark-tech      /* Tech escuro */
.gradient-deep-space     /* Azul espacial */
```

#### ⚡ Velocidade/Energia
```css
.gradient-speed-orange   /* Laranja velocidade */
.gradient-lightning-bolt /* Amarelo raio */
.gradient-fire-red       /* Vermelho fogo */
.gradient-sunset         /* Pôr do sol */
```

#### 🌸 Suaves/Elegantes
```css
.gradient-soft-mint      /* Verde menta suave */
.gradient-rose-gold      /* Rosa dourado */
.gradient-sky-blue       /* Azul céu */
.gradient-lavender       /* Lavanda */
```

#### 🎯 CTA/Conversão
```css
.gradient-cta-green      /* Verde conversão */
.gradient-cta-blue       /* Azul CTA */
.gradient-premium-gold   /* Dourado premium */
```

#### 🔄 Animados
```css
.gradient-animated       /* Gradiente que se move */
.gradient-pulse          /* Pulsação suave */
```

### Padrões Geométricos

```css
.pattern-dots            /* Pontos repetidos */
.pattern-grid            /* Grade geométrica */
.pattern-diagonal-lines  /* Linhas diagonais */
```

### Efeitos Glass/Blur

```css
.glass-effect            /* Glass morphism claro */
.glass-dark              /* Glass morphism escuro */
```

### Sombras Profissionais

```css
.shadow-soft             /* Sombra suave */
.shadow-medium           /* Sombra média */
.shadow-strong           /* Sombra forte */
.shadow-glow-blue        /* Brilho azul */
.shadow-glow-purple      /* Brilho roxo */
```

### Animações

```css
.animate-fade-in         /* Fade in suave */
.animate-slide-right     /* Desliza da direita */
.animate-slide-left      /* Desliza da esquerda */
.animate-slide-up        /* Desliza de baixo */
.animate-scale-in        /* Escala crescente */
```

---

## 🛠️ Como Usar

### Setup Básico

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Instagram</title>
  
  <!-- Incluir biblioteca de gradientes -->
  <link rel="stylesheet" href="gradients-library.css">
  
  <style>
    /* Seus estilos personalizados aqui */
  </style>
</head>
<body>
  <!-- Incluir biblioteca de ícones -->
  <object data="icons-library.svg" style="display: none;"></object>
  
  <!-- Seu conteúdo aqui -->
  
</body>
</html>
```

### Variáveis CSS Disponíveis

```css
:root {
  /* Cores primárias Prismatic Labs */
  --color-primary: #667eea;
  --color-primary-dark: #5568d3;
  --color-secondary: #764ba2;
  
  /* Cores de destaque */
  --color-accent-orange: #ff6b6b;
  --color-accent-cyan: #00d2ff;
  --color-accent-green: #38ef7d;
  
  /* Cores neutras */
  --color-dark: #1a1a2e;
  --color-medium: #16213e;
  --color-light: #f5f5f5;
  --color-white: #ffffff;
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Card com Gradiente e Ícone

```html
<div class="gradient-tech-blue shadow-medium" style="padding: 40px; border-radius: 20px;">
  <svg width="80" height="80" style="color: white;">
    <use href="#icon-speed-timer"></use>
  </svg>
  <h2 style="color: white;">Sites 3x Mais Rápidos</h2>
  <p style="color: rgba(255,255,255,0.9);">Carregamento instantâneo garantido</p>
</div>
```

### Exemplo 2: Texto com Gradiente

```html
<h1 class="text-gradient" style="font-size: 48px; font-weight: bold;">
  Prismatic Labs
</h1>
```

### Exemplo 3: Botão CTA com Animação

```html
<button class="gradient-cta-green shadow-glow-blue animate-scale-in" 
        style="padding: 20px 40px; border: none; border-radius: 12px; 
               color: white; font-size: 18px; cursor: pointer;">
  Fale Conosco
  <svg width="24" height="24" style="color: white; margin-left: 10px;">
    <use href="#icon-arrow-right"></use>
  </svg>
</button>
```

### Exemplo 4: Background com Padrão

```html
<div class="pattern-grid" style="width: 1080px; height: 1080px;">
  <div class="glass-effect" style="padding: 60px; margin: 100px;">
    <h1 style="color: white;">Conteúdo Aqui</h1>
  </div>
</div>
```

---

## 📜 Convenções

### Nomenclatura de Ícones

- `icon-*` = Ícones funcionais (UI/UX)
- `shape-*` = Formas geométricas
- `effect-*` = Efeitos decorativos

### Nomenclatura de Gradientes

- `gradient-{estilo}-{cor}` = Gradiente estático
- `gradient-animated` = Com animação
- `pattern-*` = Padrões repetidos
- `glass-*` = Efeitos glass morphism

### Tamanhos Padrão Instagram

```css
/* Feed (Post Quadrado) */
width: 1080px;
height: 1080px;

/* Stories/Reels (Vertical) */
width: 1080px;
height: 1920px;

/* Carrossel (Múltiplos slides) */
width: 1080px;
height: 1080px;
/* Até 10 slides por post */
```

---

## ✅ Checklist de Uso

**Antes de criar um novo post:**

- [ ] Incluir `icons-library.svg` no HTML
- [ ] Incluir `gradients-library.css` no head
- [ ] Verificar se a cor do ícone usa `currentColor`
- [ ] Testar responsividade (1080x1080px)
- [ ] Validar contraste de texto sobre gradientes
- [ ] Adicionar animações sutis onde apropriado
- [ ] Garantir que o design é profissional e limpo

---

## 📦 Estrutura de Arquivos

```
instagram/
├── assets/
│   ├── icons-library.svg       # Biblioteca de ícones
│   ├── gradients-library.css   # Biblioteca de gradientes
│   └── README.md               # Esta documentação
├── carousels/
│   ├── velocidade-sites/       # Carrossel 1
│   └── [futuros carrosséis]
└── posts/
    └── [posts individuais]
```

---

## 🚀 Próximos Passos

1. **Expandir biblioteca** com mais ícones conforme necessário
2. **Criar templates** pré-configurados para posts recorrentes
3. **Documentar patterns** de design que funcionam bem
4. **Adicionar exemplos** de combinações vencedoras

---

**Última atualização:** 22/01/2026  
**Versão:** 1.0  
**Mantenedor:** Prismatic Labs  
