# 🤖 AUTOMAÇÃO: Leads do Portfólio → Notion CRM

## ✅ Status: ATIVO E FUNCIONANDO
**Última atualização**: 08 de Janeiro de 2026

---

## 📋 Visão Geral

Automação completa que captura leads do formulário do portfólio da Prismatic Labs e registra automaticamente no CRM do Notion com todos os dados organizados.

### Fluxo:
```
Portfólio Website (Formulário)
    ↓ (webhook POST)
Zapier - Webhook Catcher
    ↓ (parse JSON)
Zapier - Code by Zapier
    ↓ (criar página)
Notion - Database "Leads"
    ↓
Lead pronto para atendimento!
```

---

## 🔧 Configuração Técnica

### 1. Webhook do Formulário
**Endpoint**: `https://hooks.zapier.com/hooks/catch/[ID]/[TOKEN]`

**Payload (JSON)**:
```json
{
  "name": "Nome do Lead",
  "email": "email@exemplo.com",
  "phone": "+5548999999999",
  "service": "Landing Page Básica",
  "message": "Mensagem do lead"
}
```

### 2. Zapier - Estrutura do Zap

#### Passo 1: Webhooks by Zapier - Catch Raw Hook
- **Trigger**: POST request
- **Captura**: Raw Body (JSON)
- **Teste**: Enviar formulário do portfolio

#### Passo 2: Code by Zapier - Run JavaScript
**Função**: Parsear JSON e separar campos individuais

```javascript
const body = JSON.parse(inputData.raw_body);

return {
  name: body.name || 'Sem nome',
  email: body.email || '',
  phone: body.phone || '',
  service: body.service || 'Não especificado',
  message: body.message || ''
};
```

**Input Data**:
- `raw_body`: {{1. Raw Body}} do webhook

**Output**:
- `name`, `email`, `phone`, `service`, `message` (campos individuais)

#### Passo 3: Notion - Create Data Source Item
**Database**: Leads (ID: `ad59ebbc-c27d-4d0c-be1d-905879733f60`)

**Mapeamento**:
| Campo Notion | Origem Zapier | Tipo |
|--------------|---------------|------|
| Name (Title) | `2. Name` | Texto |
| Email | `2. Email` | Texto |
| WhatsApp | `2. Phone` | Texto |
| Tipo de Projeto | `2. Service` | Texto |
| Mensagem | `2. Message` | Texto |
| Status | "Novo" (fixo) | Select |
| Prioridade | "Média" (fixo) | Select |
| Data de Entrada | `{{zap_meta_human_now}}` | Data |

---

## 🗄️ Estrutura do Database no Notion

### Campos:

| Campo | Tipo | Propósito | Preenchimento |
|-------|------|-----------|---------------|
| **Name** | Title | Nome do lead | Automático (Zapier) |
| **Email** | Text | Email completo | Automático (Zapier) |
| **WhatsApp** | Text | Telefone/WhatsApp | Automático (Zapier) |
| **Tipo de Projeto** | Text | Serviço solicitado | Automático (Zapier) |
| **Mensagem** | Text | Contexto do lead | Automático (Zapier) |
| **Status** | Select | Etapa do funil | Automático: "Novo" / Manual depois |
| **Prioridade** | Select | Alta/Média/Baixa | Automático: "Média" / Manual depois |
| **Data de Entrada** | Date | Timestamp da captura | Automático (Zapier) |
| **Próxima Ação** | Date | Próximo follow-up | Manual |
| **Notas de Análise** | Text | Anotações internas | Manual |
| **Valor Estimado** | Number | Potencial do negócio | Manual |

### Opções de Status:
- 🔴 **Novo** - Lead acabou de chegar (automático)
- 🟠 **Em Análise** - Avaliando qualificação
- 🔵 **Contatado** - Primeiro contato feito
- 🟢 **Proposta Enviada** - Aguardando decisão
- 🟣 **Fechado** - Virou cliente! 🎉
- ⚫ **Perdido** - Não converteu

### Opções de Prioridade:
- 🔴 **Alta** - Urgente ou alto ticket
- 🟡 **Média** - Padrão (automático)
- 🟢 **Baixa** - Sem pressa

---

## ⚠️ Limitações e Soluções

### Problema 1: Limite de 100 caracteres em emails
**Causa**: API do Notion limita campos tipo "Email" a 100 caracteres

**Solução**: Mudamos o campo "Email" para tipo **Text** (Rich Text)
- ✅ Aceita emails longos
- ❌ Perde validação automática (mas não é crítico)

### Problema 2: WhatsApp também tinha limite
**Causa**: Tipo "Phone Number" também tem limite de 100 caracteres

**Solução**: Mudamos o campo "WhatsApp" para tipo **Text**
- ✅ Aceita números longos ou formatados
- ❌ Perde formatação automática

### Problema 3: Campos não apareciam individuais no Zapier
**Causa**: Webhook captura JSON como texto único (Raw Body)

**Solução**: Adicionamos passo de **Code by Zapier** para parsear o JSON
- ✅ Cada campo fica disponível separadamente
- ✅ Permite validações e transformações

---

## 📊 Métricas e Monitoramento

### KPIs da Automação:
- ✅ Taxa de sucesso: 100% (após correções)
- ⏱️ Tempo de processamento: < 5 segundos
- 📈 Leads capturados: contando...
- 🚫 Erros: 0 (desde 08/01/2026)

### Como Monitorar:
1. **Zapier Dashboard**: Ver histórico de execuções
2. **Notion Database**: Verificar novos leads
3. **Teste manual**: Enviar formulário de teste periodicamente

---

## 🔄 Fluxo Operacional Pós-Captura

### 1. Lead Chega (Status: Novo)
**Ações automáticas**:
- ✅ Criada página no Notion
- ✅ Status definido como "Novo"
- ✅ Prioridade "Média" padrão
- ✅ Data de entrada registrada

### 2. Análise Inicial (Manual - 1h)
**Checklist**:
- [ ] Ler mensagem completa
- [ ] Avaliar qualificação (budget, urgência, fit)
- [ ] Definir Prioridade real (Alta/Média/Baixa)
- [ ] Adicionar notas em "Notas de Análise"
- [ ] Mudar Status para "Em Análise"

### 3. Primeiro Contato (Manual - 24h)
**Ações**:
- [ ] Responder via WhatsApp ou Email
- [ ] Template: "Olá [Nome]! Obrigado pelo interesse na Prismatic Labs..."
- [ ] Agendar call se necessário
- [ ] Mudar Status para "Contatado"
- [ ] Definir "Próxima Ação"

### 4. Proposta (Manual - 48-72h)
**Ações**:
- [ ] Criar proposta personalizada
- [ ] Enviar por email
- [ ] Mudar Status para "Proposta Enviada"
- [ ] Definir follow-up (3-5 dias)

### 5. Fechamento
**Se Fechado**:
- [ ] Status → "Fechado"
- [ ] Registrar "Valor Estimado" real
- [ ] Comemorar! 🎉
- [ ] Mover para database "Projetos"

**Se Perdido**:
- [ ] Status → "Perdido"
- [ ] Adicionar motivo em "Notas de Análise"
- [ ] Agendar follow-up em 3 meses (se fizer sentido)

---

## 🚀 Próximas Melhorias

### Fase 2 - Notificações (Em breve)
**Objetivo**: Ser avisado imediatamente quando lead chegar

**Solução**:
- Adicionar passo 4 no Zap: Slack ou Email
- Notificação: "🔔 Novo lead: [Nome] - [Tipo de Projeto]"
- Incluir link direto para página no Notion

### Fase 3 - Follow-up Automatizado (Futura)
**Objetivo**: Lembrar de fazer follow-up após X dias

**Solução**:
- Zap separado: monitorar database de Leads
- Se Status = "Novo" por > 24h → enviar alerta
- Se Status = "Proposta Enviada" por > 5 dias → lembrar follow-up

### Fase 4 - Enriquecimento de Dados (Futura)
**Objetivo**: Buscar informações adicionais do lead

**Solução**:
- Integrar com LinkedIn (buscar perfil)
- Integrar com Instagram (verificar audiência)
- Adicionar score de qualificação automático

### Fase 5 - Qualificação com IA (Futura)
**Objetivo**: IA analisa mensagem e define prioridade

**Solução**:
- Adicionar passo com OpenAI/Claude
- Input: mensagem do lead
- Output: prioridade sugerida + notas de análise

---

## 🛠️ Troubleshooting

### Lead não aparece no Notion
**Checklist**:
1. Verificar se formulário enviou (inspecionar network)
2. Checar Zapier Task History (tem erros?)
3. Conferir se Database ID está correto
4. Testar Zap manualmente

### Erro "body failed validation"
**Causa**: Campo no Notion não aceita o valor enviado

**Soluções**:
- Verificar tipo do campo no Notion
- Conferir limites (100 chars para Email/Phone)
- Truncar valor no Code step se necessário

### Campos aparecem vazios
**Causa**: Mapeamento incorreto no Zapier

**Solução**:
- Re-testar passo 2 (Code)
- Verificar se outputs estão corretos
- Remapear campos no passo 3 (Notion)

---

## 📞 Suporte

**Documentação**:
- GitHub: `/prismatic-labs-2026/AUTOMACAO-LEADS-PORTFOLIO.md`
- Notion: Workspace > Automações

**Contatos Úteis**:
- Zapier Support: https://zapier.com/app/help
- Notion API Docs: https://developers.notion.com

---

## ✅ Checklist de Validação

### Pré-Produção:
- [x] Webhook configurado
- [x] Zapier Zap criado e testado
- [x] Code step parseando JSON corretamente
- [x] Notion database com campos corretos
- [x] Tipos de campos ajustados (Text em vez de Email/Phone)
- [x] Teste end-to-end completo
- [x] Lead de teste criado com sucesso

### Pós-Produção:
- [x] Zap publicado (ativado)
- [ ] Monitoramento configurado
- [ ] Notificações ativas (fase 2)
- [ ] Follow-up automatizado (fase 3)
- [ ] Documentação atualizada

---

## 🎯 Resultados Esperados

**Operacionais**:
- ⚡ 100% dos leads do portfólio registrados automaticamente
- 📉 Redução de 95% no trabalho manual de registro
- ⏱️ Tempo de primeira resposta: < 1 hora (manual após análise)
- 🎯 Nenhum lead perdido por falha de processo

**Estratégicos**:
- 📊 Histórico completo de leads para análise
- 📈 Métricas de conversão por tipo de projeto
- 🔄 Funil de vendas visível e gerenciável
- 🚀 Escalabilidade: suporta 100+ leads/mês sem esforço adicional

---

**Criado**: 08 de Janeiro de 2026  
**Status**: ✅ PRODUÇÃO  
**Manutenção**: Mensal (revisão de métricas)

🎉 **AUTOMAÇÃO 1/10 CONCLUÍDA!** 🎉