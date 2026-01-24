# 🤖 SISTEMA DE AUTOMAÇÃO INSTAGRAM - PRISMATIC LABS

## 🎯 O QUE ELE FAZ

Gera **automaticamente** 28 posts Instagram por mês:
- ✅ Cria tópicos com IA (Gemini)
- ✅ Gera designs HTML responsivos
- ✅ Captura screenshots profissionais
- ✅ Escreve legendas otimizadas
- ✅ Faz upload Google Drive
- ✅ Agenda no Instagram via Make.com

**Você só precisa:** Clicar 1 botão por mês (ou deixar rodar sozinho todo dia 25)

---

## 🛠️ ARQUITETURA DO SISTEMA

```
GITHUB ACTIONS (nuvem FREE)
    ↓
[1] Gemini AI → Gera 28 tópicos JSON
    ↓
[2] Node.js → Cria 28 HTMLs estilizados
    ↓
[3] Puppeteer → 28 screenshots PNG 1080x1080
    ↓
[4] Gemini AI → Gera 28 legendas otimizadas
    ↓
[5] Google Drive API → Upload organizado
    ↓
[6] Make.com Webhook → Notificação
    ↓
MAKE.COM (scenario automático)
    ↓
[7] Lê Drive → Combina imagem + legenda
    ↓
[8] Meta Graph API → Agenda Instagram
    ↓
✅ 28 POSTS AGENDADOS AUTOMATICAMENTE
```

---

## 🚀 SETUP INICIAL (FAZER 1 VEZ)

### **PASSO 1: Instalar dependências localmente**

```bash
cd automation
npm install
```

### **PASSO 2: Configurar Gemini AI (Google)**

1. Acesse: https://makersuite.google.com/app/apikey
2. Clique "Get API Key"
3. Copie a chave
4. Crie arquivo `.env`:
   ```bash
   cp .env.example .env
   ```
5. Cole a chave:
   ```
   GEMINI_API_KEY=AIzaSy...
   ```

### **PASSO 3: Configurar Google Drive**

1. Acesse: https://console.cloud.google.com/
2. Crie projeto: "Prismatic Instagram"
3. Ative **Google Drive API**
4. Vá em **Credentials > Create > Service Account**:
   - Nome: `instagram-automation`
   - Role: `Editor`
5. Clique na Service Account criada
6. **Keys > Add Key > Create new key > JSON**
7. Baixa arquivo JSON
8. Abra o JSON e copie **TODO conteúdo** (1 linha só)
9. Cole no `.env`:
   ```
   GOOGLE_DRIVE_CREDENTIALS='{"type":"service_account",...}'
   ```

### **PASSO 4: Configurar Make.com**

1. Acesse: https://www.make.com/ (crie conta FREE)
2. Create new Scenario
3. Adicione módulo: **Webhooks > Custom webhook**
4. Clique **Create a webhook**
5. Copie a URL gerada
6. Cole no `.env`:
   ```
   MAKE_WEBHOOK_URL=https://hook.us1.make.com/xxx
   ```
7. Continue configurando scenario (veja seção abaixo)

### **PASSO 5: Configurar GitHub Secrets**

1. Vá em: https://github.com/Hoffmannss/prismatic-labs-2026/settings/secrets/actions
2. Clique **New repository secret**
3. Adicione 3 secrets:

   **Secret 1:**
   - Name: `GEMINI_API_KEY`
   - Value: [sua chave Gemini]

   **Secret 2:**
   - Name: `GOOGLE_DRIVE_CREDENTIALS`
   - Value: [JSON Service Account completo]

   **Secret 3:**
   - Name: `MAKE_WEBHOOK_URL`
   - Value: [URL webhook Make.com]

---

## 🎨 CONFIGURAR MAKE.COM SCENARIO

### **Blueprint completo:**

```
[1] WEBHOOK TRIGGER
    ↓ Recebe: {month, drive_folder, posts[]}
    ↓
[2] ITERATOR
    ↓ Para cada post em posts[]
    ↓
[3] HTTP - Download imagem
    URL: {{post.image_url}}
    ↓
[4] HTTP - Download legenda
    URL: {{post.caption_url}}
    ↓
[5] TEXT PARSER - Ler legenda
    ↓
[6] SLEEP 2 segundos
    (evitar rate limit)
    ↓
[7] HTTP - Instagram Create Container
    Endpoint: https://graph.facebook.com/v18.0/{instagram-account-id}/media
    Method: POST
    Body:
      image_url: {{module3.data}}
      caption: {{module5.text}}
      access_token: {seu_token}
    ↓
[8] SET VARIABLE
    container_id: {{module7.id}}
    ↓
[9] SLEEP 30 segundos
    (Instagram precisa processar)
    ↓
[10] HTTP - Instagram Publish
    Endpoint: https://graph.facebook.com/v18.0/{instagram-account-id}/media_publish
    Method: POST
    Body:
      creation_id: {{container_id}}
      access_token: {seu_token}
    ↓
[11] GOOGLE SHEETS - Log
    Registra: Data, Post #, Status, Link
```

### **Obter Instagram Access Token:**

1. Acesse: https://developers.facebook.com/
2. Crie App tipo "Business"
3. Adicione produto **Instagram**
4. Gere token com permissões:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
5. Use **Graph API Explorer** para testar
6. Cole token no Make.com

---

## ▶️ COMO USAR

### **OPÇÃO A - Manual (você dispara)**

1. Acesse: https://github.com/Hoffmannss/prismatic-labs-2026/actions
2. Clique em **Instagram Content Automation**
3. **Run workflow**
4. Preencha:
   - Mês: `Fevereiro`
   - Ano: `2026`
   - Posts: `28`
5. Clique **Run workflow**
6. Aguarde ~20 minutos
7. Verifique Instagram agendado

### **OPÇÃO B - Automática (sozinho todo mês)**

Já configurado! Todo dia **25 às 20h** roda automaticamente.

Para desativar:
```yaml
# Edite: .github/workflows/instagram-automation.yml
# Comente a linha:
# schedule:
#   - cron: '0 23 25 * *'
```

---

## 📊 CRONOGRAMA DE PUBLICAÇÃO

Make.com distribui automaticamente os 28 posts em:

| Dia da Semana | Horários | Tipo de Conteúdo |
|---------------|----------|--------------------|
| **Segunda** | 10h, 19h | Educacional + Story |
| **Terça** | 14h | Dica rápida |
| **Quarta** | 10h, 17h | Social Proof + Story |
| **Quinta** | 14h | Educacional |
| **Sexta** | 10h, 19h | CTA Vendas + Urgência |
| **Sábado** | 11h | Inspiração |
| **Domingo** | 19h | CTA Forte |

**Resultado:** 4-5 posts/semana = 28 posts/mês

---

## 🛠️ TESTAR LOCALMENTE

```bash
cd automation

# Testar script por script:
npm run generate:topics
npm run generate:html
npm run generate:screenshots
npm run generate:captions
npm run upload:drive
npm run trigger:make

# Ou rodar tudo de uma vez:
npm run run:all
```

---

## 📝 ESTRUTURA DE ARQUIVOS

```
automation/
├── scripts/
│   ├── 1-generate-topics.js    # Gemini: gera tópicos
│   ├── 2-create-html.js         # Cria HTMLs
│   ├── 3-screenshots.js         # Puppeteer: screenshots
│   ├── 4-generate-captions.js   # Gemini: legendas
│   ├── 5-upload-drive.js        # Google Drive upload
│   └── 6-trigger-make.js        # Webhook Make.com
├── generated/               # Output (gitignored)
│   ├── topics-fevereiro.json
│   ├── html/
│   ├── images/
│   ├── captions/
│   └── drive-mapping.json
├── package.json
├── .env.example
└── README.md                # Este arquivo
```

---

## ❓ TROUBLESHOOTING

### **Erro: "GEMINI_API_KEY não configurada"**
- Verifique `.env` local OU GitHub Secrets
- Confirme chave válida em: https://makersuite.google.com/app/apikey

### **Erro: "Google Drive authentication failed"**
- JSON Service Account está correto?
- Google Drive API está ativada no projeto?
- Service Account tem permissão `Editor`?

### **Erro: "Puppeteer cannot launch browser"**
- GitHub Actions: já inclui dependências
- Local Linux: `sudo apt-get install -y chromium-browser`
- Local Mac: `brew install chromium`

### **Make.com não recebe webhook**
- Teste URL diretamente:
  ```bash
  curl -X POST https://hook.us1.make.com/xxx \
    -H "Content-Type: application/json" \
    -d '{"test": true}'
  ```
- Verifique logs em Make.com > Scenario > History

### **Posts não aparecem no Instagram**
- Access Token expirado? Gere novo
- Conta Instagram é **Business** ou **Creator**?
- Permissões: `instagram_content_publish` ativa?

---

## 💰 CUSTOS (TUDO FREE ATÉ R$500/MÊS)

| Serviço | Plano | Limite FREE | Custo Atual |
|---------|-------|-------------|-------------|
| **GitHub Actions** | FREE | 2000 min/mês | ~60 min/mês |
| **Gemini AI** | FREE | 60 req/min | ~56 req/mês |
| **Google Drive** | FREE | 15 GB | ~500 MB/mês |
| **Make.com** | FREE | 1000 ops/mês | ~300 ops/mês |
| **Meta Graph API** | FREE | Ilimitado | R$ 0 |
| **TOTAL** | **R$ 0/mês** | ✅ Dentro limites | **100% FREE** |

---

## 🚀 PRÓXIMOS PASSOS (OTIMIZAÇÕES)

- [ ] A/B testing automático de hooks
- [ ] Análise sentimento comentários
- [ ] Resposta automática DMs (quando >10 leads/sem)
- [ ] Integração Notion CRM
- [ ] Dashboard métricas tempo real

---

## 📞 SUPORTE

Problemas? Abra issue:
https://github.com/Hoffmannss/prismatic-labs-2026/issues

Ou contate:
- Email: Hoffmanns_@hotmail.com
- Instagram: @labs.prismatic

---

Última atualização: 24/01/2026  
Versão: 1.0.0  
Status: ✅ **PRONTO PARA USO**
