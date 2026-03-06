# 🤖 Vendedor Automático — Guia de Setup Completo

> Prismatic Labs — Lead Normalizer API + Landing Pages

---

## PARTE 1 — Instalação (5 min)

### Pré-requisitos
- Node.js 18+ instalado (`node --version` para checar)
- Repositório clonado localmente

### Instalação de dependências
```bash
cd vendedor
npm install
```

### Verificar se funciona
```bash
node 5-orchestrator.js
```
Você deve ver o menu de ajuda com todos os comandos disponíveis.

---

## PARTE 2 — Configuração do .env (2 min)

Crie o arquivo `vendedor/.env` com:
```env
# API Key do LLM (verifique qual está sendo usado em 1-analyzer.js)
OPENAI_API_KEY=sk-...
# OU se usar OpenRouter:
OPENROUTER_API_KEY=sk-or-...
```

> **Dica:** Abra `vendedor/1-analyzer.js` e procure por `process.env.` para ver exatamente qual chave o sistema precisa.

---

## PARTE 3 — Produtos disponíveis

O vendedor agora conhece **2 produtos**:

| Produto | Tipo | Ticket |
|---|---|---|
| Lead Normalizer API | API SaaS | $29–$199/mês |
| Landing Page Premium | Serviço | R$1.497–R$5.997 |

O sistema detecta automaticamente qual produto oferecer baseado no nicho do lead.

---

## PARTE 4 — Workflow Diário (15 min/dia)

### Passo 1 — Encontrar leads (Instagram ou LinkedIn)

**Para a API**, procure contas que falam sobre:
- Make.com, n8n, Zapier, automação
- Tráfego pago, Meta Ads, geração de leads BR
- CRM (HubSpot, RD Station, Salesforce)
- Desenvolvimento, API, SaaS brasileiro

**Hashtags para prospectar:**
```
#makecom #n8n #automation #automacao #trafegopago
#metaads #crm #hubspot #rdstation #saas #devbr
```

### Passo 2 — Analisar o lead
```bash
node 5-orchestrator.js analyze @username "bio aqui" 5000 120
```
Substitua:
- `@username` → usuário do Instagram
- `"bio aqui"` → bio completa entre aspas
- `5000` → número de seguidores
- `120` → número de posts

O sistema vai:
1. Analisar o perfil e detectar o nicho
2. Escolher o produto certo (API ou LP)
3. Gerar a mensagem personalizada para copiar

### Passo 3 — Enviar a mensagem
Copie a mensagem gerada e envie no Instagram DM ou WhatsApp.

Depois marque como enviado:
```bash
node 5-orchestrator.js sent @username
```

### Passo 4 — Verificar follow-ups do dia
```bash
node 5-orchestrator.js followup
```
Faça isso **toda manhã**. O sistema indica quem precisa de follow-up com base nas datas.

### Passo 5 — Atualizar status quando lead responder
```bash
# Lead respondeu
node 5-orchestrator.js status @username respondeu

# Entrou em negociação
node 5-orchestrator.js status @username em_negociacao "quer o plano Starter"

# Fechou!
node 5-orchestrator.js status @username fechado "$29/mes - Starter"

# Não quis
node 5-orchestrator.js status @username perdido "achou caro"
```

### Passo 6 — Ver o relatório do pipeline
```bash
node 5-orchestrator.js report
```

---

## PARTE 5 — Setup Notion CRM (30 min)

### Criar o banco de dados no Notion

1. Abra o Notion → crie uma nova página chamada **"CRM - Prismatic Leads"**
2. Clique em `+ Add a database` → `Table`
3. Crie as colunas abaixo:

| Coluna | Tipo | Notas |
|---|---|---|
| Nome/Handle | Title | Username do Instagram |
| Status | Select | prospectar / contatado / respondeu / em_negociacao / fechado / perdido |
| Produto | Select | lead_normalizer_api / landing_page |
| Nicho | Text | ex: automação, tráfego pago |
| Score | Number | Score gerado pelo analyzer |
| Mensagem Enviada | Date | Quando foi contatado |
| Próximo Follow-up | Date | Data calculada automaticamente |
| Valor | Number | Valor do deal |
| Notas | Text | Observações da conversa |

4. Crie uma View `Kanban` agrupada por **Status** para visualizar o pipeline.

> **Integração futura:** O `3-cataloger.js` pode ser atualizado para escrever direto no Notion via API. Por ora, use o arquivo JSON local como fonte de dados e espelhe no Notion manualmente os leads que avançarem no pipeline.

---

## PARTE 6 — Meta de prospecção diária

| Métrica | Meta |
|---|---|
| Leads analisados/dia | 5–10 |
| Mensagens enviadas/dia | 5–10 |
| Follow-ups/dia | Todos os que o sistema indicar |
| Taxa resposta esperada | ~10–20% |
| Taxa conversão esperada | ~5–10% de quem responde |

**Com 7 mensagens/dia × 20 dias úteis = 140 prospecções/mês**
→ ~14–28 respostas
→ ~1–3 fechamentos/mês
→ **$29–$237/mês recorrente por mês de trabalho consistente**

---

## PARTE 7 — Comandos de referência rápida

```bash
# Analisar novo lead
node 5-orchestrator.js analyze @usuario "bio" seguidores posts

# Marcar como enviado
node 5-orchestrator.js sent @usuario

# Checar followups do dia
node 5-orchestrator.js followup

# Atualizar status
node 5-orchestrator.js status @usuario [status] "nota"

# Ver pipeline completo
node 5-orchestrator.js report

# Listar por status
node 5-orchestrator.js list em_negociacao
```

---

## PARTE 8 — Troubleshooting

**Erro: `Cannot find module`**
→ Rode `npm install` dentro da pasta `vendedor/`

**Erro: `API key not found`**
→ Crie o arquivo `.env` conforme a Parte 2

**Mensagem genérica demais**
→ Passe mais contexto na bio: `analyze @user "faz automação com Make.com para agências" 3000 80`

**Lead não classificado corretamente**
→ Verifique se o nicho está em `vendedor/config/nichos-config.json` e adicione keywords relevantes
