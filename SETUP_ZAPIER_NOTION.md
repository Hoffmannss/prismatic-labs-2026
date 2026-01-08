# ⚡ SETUP COMPLETO: ZAPIER FREE + NOTION + OUTLOOK

**Data:** 08/01/2026  
**Versão:** 1.0  
**Status:** Pronto para implementar  

---

## 🎯 O QUE VOCÊ VAI CONSEGUIR

✅ **Automação 100% funcional no Zapier FREE:**
- Formspree (site) → Notion (automaticamente)
- Sem precisar estar com PC ligado
- Funciona 24/7 na nuvem

✅ **Gerenciamento centralizado no Notion:**
- Todos os leads em um só lugar
- Histórico completo de interações
- Status, prioridades e tags

✅ **Email no Outlook:**
- Sincronização manual (por enquanto)
- Templates prontos para responder
- Follow-ups agendados

---

## 📋 PRÉ-REQUISITOS

**Você já tem:**
- ✅ Email: Hoffmanns_@hotmail.com (Outlook)
- ✅ Site portfolio: https://hoffmannss.github.io/prismatic-labs-2026/05-PORTFOLIO/
- ✅ Formspree: Já configurado no site
- ✅ GitHub: Conta ativa

**Você precisa criar:**
- ⏳ Notion: Workspace + Database
- ⏳ Zapier: Conta FREE + Zap configurado

---

## 🚀 PASSO 1: CRIAR WORKSPACE NOTION

### 1.1 Acessar Notion
```
1. Vá para https://notion.so
2. Clique em "Criar novo workspace" (ou acesse seu perfil → Create new workspace)
3. Escolha um nome
```

### 1.2 Nome do Workspace
```
Nome: PRISMATIC LABS
Descrição: Hub central para leads, clientes e operações
Ícone: 🔮
```

### 1.3 Copiar ID do Workspace
```
Quando criado, URL será:
https://www.notion.so/PRISMATIC-LABS-[WORKSPACE-ID]

Copie o [WORKSPACE-ID] para usar depois
```

---

## 📊 PASSO 2: CRIAR DATABASE "CLIENTES - CONTATOS"

### 2.1 Criar Database Manualmente

**No Notion:**
1. Clique em "+" e selecione "Database"
2. Escolha "Table"
3. Nome: `Clientes - Contatos`

### 2.2 Adicionar Campos

**Copie exatamente estes campos:**

| # | Campo | Tipo | Obrigatório | Notas |
|---|-------|------|------------|-------|
| 1 | **Nome** | Text | ✅ | Título principal |
| 2 | **Email** | Email | ✅ | Para contato |
| 3 | **Telefone** | Phone Number | ✅ | WhatsApp |
| 4 | **Empresa** | Text | ❌ | Nome da empresa |
| 5 | **Cargo** | Text | ❌ | Posição |
| 6 | **Status** | Select | ✅ | Lead/Prospecto/Cliente/Inativo |
| 7 | **Fonte** | Select | ✅ | Site/LinkedIn/Email/Referência/Outro |
| 8 | **Tipo Projeto** | Select | ✅ | Landing Básica/Premium/Website/Consultoria |
| 9 | **Última Interação** | Date | ❌ | Último contato |
| 10 | **Próximo Follow-up** | Date | ❌ | Agendado para |
| 11 | **Valor Estimado** | Currency | ❌ | R$ |
| 12 | **Notas** | Text (Long) | ❌ | Observações |
| 13 | **Tags** | Multi-select | ❌ | VIP/Prioridade/Em Negociação |
| 14 | **Data Criação** | Date | ✅ | Quando adicionado |

### 2.3 Como Adicionar Cada Campo no Notion

**Passo a passo (faça para cada campo):**

1. Clique no botão "+" (adicionar propriedade)
2. Digite o nome do campo
3. Selecione o tipo (Text, Email, Phone, etc)
4. Clique em "Done"

**Exemplo: Adicionar campo "Status"**
```
1. Clique em "+" na tabela
2. Digite "Status"
3. Escolha tipo "Select"
4. Adicione opções:
   - 🟩 Lead (cor verde)
   - 🟨 Prospecto (cor amarelo)
   - 🟦 Cliente (cor azul)
   - ⬜ Inativo (cor cinza)
5. Clique "Done"
```

### 2.4 Configurar "Fonte" e "Tipo Projeto"

**Fonte:**
```
Opções:
- Site Portfolio
- LinkedIn
- Email Direto
- Referência
- Outro
```

**Tipo Projeto:**
```
Opções:
- Landing Page Básica
- Landing Page Premium
- Website Completo
- Consultoria
```

---

## 🔌 PASSO 3: CONFIGURAR ZAPIER FREE

### 3.1 Criar Conta Zapier

```
1. Vá para https://zapier.com
2. Clique em "Sign Up"
3. Email: Hoffmanns_@hotmail.com
4. Crie senha
5. Confirme email
```

### 3.2 Criar Novo Zap

```
1. No dashboard Zapier, clique "Create Zap"
2. Selecione:
   - Trigger App: Formspree
   - Action App: Notion
```

### 3.3 Configurar TRIGGER (Quando algo acontece)

**Seleção:**
```
App: Formspree
Trigger: New Submission
```

**Conexão:**
```
1. Clique "Connect a new account"
2. Autorize Formspree
3. Selecione seu formulário de portfolio
```

**Teste:**
```
1. Clique "Test trigger"
2. Formspree listará seus últimos formulários
3. Selecione um para teste
4. Clique "Use this record"
```

### 3.4 Configurar ACTION (Depois, crie no Notion)

**Seleção:**
```
App: Notion
Action: Create Database Item
```

**Conexão:**
```
1. Clique "Connect a new account"
2. Autorize Notion com sua conta
3. Selecione workspace: PRISMATIC LABS
4. Selecione database: Clientes - Contatos
```

**Mapeamento de Campos:**

Nesta parte, você conecta os campos do Formspree com os campos do Notion:

```
Formspree → Notion

name (formulário) → Nome (database)
email (formulário) → Email (database)
phone (formulário) → Telefone (database)
service (formulário) → Tipo Projeto (database)
message (formulário) → Notas (database)

Campos fixos (manual):
Status: Lead
Fonte: Site Portfolio
Data Criação: TODAY() (automático)
Última Interação: [deixe em branco]
```

### 3.5 Testar o Zap

```
1. Clique "Test & Review"
2. Zapier enviará um teste para Notion
3. Confirme que chegou:
   - Volte para Notion
   - Recarregue a página
   - Deve aparecer 1 registro novo
```

### 3.6 Publicar o Zap

```
1. Clique "Publish"
2. Defina nome: "Formspree → Notion Leads"
3. Ative o Zap (toggle deve estar ON)
4. Pronto! Agora funciona 24/7
```

---

## ✅ TESTAR A INTEGRAÇÃO

### Teste Completo:

```
1. Acesse seu site: https://hoffmannss.github.io/prismatic-labs-2026/05-PORTFOLIO/

2. Preencha formulário de teste:
   - Nome: "Teste Zapier"
   - Email: teste@email.com
   - Telefone: (48) 98458-0234
   - Tipo: "Landing Page Premium"
   - Mensagem: "Testando integração"

3. Clique em "Enviar Mensagem"

4. Aguarde 2-3 minutos (Zapier processa)

5. Abra Notion e recarregue:
   - Deve aparecer novo registro com dados do teste
   - Status: Lead
   - Fonte: Site Portfolio

6. Sucesso! ✅
```

---

## 📧 PASSO 4: GERENCIAMENTO DIÁRIO (MANUAL)

### 4.1 Rotina Matinal (10 min)

```
09:00 - OUTLOOK
1. Abrir inbox
2. Verificar emails novos
3. Ler emails de leads

09:05 - NOTION
1. Abrir database "Clientes - Contatos"
2. Filtrar por:
   - Status = Lead
   - Data Criação = Today
3. Revisar novos registros
4. Ler campos "Notas"

09:10 - PRIORIZAR
1. Marcar VIPs
2. Definir próximo follow-up
3. Anotar notas importantes
```

### 4.2 Responder Emails

**Use os templates abaixo (copie e cole no Outlook):**

#### Template 1: Primeiro Contato
```
Assunto: Obrigado pelo interesse! 👋

Olá [Nome],

Muito obrigado por preencher o formulário!

Vi que você está interessado em [Tipo Projeto].
Poderia me contar mais sobre seu projeto?

- Qual é o seu principal desafio?
- Qual é seu orçamento estimado?
- Qual é a data ideal para começar?

Fico à disposição para uma conversa sem compromisso via WhatsApp ou chamada.

Abração,
Hoffmann
Prismatic Labs
📱 (48) 98458-0234
```

#### Template 2: Follow-up (Após 48h sem resposta)
```
Assunto: Seguindo nossa conversa... 📞

Olá [Nome],

Vi que você não respondeu. Sem problemas!

Se ainda tiver interesse, posso fazer uma proposta.
Se não, tudo bem também. Fico por aqui caso mude de ideia.

Abração,
Hoffmann
```

#### Template 3: Proposta
```
Assunto: Proposta para [Nome] - [Tipo Projeto]

Olá [Nome],

Com prazer envio proposta baseada em nossas conversas:

📋 ESCOPO
- Ponto 1
- Ponto 2
- Ponto 3

💰 INVESTIMENTO
R$ [Valor]

📅 TIMELINE
- Início: [Data]
- Entrega: [Data]

Algo não ficou claro? Posso ajustar.

Abração,
Hoffmann
Prismatic Labs
```

### 4.3 Atualizar Notion

**Depois de responder email, atualize no Notion:**

```
1. Abra registro do cliente
2. Atualize:
   - Última Interação: Today
   - Próximo Follow-up: [Data calculada]
   - Status: Prospecto (se respondeu interessado)
   - Notas: [Resumo da conversa]
```

---

## 🔄 FLUXO VISUAL

```
┌──────────────────────────────────────┐
│ VISITANTE PREENCHE FORMULÁRIO       │
│ no site portfolio                   │
└────────────────┬─────────────────────┘
                 ↓
┌──────────────────────────────────────┐
│ FORMSPREE CAPTURA DADOS             │
│ (nome, email, telefone, tipo, msg)  │
└────────────────┬─────────────────────┘
                 ↓
         [ZAPIER AUTOMÁTICO]
         (2-3 minutos)
                 ↓
┌──────────────────────────────────────┐
│ NOTION CRIA NOVO REGISTRO           │
│ Status: Lead                         │
│ Fonte: Site Portfolio               │
│ Data: Today                         │
└────────────────┬─────────────────────┘
                 ↓
         [VOCÊ RECEBE NOTIFICAÇÃO]
         (opcional no Notion)
                 ↓
┌──────────────────────────────────────┐
│ VOCÊ MANUAL:                         │
│ 1. Lê email em Outlook               │
│ 2. Abre Notion                       │
│ 3. Atualiza status                   │
│ 4. Responde por email/WhatsApp       │
│ 5. Agenda próximo contato            │
└──────────────────────────────────────┘
```

---

## 📊 VISTA DO NOTION (O QUE VOCÊ VERÁ)

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTES - CONTATOS                              + Add Page  │
├─────────────────────────────────────────────────────────────┤
│ Nome │ Email │ Telefone │ Status │ Fonte │ Tipo │ Data     │
├─────────────────────────────────────────────────────────────┤
│ João │ jo... │ (48)9... │ 🟩Lead │ Site  │ Land │ Jan 08   │
│ Maria│ ma... │ (48)9... │ 🟨Pro  │ Link  │ Web  │ Jan 07   │
│ Pedr │ pe... │ (48)9... │ 🟦Cli  │ Ref   │ Land │ Jan 05   │
└─────────────────────────────────────────────────────────────┘

Clique em cada linha para ver:
- Notas completas
- Histórico de interações
- Próximo follow-up agendado
- Valor estimado
- Tags (VIP, Prioridade, etc)
```

---

## 🚀 QUANDO ATUALIZAR PARA ZAPIER PAID

**Quando atingir:**
- 20+ leads/mês → Considerar pagar Zapier
- Precisar de automações extras → Integração Outlook
- Querer follow-up automático → Sequências de email

**Custo:** R$ 70-150/mês (conforme volume)

**Benefícios:** Múltiplos Zaps, emails automáticos, SMS, etc.

---

## ❓ TROUBLESHOOTING

### Problema: Zapier não sincronizou

**Solução:**
```
1. Verifique se Formspree está conectado
2. Teste trigger manualmente em Zapier
3. Verifique permissões no Notion (workspace)
4. Aguarde 5 minutos (pode demorar)
5. Se não funcionar, delete Zap e crie novo
```

### Problema: Notion recebeu registro incompleto

**Solução:**
```
1. Verifique mapeamento de campos em Zapier
2. Garanta que tipos de dados correspondem
3. Recriar Zap com fields corretos
```

### Problema: Zapier gastou limite FREE

**Solução:**
```
1. Zapier FREE funciona até 100 tarefas/mês
2. Se ultrapassar:
   - Pause Zap por dias
   - Ou faça upgrade para pago
   - Ou delete Zap e crie novo mês
```

---

## 📞 SUPORTE

**Zapier:**
- Help: https://zapier.com/help
- Comunidade: https://community.zapier.com

**Notion:**
- Help: https://www.notion.so/help
- Guias: https://www.notion.so/guides

**Formspree:**
- Status: https://status.formspree.io
- Suporte: https://formspree.io/support

---

## ✅ CHECKLIST FINAL

```
[ ] Workspace Notion criado
[ ] Database "Clientes - Contatos" criada
[ ] Todos 14 campos adicionados
[ ] Conta Zapier criada
[ ] Zap "Formspree → Notion" configurado
[ ] Teste de integração realizado
[ ] Email de boas-vindas pronto
[ ] Rotina diária agendada
[ ] Templates salvos
[ ] Pronto para começar!
```

---

**Status:** ✅ Pronto para implementar agora!  
**Tempo de setup:** ~2-3 horas  
**Resultado:** Sistema automático 24/7 sem custos  

🚀 Boa sorte!
