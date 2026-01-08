# 📊 GUIA DE GERENCIAMENTO DE LEADS

## 🔄 Fluxo Completo de Captura

```
Visitante Preenche Formulário
    ↓
Formspree Recebe Dados
    ↓
Email Automático para Hoffmanns_@hotmail.com
    ↓
Você Manual: Copia Dados → Notion Database
    ↓
Notion CRM: Gerencia Status + Follow-up
    ↓
Entre em Contato via WhatsApp
```

---

## 1️⃣ **FORMSPREE - Captura de Dados**

### ✅ JÁ CONFIGURADO

O formulário do portfolio já está enviando para:
- **Email**: Hoffmanns_@hotmail.com
- **Endpoint Formspree**: `https://formspree.io/f/xyzaybpq`

### 📨 O que você receberá por email:

```
Nome: João Silva
Email: joao@email.com
Telefone: (11) 9 8765-4321
Tipo de Projeto: landing-premium
Mensagem: Quero uma landing page para meu curso...
Timestamp: 08/01/2026 14:30:00
```

### ⚙️ Se precisar mudar o email:

1. Acesse [formspree.io](https://formspree.io)
2. Crie uma conta com seu email
3. Crie um novo form
4. Copie o endpoint `https://formspree.io/f/[ID]`
5. Atualize no `index.html` - linha 363:
   ```html
   action="https://formspree.io/f/[SEU_ID_AQUI]"
   ```

---

## 2️⃣ **NOTION - CRM de Leads**

### 🎯 Setup Recomendado

**Crie um novo Notion Database com essas propriedades:**

| Propriedade | Tipo | Descrição |
|-------------|------|----------|
| **Nome** | Title | Nome do lead |
| **Email** | Email | E-mail para contato |
| **Telefone** | Text | WhatsApp |
| **Projeto** | Select | landing-basica / landing-premium / website / consultoria |
| **Status** | Select | New → In Progress → Contacted → Proposal Sent → Closed Won |
| **Data Recebido** | Date | Quando chegou |
| **Data Contato** | Date | Quando você contatou |
| **Valor Estimado** | Number | R$ |
| **Notas** | Text | Observações |
| **Prioridade** | Select | 🔴 Alta / 🟡 Média / 🟢 Baixa |

### 📋 Passo a Passo:

1. Abra [Notion.so](https://notion.so)
2. Clique em "+ Add a page"
3. Selecione "Database"
4. Escolha "Table"
5. Nomeie como "Prismatic Labs - Leads 2026"
6. Adicione as propriedades acima
7. Guarde o link para acessar sempre

### 🔄 Fluxo de Status:

```
🟦 NEW (Novo)
   ↓ (Você recebe email do Formspree)
   
🟨 IN PROGRESS (Em análise)
   ↓ (Você analisa se é lead qualificado)
   
🟪 CONTACTED (Contatado)
   ↓ (Você enviou mensagem WhatsApp)
   
🟩 PROPOSAL SENT (Proposta enviada)
   ↓ (Cliente está analisando)
   
✅ CLOSED WON (Fechado/Ganho)
   ↓ (Cliente aceitou!)
   
❌ CLOSED LOST (Recusado)
   (Cliente não interessado)
```

---

## 3️⃣ **PROCESSO DE FOLLOW-UP**

### 📱 Seu Checklist Diário:

**Manhã (9h):**
- [ ] Verificar emails do Formspree
- [ ] Adicionar novos leads ao Notion
- [ ] Mover para "IN PROGRESS"
- [ ] Marcar como "CONTACTED" se WhatsApp já foi enviado

**Tarde (17h):**
- [ ] Revisar leads em "PROPOSAL SENT"
- [ ] Enviar follow-up para os que estão pendentes
- [ ] Atualizar status no Notion

### 🎯 Templates de Mensagem WhatsApp:

**Primeiro Contato:**
```
Olá [Nome]!

Recebi sua solicitação no site da Prismatic Labs. 🎨

Vi que você está interessado em [landing-premium/website/etc].

Gostaria de agendar uma conversa rápida (30 min) para entender melhor seu projeto?

Disponibilidades esta semana:
- Terça 14h-15h
- Quarta 16h-17h
- Quinta 10h-11h

Me confirma se algum horário funciona!

Abs,
Prismatic Labs
```

**Follow-up (após 2 dias sem resposta):**
```
Olá [Nome], tudo bem?

Só passando para confirmar se chegou minha mensagem anterior.

Estou aqui para ajudar seu projeto a atingir 40%+ de conversão. 🚀

Qual melhor horário para conversar?

Abs
```

---

## 4️⃣ **INTEGRAÇÕES FUTURAS**

### 🔮 Próximas Melhorias:

- [ ] **Zapier** para conectar Formspree → Notion automaticamente
- [ ] **N8N** self-hosted para automações avançadas
- [ ] **Twilio** para receber confirmação via SMS
- [ ] **Google Sheets** como backup dos dados
- [ ] **Calendly** integrado no site para agendar direto

### ⚡ Comando Zapier (Quando Implementar):

```
Trigger: Formspree Email Recebido
    ↓
Action: Criar entrada no Notion Database
    ↓
Action: Enviar Email com dados
```

---

## 5️⃣ **ANÁLISE DE DADOS**

### 📊 Métricas para Acompanhar:

- **Taxa de Conversão**: (Leads / Visitantes)
- **Tempo Médio de Resposta**: Quantas horas até seu primeiro contato
- **Taxa de Resposta**: Quantos leads responderam no WhatsApp
- **Taxa de Qualificação**: Quantos viraram clientes
- **Valor Médio de Projeto**: Preço médio que seus clientes fecham
- **Lead Score**: Priorizar leads com maior potencial

### 🎯 Dashboard Notion (Recomendado):

Crie uma dashboard com:
- Total de leads por semana
- Status distribution (pie chart)
- Value pipeline (quanto em propostas)
- Response time (velocidade)

---

## 🚀 RESUMO RÁPIDO

| Ação | Ferramenta | Status |
|------|-----------|--------|
| Capturar Dados | ✅ Formspree | PRONTO |
| Receber Email | ✅ Hoffmanns_@hotmail.com | PRONTO |
| Armazenar Leads | ⏳ Notion (Manual) | SETUP NECESSÁRIO |
| Follow-up | 📱 WhatsApp Manual | MANUAL |
| Automação Completa | 🔄 Zapier/N8N | FUTURA |

---

## ❓ PRÓXIMAS PERGUNTAS

1. **Quer que eu crie um template Notion pronto?** Posso te passar o link para duplicar.
2. **Quer configurar Zapier?** Posso guiar o setup passo a passo.
3. **Quer adicionar Calendly?** Integra agendamento automático.
4. **Quer analytics avançado?** Posso adicionar Google Analytics.

---

**Última atualização**: 08/01/2026  
**Versão**: 1.0
