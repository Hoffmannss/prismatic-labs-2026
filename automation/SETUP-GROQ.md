# 🚀 SETUP GROQ API - 100% GRATUITO E SEM LIMITES

## 🎯 POR QUÊ GROQ?

**Problemas com Gemini:**
- ❌ Rate limits baixos (20-50 req/dia)
- ❌ Modelos instáveis/deprecados
- ❌ Erros 404/429 frequentes

**Vantagens Groq + Llama:**
- ✅ **100% GRATUITO** sem limites
- ✅ **10x mais rápido** que Gemini
- ✅ **API estável** e confiável
- ✅ **Qualidade excelente** (Llama 3.3 70B)
- ✅ **Sem rate limits** (uso razoável)

---

## 🔑 PASSO 1: OBTER API KEY GROQ (2 MINUTOS)

1. **Acesse:** https://console.groq.com/keys

2. **Crie conta:**
   - Clique "Sign Up"
   - Use email/Google/GitHub
   - **GRÁTIS** - sem cartão

3. **Gere API Key:**
   - Clique "Create API Key"
   - Nome: `Prismatic Instagram Automation`
   - **COPIE A KEY** (só aparece 1x)

4. **Formato:**
   ```
   gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## ⚙️ PASSO 2: CONFIGURAR LOCALMENTE

### **Opção A: Arquivo `.env` (desenvolvimento)**

```bash
cd automation

# Edite .env
nano .env

# Adicione (substitua pela sua key):
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Opção B: Testar setup**

```bash
cd automation
npm run test
```

Se aparecer "✅ Groq conectado", está funcionando!

---

## ☁️ PASSO 3: CONFIGURAR GITHUB ACTIONS

1. **Acesse repositório:**
   https://github.com/Hoffmannss/prismatic-labs-2026/settings/secrets/actions

2. **Clique "New repository secret"**

3. **Configure:**
   - **Name:** `GROQ_API_KEY`
   - **Secret:** `gsk_xxxxx...` (sua key)
   - Clique "Add secret"

4. **Verifique secrets:**
   - ✅ `GROQ_API_KEY`
   - ✅ `GOOGLE_DRIVE_CREDENTIALS_JSON`
   - ✅ `GOOGLE_DRIVE_FOLDER_ID`
   - ✅ `MAKE_WEBHOOK_URL`

---

## 🎯 PASSO 4: TESTAR WORKFLOW

1. **Acesse Actions:**
   https://github.com/Hoffmannss/prismatic-labs-2026/actions

2. **Clique "Instagram Automation"**

3. **Run workflow:**
   - Branch: `main`
   - Month: `Fevereiro`
   - Clique "Run workflow" (verde)

4. **Acompanhe execução (~5 min)**

5. **Resultado esperado:**
   ```
   ✅ ETAPA 1: Tópicos gerados (Llama 3.3 70B)
   ✅ ETAPA 2: HTML criado
   ✅ ETAPA 3: Screenshots gerados
   ✅ ETAPA 4: Legendas geradas (Llama 3.3 70B)
   ✅ ETAPA 5: Upload Google Drive
   ✅ ETAPA 6: Trigger Make.com
   ```

---

## 👍 VANTAGENS GROQ

| Recurso | Gemini | Groq |
|---------|--------|------|
| **Custo** | Grátis limitado | **Grátis ilimitado** |
| **Rate Limit** | 20-50 req/dia | **Sem limites** |
| **Velocidade** | ~5s/req | **~0.5s/req (10x)** |
| **Estabilidade** | ❌ Instável | **✅ Estável** |
| **Modelos** | Deprecados | **✅ Llama 3.3 70B** |
| **Qualidade** | Boa | **Excelente** |

---

## 🔧 TROUBLESHOOTING

### **Erro: "GROQ_API_KEY não configurada"**

```bash
# Verifique .env
cat automation/.env | grep GROQ

# Deve aparecer:
GROQ_API_KEY=gsk_xxxxx...
```

### **Erro: "401 Unauthorized"**

- Key inválida
- Gere nova key: https://console.groq.com/keys

### **Erro: "429 Too Many Requests"**

- Improvável (Groq é generoso)
- Aguarde 1 minuto e tente novamente

### **Workflow GitHub não funciona**

1. Verifique secret `GROQ_API_KEY` existe
2. Confirme valor correto (sem espaços)
3. Rode workflow novamente

---

## 📚 DOCUMENTAÇÃO GROQ

- **Website:** https://groq.com
- **Console:** https://console.groq.com
- **Docs:** https://console.groq.com/docs
- **Models:** https://console.groq.com/docs/models
- **Pricing:** GRÁTIS (uso razoável)

---

## ✅ PRONTO!

Agora você tem:
- ✅ Automação 100% funcional
- ✅ 100% gratuita sem limites
- ✅ 10x mais rápida
- ✅ Estável e confiável

**Próximos passos:**
1. Configure `GROQ_API_KEY` (GitHub + local)
2. Rode workflow
3. Verifique Google Drive
4. Posts agendados no Instagram!

🚀 **AUTOMAÇÃO COMPLETA!**
