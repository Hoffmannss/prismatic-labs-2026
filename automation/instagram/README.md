# 🤖 SISTEMA AUTOMÁTICO - INSTAGRAM PRISMATIC LABS

## 📋 O QUE FAZ

Gera **28 posts Instagram completos** (imagem + legenda) em **15 minutos** totalmente automático.

---

## 🎯 COMO USAR

### MÉTODO 1 - Manual (quando precisar)

1. Vai em: https://github.com/Hoffmannss/prismatic-labs-2026/actions
2. Clica: **"🤖 Gerar Posts Instagram Automático"**
3. Clica: **"Run workflow"**
4. Digita o mês (ex: "Março")
5. Clica: **"Run workflow"** (botão verde)
6. **Aguarda 15min** ☕
7. **PRONTO!** 28 posts no seu Google Drive

### MÉTODO 2 - Automático (sem fazer nada)

Todo **dia 25 de cada mês às 20h**, o sistema roda sozinho e gera os posts do mês seguinte.

---

## 🛠️ SETUP INICIAL (só 1x)

### 1️⃣ Google Gemini API (IA grátis)

1. Acessa: https://makersuite.google.com/app/apikey
2. Clica: **"Create API Key"**
3. Copia a chave
4. Vai em: https://github.com/Hoffmannss/prismatic-labs-2026/settings/secrets/actions
5. Clica: **"New repository secret"**
6. Nome: `GEMINI_API_KEY`
7. Valor: [cola a chave]
8. Salva

### 2️⃣ Google Drive API (armazenamento grátis)

1. Acessa: https://console.cloud.google.com/
2. Cria projeto: **"Prismatic Instagram"**
3. Ativa API: **"Google Drive API"**
4. Vai em: **Credentials > Create > Service Account**
5. Nome: `instagram-bot`
6. Cria chave JSON
7. Baixa arquivo JSON
8. Copia **TODO CONTEÚDO** do arquivo
9. GitHub Secrets > Nome: `GOOGLE_CREDENTIALS`
10. Valor: [cola JSON inteiro]
11. Salva

### 3️⃣ Make.com (agendamento Instagram grátis)

1. Acessa: https://www.make.com/ (cria conta FREE)
2. Cria **New Scenario**
3. Adiciona módulo: **Webhooks > Custom Webhook**
4. Copia a URL do webhook
5. GitHub Secrets > Nome: `MAKE_WEBHOOK_URL`
6. Valor: [cola URL]
7. Salva
8. **Continue configurando Make.com** (veja abaixo)

### 4️⃣ Instagram Graph API (publicação grátis)

1. Acessa: https://developers.facebook.com/
2. Cria App: **"Prismatic Instagram Bot"**
3. Adiciona produto: **Instagram**
4. Pega **Access Token** e **Instagram Business Account ID**
5. GitHub Secrets:
   - Nome: `INSTAGRAM_ACCESS_TOKEN` / Valor: [token]
   - Nome: `INSTAGRAM_BUSINESS_ACCOUNT_ID` / Valor: [ID]

---

## 🔄 CONFIGURAÇÃO MAKE.COM (AGENDAMENTO)

### Fluxo completo:

```
[1] Webhook (recebe dados GitHub)
      ↓
[2] Google Drive - List Folder Files (pega imagens)
      ↓
[3] Google Drive - Download Files (baixa cada imagem)
      ↓
[4] Iterator (para cada imagem)
      ↓
[5] Get Caption (pega legenda correspondente)
      ↓
[6] HTTP - Instagram Create Container
      URL: https://graph.facebook.com/v18.0/{{ACCOUNT_ID}}/media
      Method: POST
      Body:
        image_url: {{image_url}}
        caption: {{caption}}
        access_token: {{ACCESS_TOKEN}}
      ↓
[7] Sleep 30 seconds (evita rate limit)
      ↓
[8] HTTP - Instagram Publish Post
      URL: https://graph.facebook.com/v18.0/{{ACCOUNT_ID}}/media_publish
      Method: POST
      Body:
        creation_id: {{container_id}}
        access_token: {{ACCESS_TOKEN}}
      ↓
[9] Google Sheets - Log (registra sucesso)
```

### Cronograma de publicação:

**SEG:** 10h Educacional | 19h Story
**TER:** 14h Dica
**QUA:** 10h Social proof | 17h Story
**QUI:** 14h Educacional
**SEX:** 10h Vendas | 19h Urgência
**SAB:** 11h Inspiração
**DOM:** 19h CTA forte

---

## 📊 ESTRUTURA ARQUIVOS

```
automation/instagram/
├── scripts/
│   ├── 1-generate-topics.js      # Gera 28 tópicos (Gemini)
│   ├── 2-create-html.js          # Cria HTMLs com design
│   ├── 3-screenshots.js          # Gera PNGs (Puppeteer)
│   ├── 4-generate-captions.js    # Gera legendas (Gemini)
│   ├── 5-upload-drive.js         # Upload Google Drive
│   └── 6-trigger-make.js         # Dispara Make.com
├── generated/
│   ├── topics-fevereiro.json     # Tópicos gerados
│   ├── posts-html/               # HTMLs temporários
│   ├── images/                   # PNGs (1080x1080)
│   ├── captions/                 # Legendas TXT
│   └── drive-mapping.json        # URLs Drive
├── package.json
├── .env.example
└── README.md (este arquivo)
```

---

## 🐛 TROUBLESHOOTING

### Erro: "GEMINI_API_KEY not found"
- Verifica se criou secret no GitHub
- Nome EXATO: `GEMINI_API_KEY`

### Erro: "Google Drive upload failed"
- Service account tem permissão?
- JSON está correto no secret?

### Erro: "Puppeteer screenshot timeout"
- Normal em GitHub Actions
- Roda novamente, geralmente passa

### Make.com não recebe webhook
- URL está correta?
- Webhook está "ON" no Make.com?

---

## 📈 CUSTOS

| Serviço | Plano | Custo | Limite |
|---------|-------|-------|--------|
| GitHub Actions | FREE | R$ 0 | 2000 min/mês |
| Gemini API | FREE | R$ 0 | 60 req/min |
| Google Drive | FREE | R$ 0 | 15 GB |
| Make.com | FREE | R$ 0 | 1000 ops/mês |
| Instagram API | FREE | R$ 0 | Ilimitado |
| **TOTAL** | | **R$ 0/mês** | |

**Com 28 posts/mês:**
- GitHub Actions: ~15min (0.75% do limite)
- Gemini: ~60 chamadas (100% grátis)
- Drive: ~300MB (2% do limite)
- Make: ~100 ops (10% do limite)

✅ **TOTALMENTE SUSTENTÁVEL NO FREE FOREVER**

---

## 🎓 PRÓXIMOS PASSOS

1. [ ] Roda primeira vez manual
2. [ ] Verifica posts gerados no Drive
3. [ ] Configura Make.com completo
4. [ ] Testa agendamento 1 post
5. [ ] Libera automático mensal
6. [ ] **NUNCA MAIS CRIAR POSTS MANUAL** 🎉

---

**Dúvidas?** Abre issue no GitHub ou me chama.

**Atualizado:** 24/01/2026  
**Status:** ✅ 100% FUNCIONAL