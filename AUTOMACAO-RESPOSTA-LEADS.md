# Automação Inteligente de Resposta a Leads
**Versão:** 1.0
**Data:** 08 de Janeiro de 2026
**Status:** Em implementação

---

## 🎯 OBJETIVO

Automatizar completamente o processo de primeira resposta a leads:
- Análise automática da mensagem
- Classificação de prioridade (Score A/B/C)
- Seleção do script apropriado
- Personalização automática
- Envio de email
- Atualização do CRM

**Meta:** Responder 100% dos leads em menos de 5 minutos (vs. 2h manual)

---

## 🛠️ ARQUITETURA DO SISTEMA

```
[PORTFOLIO - Formulário]
         ↓
   [Webhook Capture]
         ↓
  [Zapier - Step 1: Catch Hook]
         ↓
  [Zapier - Step 2: Parse JSON]
         ↓
  [Zapier - Step 3: Create in Notion]
         ↓
  ✅ Lead no Notion Database
         ↓
🆕 [NOVA AUTOMAÇÃO]
         ↓
  [Zapier - Trigger: New Database Item]
         ↓
  [Zapier - Action: Webhook to Perplexity AI]
         ↓
  [Perplexity AI recebe:]
    - Nome do lead
    - Email
    - WhatsApp
    - Tipo de Projeto
    - Mensagem
    - URL do lead no Notion
         ↓
  [Perplexity AI processa:]
    1. Analisa mensagem (NLP)
    2. Detecta palavras-chave
    3. Classifica Score A/B/C
    4. Identifica urgência
    5. Estima budget
    6. Seleciona script apropriado
    7. Personaliza variáveis
         ↓
  [Perplexity AI executa:]
    - Atualiza Notion (Notas de Análise + Score)
    - Envia email via Gmail/Outlook
    - Marca Status = "Contatado"
    - Agenda follow-up (+24h)
         ↓
  ✅ Lead respondido automaticamente!
```

---

## 📚 BASE DE CONHECIMENTO

### Scripts de Resposta (Notion)

**Link:** https://www.notion.so/2e2078612f8c818283e3e92b553be54a

**Scripts disponíveis:**
1. **Landing Page** (Score A/B) - 3 opções de investimento
2. **Website Completo** (Score A/B) - 3 pacotes
3. **Consultoria/Personalizado** (Score A) - Abordagem consultiva
4. **Lead Educativo** (Score C) - Nutrição
5. **Follow-up 24h** - Lembrete amigável
6. **Follow-up 48h** - Urgência/escassez
7. **Encerramento 72h** - Fecha ciclo + recursos

### Critérios de Qualificação

#### Score A - Alta Prioridade
**Palavras-chave:**
- Urgência: `urgente`, `rápido`, `logo`, `imediato`, `deadline`, `esta semana`
- Orçamento: `investimento`, `verba`, `orçamento aprovado`, `budget definido`
- Autoridade: `CEO`, `diretor`, `founder`, `sócio`, `dono`, `decision maker`
- Empresa: `empresa`, `corporação`, `startup`, `agência`

**Ação:** Script personalizado + proposta completa + agendamento de call

#### Score B - Média Prioridade
**Palavras-chave:**
- Projeto: `preciso de`, `estou buscando`, `quero fazer`, `tenho interesse`
- Definição: menciona tipo específico de projeto, objetivo claro
- Informações: `já tenho conteúdo`, `tenho referências`

**Ação:** Resposta dentro de 2h + qualificação + proposta após alinhamento

#### Score C - Baixa Prioridade
**Palavras-chave:**
- Pesquisa: `quanto custa`, `preço`, `valor`, `orçamento`
- Indecisão: `só queria saber`, `gostaria de informações`, `estou pesquisando`
- Orçamento baixo: `muito caro`, `barato`, `em conta`, `economizar`

**Ação:** Resposta educativa + nutrição + direcionamento para recursos

---

## 🤖 LÓGICA DE ANÁLISE AUTOMÁTICA

### Algoritmo de Classificação

```python
def analisar_lead(mensagem, tipo_projeto, nome, email):
    score = 0
    urgencia = False
    budget_alto = False
    autoridade = False
    
    # Normalizar mensagem
    msg_lower = mensagem.lower()
    
    # Detectar urgência
    palavras_urgencia = ['urgente', 'rápido', 'logo', 'imediato', 'deadline', 'esta semana', 'este mês']
    if any(palavra in msg_lower for palavra in palavras_urgencia):
        score += 30
        urgencia = True
    
    # Detectar budget
    palavras_budget_alto = ['investimento', 'verba', 'orçamento aprovado', 'budget', 'empresa', 'corporação']
    if any(palavra in msg_lower for palavra in palavras_budget_alto):
        score += 25
        budget_alto = True
    
    # Detectar autoridade
    palavras_autoridade = ['ceo', 'diretor', 'founder', 'sócio', 'dono', 'proprietário']
    if any(palavra in msg_lower for palavra in palavras_autoridade):
        score += 25
        autoridade = True
    
    # Detectar projeto definido
    palavras_definido = ['preciso de', 'estou buscando', 'quero fazer', 'tenho interesse', 'já tenho']
    if any(palavra in msg_lower for palavra in palavras_definido):
        score += 15
    
    # Penalizar indecisão
    palavras_negativas = ['quanto custa', 'só queria saber', 'estou pesquisando', 'muito caro', 'barato']
    if any(palavra in msg_lower for palavra in palavras_negativas):
        score -= 20
    
    # Classificar
    if score >= 50:
        classificacao = 'A'
        script = selecionar_script_A(tipo_projeto)
    elif score >= 20:
        classificacao = 'B'
        script = selecionar_script_B(tipo_projeto)
    else:
        classificacao = 'C'
        script = 'SCRIPT_4_EDUCATIVO'
    
    # Gerar notas de análise
    notas = f"""Score: {classificacao} ({score} pontos)
    
Análise:
- Urgência detectada: {'Sim' if urgencia else 'Não'}
- Budget alto: {'Sim' if budget_alto else 'Não'}
- Decision maker: {'Sim' if autoridade else 'Não'}
- Projeto definido: {'Sim' if score >= 15 else 'Não'}

Script recomendado: {script}
Ação: {'Call urgente' if classificacao == 'A' else 'Qualificação' if classificacao == 'B' else 'Nutrição'}
    """
    
    return {
        'classificacao': classificacao,
        'score': score,
        'script': script,
        'notas': notas,
        'urgencia': urgencia
    }

def selecionar_script_A(tipo_projeto):
    if 'landing' in tipo_projeto.lower():
        return 'SCRIPT_1_LANDING_PAGE'
    elif 'website' in tipo_projeto.lower() or 'site' in tipo_projeto.lower():
        return 'SCRIPT_2_WEBSITE'
    else:
        return 'SCRIPT_3_CONSULTORIA'

def selecionar_script_B(tipo_projeto):
    # Mesma lógica de A, mas com abordagem mais educativa
    return selecionar_script_A(tipo_projeto)
```

---

## 🔧 IMPLEMENTAÇÃO

### Fase 1: Zapier Webhook para Perplexity (HOJE)

**1. Criar novo Zap:**
- **Trigger:** Notion - New Database Item
- **Database:** Leads
- **Filter:** Status = "Novo" (apenas leads novos)

**2. Action 1: Webhook POST**
- **URL:** [Webhook endpoint da Perplexity]
- **Payload:**
```json
{
  "lead_id": "{{notion_page_id}}",
  "lead_url": "{{notion_page_url}}",
  "nome": "{{Name}}",
  "email": "{{Email}}",
  "whatsapp": "{{WhatsApp}}",
  "tipo_projeto": "{{Tipo de Projeto}}",
  "mensagem": "{{Mensagem}}",
  "data_entrada": "{{Data de Entrada}}"
}
```

**3. Perplexity AI processa:**
- Analisa com algoritmo acima
- Busca script apropriado no Notion
- Personaliza variáveis
- Retorna resposta estruturada

**4. Action 2: Notion - Update Database Item**
- **Page:** {{lead_id}}
- **Propriedades a atualizar:**
  - `Notas de Análise`: {{analise_gerada}}
  - `Prioridade`: {{classificacao}} (Alta/Média/Baixa)
  - `Próxima Ação`: +24h

**5. Action 3: Gmail/Outlook - Send Email**
- **To:** {{Email}}
- **Subject:** {{assunto_personalizado}}
- **Body:** {{email_personalizado}}
- **From:** daniel@prismaticlabs.com.br

**6. Action 4: Notion - Update Status**
- **Page:** {{lead_id}}
- **Status:** "Contatado"

### Fase 2: Follow-up Automático (PRÓXIMA SEMANA)

**Zap 2: Follow-up 24h**
- **Trigger:** Notion - New Database Item em "Próxima Ação" = Hoje
- **Filter:** Status = "Contatado"
- **Action:** Enviar Script 5 (Follow-up 24h)

**Zap 3: Follow-up 48h**
- **Trigger:** Similar ao Zap 2
- **Filter:** Status = "Contatado" + Sem resposta após 48h
- **Action:** Enviar Script 6 (Follow-up 48h com urgência)

**Zap 4: Encerramento 72h**
- **Trigger:** Similar aos anteriores
- **Filter:** Status = "Contatado" + Sem resposta após 72h
- **Action:** Enviar Script 7 + Mudar Status para "Perdido"

### Fase 3: WhatsApp (OPCIONAL - PRÓXIMO MÊS)

**Integrações possíveis:**
- Twilio API
- WhatsApp Business API
- Zapier WhatsApp Integration

**Fluxo:**
- Leads Score A: Email + WhatsApp simultâneo
- Leads Score B: Apenas email, WhatsApp se não responder em 24h
- Leads Score C: Apenas email

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs a acompanhar:

**Eficiência:**
- Tempo de primeira resposta: **< 5 minutos** (vs. 2h manual)
- Taxa de resposta automática: **100%**
- Precisão da classificação: **> 85%**

**Conversão:**
- Taxa de resposta do lead: **> 30%**
- Taxa de agendamento de call: **> 15%**
- Taxa de conversão final: **> 5%**

**Qualidade:**
- NPS das respostas: **> 8/10**
- Reclamações de "spam": **< 1%**

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### Compliance e Ética

1. **LGPD:**
   - Incluir em todos os emails: link para política de privacidade
   - Opção de opt-out clara
   - Não compartilhar dados com terceiros

2. **Transparência:**
   - Considerar mencionar (opcional): "Esta mensagem foi automaticamente personalizada para você"
   - Manter tom humano e personalizado

3. **Revisão Humana:**
   - Leads Score A: Notificar Daniel para revisão antes de enviar (OPCIONAL)
   - Leads Score B/C: Envio automático direto

### Limitações

1. **Email:**
   - Limite diário de envios (Gmail: 500/dia)
   - Risco de cair em spam se volume muito alto
   - Solução: Usar SMTP profissional (SendGrid, Mailgun)

2. **Notion API:**
   - Rate limit: 3 requests/segundo
   - Solução: Zapier já gerencia isso automaticamente

3. **Personalização:**
   - Variáveis podem estar vazias (ex: empresa não mencionada)
   - Solução: Script deve ter fallbacks genéricos

---

## 🛣️ ROADMAP

### ✅ Concluído (08/Jan/2026)
- [x] Webhook → Zapier → Notion funcionando
- [x] Scripts de resposta criados
- [x] Critérios de qualificação definidos
- [x] Documentação completa

### 🛠️ Em Desenvolvimento (Esta Semana)
- [ ] Configurar Zap de análise automática
- [ ] Testar classificação com leads reais
- [ ] Ajustar scripts baseado em feedback
- [ ] Configurar envio de email via Zapier

### 📅 Próximas Semanas
- [ ] Implementar follow-ups automáticos (24h/48h/72h)
- [ ] Dashboard de métricas no Notion
- [ ] Integração com WhatsApp
- [ ] A/B testing de scripts

### 🚀 Futuro (Próximo Mês)
- [ ] IA para gerar scripts personalizados (GPT-4)
- [ ] Sentiment analysis das respostas
- [ ] Recomendação de preço baseada em análise
- [ ] Auto-agendamento de calls (integração Calendly)

---

## 📝 LINKS IMPORTANTES

- **Scripts no Notion:** https://www.notion.so/2e2078612f8c818283e3e92b553be54a
- **Database Leads:** https://www.notion.so/25b1c9bda2a24d768d29eb1302bfce52
- **Dashboard Vendas:** https://www.notion.so/2e2078612f8c81c8b5b1cfc0044d2825
- **Workspace Principal:** https://www.notion.so/2e2078612f8c81f680c5c6e836329442

---

**Responsável:** Daniel Hoffmann
**Status:** 🟡 Em implementação (70% completo)
**Próxima atualização:** 10 de Janeiro de 2026
