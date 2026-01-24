# 🚀 SETUP MAKE.COM - AGENDAMENTO INSTAGRAM

## 🎯 O QUE ESTE SCENARIO FAZ

Recebe webhook do GitHub Actions com 28 posts prontos (imagens + legendas no Drive) e agenda automaticamente no Instagram seguindo cronograma estratégico.

**INPUT:** Webhook JSON com URLs Drive  
**OUTPUT:** 28 posts agendados Instagram (seg/qua/sex 10h, 14h, 17h, 19h)

---

## 🔧 SETUP PASSO A PASSO

### **1. CRIAR CONTA MAKE.COM (5min)**

```bash
# 1. Acessar
https://www.make.com/en/register

# 2. Plano FREE
- 1000 operações/mês
- Suficiente para 28 posts/mês
- Sem cartão crédito

# 3. Confirmar email
```

---

### **2. OBTER CREDENCIAIS META/INSTAGRAM (15min)**

#### **2.1 Criar App Meta**

```bash
# 1. Acessar Meta for Developers
https://developers.facebook.com/

# 2. My Apps > Create App
- Tipo: Business
- Nome: Prismatic Instagram Automation
- Email: seu_email@gmail.com

# 3. Criar
```

#### **2.2 Configurar Instagram API**

```bash
# 1. Dashboard App > Add Product
# 2. Escolher: Instagram Graph API > Set Up

# 3. Conectar Instagram Business Account
# (Se não tiver, criar em:
#  Instagram > Settings > Account Type > Switch to Professional Account > Business)

# 4. Vincular Página Facebook
# (Instagram Business precisa estar conectado a uma Página FB)
```

#### **2.3 Gerar Access Token**

```bash
# 1. Graph API Explorer
https://developers.facebook.com/tools/explorer/

# 2. Selecionar:
- App: Prismatic Instagram Automation
- User or Page: Sua página Facebook conectada ao Instagram

# 3. Permissões (Add Permissions):
- instagram_basic
- instagram_content_publish
- pages_read_engagement
- pages_manage_posts

# 4. Generate Access Token
# 5. COPIAR token gerado

# 6. Estender validade (60 dias → permanente)
# Graph API Explorer > Acessar Token:
https://developers.facebook.com/tools/debug/accesstoken/
# Clicar "Extend Access Token"
# Copiar NOVO token
```

#### **2.4 Obter Instagram Business Account ID**

```bash
# Graph API Explorer:
# Método: GET
# Endpoint: /me/accounts

# Resposta:
{
  "data": [
    {
      "id": "123456789",  # Página FB ID
      "instagram_business_account": {
        "id": "17841XXXXXXXXX"  # ← COPIAR ESTE!
      }
    }
  ]
}

# Salvar:
# INSTAGRAM_BUSINESS_ACCOUNT_ID = 17841XXXXXXXXX
# ACCESS_TOKEN = token_gerado_acima
```

---

### **3. CRIAR SCENARIO MAKE.COM (20min)**

#### **3.1 Novo Scenario**

```bash
# Make.com > Scenarios > Create a new scenario
```

#### **3.2 Adicionar Módulos (na ordem exata)**

---

**[1] WEBHOOK - Receber dados GitHub**

```yaml
Módulo: Webhooks > Custom webhook
Configuração:
  - Criar novo webhook
  - Nome: "GitHub Instagram Automation"
  - COPIAR URL gerada
  - Adicionar no GitHub Secrets como: MAKE_WEBHOOK_URL

Data structure:
  {
    "mes": "string",
    "ano": "number",
    "total_posts": "number",
    "drive_folder": "string",
    "posts": [
      {
        "id": "number",
        "image_url": "string",
        "caption_url": "string"
      }
    ]
  }
```

---

**[2] ITERATOR - Loop posts**

```yaml
Módulo: Flow Control > Iterator
Configuração:
  - Array: {{1.posts}}
  - (Mapeia cada post do webhook)
```

---

**[3] HTTP - Baixar legenda Drive**

```yaml
Módulo: HTTP > Make a request
Configuração:
  URL: {{2.caption_url}}
  Method: GET
  
Output:
  - Data: Texto da legenda
```

---

**[4] TOOLS - Calcular data agendamento**

```yaml
Módulo: Tools > Set variable
Configuração:
  Variable name: scheduled_date
  Variable value: 
    {{addDays(now; 2.id)}}
    # Post 1 = hoje + 1 dia
    # Post 2 = hoje + 2 dias
    # etc.

# Para cronograma mais avançado (seg/qua/sex):
# Usar: {{if(mod(2.id; 3) = 0; addDays(now; 2.id); addDays(now; 2.id + 1))}}
```

---

**[5] HTTP - Criar container Instagram**

```yaml
Módulo: HTTP > Make a request
Configuração:
  URL: https://graph.facebook.com/v21.0/{{INSTAGRAM_ID}}/media
  Method: POST
  
  Headers:
    Content-Type: application/json
  
  Body:
    {
      "image_url": "{{2.image_url}}",
      "caption": "{{3.data}}",
      "access_token": "{{ACCESS_TOKEN}}"
    }

Substituir:
  {{INSTAGRAM_ID}}: Seu Instagram Business Account ID
  {{ACCESS_TOKEN}}: Token gerado passo 2.3

Output:
  - id: Container ID (usado próximo passo)
```

---

**[6] SLEEP - Aguardar processing**

```yaml
Módulo: Flow Control > Sleep
Configuração:
  Delay: 30 seconds
  # Instagram precisa processar imagem antes de publicar
```

---

**[7] HTTP - Publicar/Agendar post**

```yaml
Módulo: HTTP > Make a request
Configuração:
  URL: https://graph.facebook.com/v21.0/{{INSTAGRAM_ID}}/media_publish
  Method: POST
  
  Body:
    {
      "creation_id": "{{5.id}}",
      "access_token": "{{ACCESS_TOKEN}}"
    }

# Para AGENDAR (não publicar imediatamente):
# Mudar endpoint para:
# https://graph.facebook.com/v21.0/{{INSTAGRAM_ID}}/content_publishing_limit

# E body:
    {
      "creation_id": "{{5.id}}",
      "published": false,
      "scheduled_publish_time": "{{timestamp(4.scheduled_date)}}",
      "access_token": "{{ACCESS_TOKEN}}"
    }
```

---

**[8] GOOGLE SHEETS - Log sucesso (OPCIONAL)**

```yaml
Módulo: Google Sheets > Add a row
Configuração:
  Spreadsheet: Instagram Automation Log
  Sheet: Posts
  
  Colunas:
    - Data: {{now}}
    - Post ID: {{2.id}}
    - Status: Agendado
    - Link: {{7.permalink}}
```

---

#### **3.3 Configurar Settings Scenario**

```yaml
Settings (engrenagem canto superior direito):
  - Max number of cycles: 30
  - Sequential processing: ON
  - (Garante posts agendados em ordem)
```

---

#### **3.4 Testar Scenario**

```bash
# 1. Make.com > Scenario > Run once

# 2. Enviar teste manual:
curl -X POST [WEBHOOK_URL] \
  -H "Content-Type: application/json" \
  -d '{
    "mes": "Teste",
    "ano": 2026,
    "total_posts": 1,
    "posts": [{
      "id": 1,
      "image_url": "https://drive.google.com/uc?id=XXX",
      "caption_url": "https://drive.google.com/uc?id=YYY"
    }]
  }'

# 3. Verificar:
# - Make.com: Execution history
# - Instagram: Creator Studio > Content Library
```

---

#### **3.5 Ativar Scenario**

```bash
# Toggle switch: OFF → ON
# Status: Active
```

---

## 📊 CRONOGRAMA ESTRATÉGICO (AVANÇADO)

Para agendar posts em dias/horários específicos (seg/qua/sex 10h, 14h, 19h):

### **Módulo 4 (Set Variable) - Versão Avançada**

```javascript
// Lógica JavaScript no Make.com

const postId = {{2.id}};
const startDate = new Date('2026-02-01'); // Primeiro dia do mês

// Dias da semana: 1=seg, 3=qua, 5=sex
const weekSchedule = [
  {day: 1, hours: [10, 14, 19]},  // Segunda
  {day: 3, hours: [10, 17, 19]},  // Quarta
  {day: 5, hours: [10, 14, 17]}   // Sexta
];

// Distribuir 28 posts em 4 semanas
const postsPerWeek = 7;
const weekNumber = Math.floor((postId - 1) / postsPerWeek);
const postInWeek = (postId - 1) % postsPerWeek;

// Calcular dia e hora
const scheduleIndex = postInWeek % weekSchedule.length;
const targetDay = weekSchedule[scheduleIndex].day;
const targetHour = weekSchedule[scheduleIndex].hours[
  Math.floor(postInWeek / weekSchedule.length)
];

// Montar data
const scheduledDate = new Date(startDate);
scheduledDate.setDate(startDate.getDate() + (weekNumber * 7) + targetDay);
scheduledDate.setHours(targetHour, 0, 0, 0);

return scheduledDate.toISOString();
```

**Resultado:**
- Semana 1: 7 posts (seg/qua/sex)
- Semana 2: 7 posts (seg/qua/sex)
- Semana 3: 7 posts
- Semana 4: 7 posts
- Total: 28 posts distribuídos estrategicamente

---

## 🛡️ TROUBLESHOOTING

### **Erro: Invalid access token**
```bash
Causa: Token expirado (60 dias)
Solução:
1. Graph API Explorer
2. Gerar novo token
3. Extend Access Token
4. Atualizar no Make.com
```

### **Erro: Image could not be downloaded**
```bash
Causa: URL Drive não pública
Solução:
1. Verificar permissões arquivo Drive
2. Usar formato: drive.google.com/uc?export=view&id=XXX
3. Testar URL no navegador anônimo
```

### **Erro: Rate limit exceeded**
```bash
Causa: Muitos posts rápido demais
Solução:
1. Aumentar Sleep para 60 segundos
2. Limite Instagram: 25 posts/hora
3. Scenario processar em 30-40min
```

### **Posts não aparecem Creator Studio**
```bash
Causa: Usando conta pessoal (não Business)
Solução:
1. Converter para Business Account
2. Conectar Página Facebook
3. Regenerar Access Token
```

---

## 📊 MÉTRICAS MAKE.COM

**Operações por execução (28 posts):**
- Webhook: 1 op
- Iterator: 28 ops
- HTTP baixar legenda: 28 ops
- HTTP criar container: 28 ops
- HTTP publicar: 28 ops
- Sleep: 0 ops (gratis)
- Google Sheets (opcional): 28 ops

**Total: ~141 operações**  
**Plano FREE: 1000 ops/mês**  
**Sobra: 859 ops (para testes, re-runs, etc)**

---

## ❓ FAQ

**P: Precisa pagar Make.com?**  
R: Não! Plano FREE suficiente (1000 ops).

**P: Precisa pagar Meta/Instagram API?**  
R: Não! API oficial gratuita ilimitada.

**P: Quanto tempo demora agendar 28 posts?**  
R: ~30-40min (30s sleep entre cada).

**P: Posso revisar antes publicar?**  
R: Sim! Posts ficam agendados no Creator Studio, você pode editar/deletar.

**P: Funciona para Reels/Stories?**  
R: Sim! Mudar endpoint para:
- Reels: /media com "media_type": "REELS"
- Stories: /media com "media_type": "STORIES"

---

## 🚀 PRÓXIMOS PASSOS

Após setup:

1. ✅ Copiar MAKE_WEBHOOK_URL
2. ✅ Adicionar GitHub Secret
3. ✅ Testar: Postman/Insomnia
4. ✅ Executar: GitHub Actions workflow
5. ✅ Conferir: Creator Studio

**Está pronto! 🎉**

---

*Criado: 24/01/2026*  
*Versão: 1.0.0*  
*Status: ✅ PRODUCTION READY*
