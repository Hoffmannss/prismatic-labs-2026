# 🔧 ZAP 1 - CAPTURA DE LEADS (CONFIGURAÇÃO COMPLETA)

## 🎯 OBJETIVO
Capturar leads do formulário `proposta.html` e criar registro no Notion com **APENAS** os dados fornecidos pelo usuário.

**IMPORTANTE:** Este Zap NÃO faz análise de IA. A análise será feita no Zap 2.

---

## 🔌 ESTRUTURA DO ZAP 1

### **TRIGGER: Webhooks by Zapier**
- **Evento:** Catch Hook
- **Webhook URL:** `https://hooks.zapier.com/hooks/catch/25974741/uw77c8k/`
- **Dados esperados do formulário:**
  ```json
  {
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "whatsapp": "(48) 98458-0234",
    "objetivo": "lancamento_infoproduto",
    "pacote": "pro",
    "descricao": "Preciso de uma landing page para lançar meu curso...",
    "timestamp": "2026-01-10T20:30:00.000Z",
    "fonte": "Site - Página Proposta"
  }
  ```

---

### **ACTION 1: Code by Zapier (JavaScript)**
**Função:** Transformar dados do formulário para formato do Notion

#### **Input Data:**
```javascript
{
  nome: {{1. Nome}},
  email: {{1. Email}},
  whatsapp: {{1. WhatsApp}},
  objetivo: {{1. Objetivo}},
  pacote: {{1. Pacote}},
  descricao: {{1. Descricao}}
}
```

#### **Código:**
```javascript
// 🔧 ZAP 1 - MAPEAMENTO DE DADOS DO FORMULÁRIO PARA NOTION

const inputData = input;

// ==== MAPEAMENTO: Objetivo → Tipo de Serviço ====
const mapObjetivo = {
  'lancamento_infoproduto': 'Landing Page',
  'ecommerce': 'E-commerce',
  'captacao_leads': 'Landing Page',
  'institucional': 'Site Institucional',
  'outro': 'Site Institucional'
};

// ==== MAPEAMENTO: Pacote (normalizar capitalização) ====
const mapPacote = {
  'basico': 'Básico',
  'pro': 'Pro',
  'premium': 'Premium'
};

// ==== PROCESSAR DADOS ====
const tipoServico = mapObjetivo[inputData.objetivo] || 'Site Institucional';
const pacoteFormatado = mapPacote[inputData.pacote] || 'Pro';
const dataHoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ==== RETORNAR DADOS FORMATADOS ====
output = {
  nome: inputData.nome,
  email: inputData.email,
  whatsapp: inputData.whatsapp,
  tipo_servico: tipoServico,
  pacote: pacoteFormatado,
  descricao: inputData.descricao,
  origem: 'Website',
  status: 'Novo',
  data_entrada: dataHoje
};
```

---

### **ACTION 2: Notion - Create Database Item**

#### **Configuração:**
- **Database:** `Leads - Sistema IA Completo`
- **Database ID:** `c9ef8025597c411bb9a5460f2da7c355`
- **Data Source ID:** `628e749b-5c55-4ade-b396-7ab6889889e9`

#### **Mapeamento de Campos:**

| Campo Notion | Tipo | Valor | Origem |
|--------------|------|-------|--------|
| **Name** | title | `{{2. Nome}}` | Formulário |
| **Email** | email | `{{2. Email}}` | Formulário |
| **WhatsApp** | phone | `{{2. Whatsapp}}` | Formulário |
| **Tipo de Serviço** | select | `{{2. Tipo_servico}}` | Mapeado |
| **Pacote** | select | `{{2. Pacote}}` | Mapeado |
| **Descrição** | text | `{{2. Descricao}}` | Formulário |
| **Origem** | select | `Website` | Fixo |
| **Status** | select | `Novo` | Fixo |
| **Data de Entrada** | date | `{{2. Data_entrada}}` | Hoje (auto) |

#### **Formato JSON (Notion API):**
```json
{
  "Name": "{{2. Nome}}",
  "Email": "{{2. Email}}",
  "WhatsApp": "{{2. Whatsapp}}",
  "Tipo de Serviço": "{{2. Tipo_servico}}",
  "Pacote": "{{2. Pacote}}",
  "Descrição": "{{2. Descricao}}",
  "Origem": "Website",
  "Status": "Novo",
  "date:Data de Entrada:start": "{{2. Data_entrada}}",
  "date:Data de Entrada:is_datetime": 0
}
```

---

## ❌ CAMPOS QUE NÃO DEVEM SER PREENCHIDOS NO ZAP 1

**Estes campos serão preenchidos pelo Zap 2 (Análise IA):**

| Campo | Razão |
|-------|--------|
| Score IA | Calculado pela IA |
| Urgência | Analisado pela IA |
| Valor Estimado | Estimado pela IA |
| Análise IA | Texto gerado pela IA |
| Problema Principal | Extraído pela IA |
| Solução | Sugerido pela IA |
| Próxima Ação | Definido pela IA |
| Prioridade | Calculado pela IA |
| Data Último Contato | Preenchido manualmente |
| Follow-ups | Contador manual |
| Proposta Enviada | Preenchido manualmente |
| Notas | Preenchido manualmente |
| Último Follow-up | Preenchido manualmente |

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **1. Webhook**
- [ ] Webhook `uw77c8k` está ativo
- [ ] Formulário `proposta.html` usa webhook correto
- [ ] Teste manual: enviar formulário e verificar trigger

### **2. Code Step**
- [ ] Mapeia `objetivo` corretamente para `Tipo de Serviço`
- [ ] Mapeia `pacote` com capitalização correta
- [ ] Gera `data_entrada` automaticamente
- [ ] Define `origem = 'Website'` fixo
- [ ] Define `status = 'Novo'` fixo

### **3. Notion Action**
- [ ] Conectado ao database correto (ID: `c9ef8025...`)
- [ ] Usa Data Source correto (ID: `628e749b...`)
- [ ] Campo `Name` (título) mapeado corretamente
- [ ] Campos select usam valores EXATOS do Notion
- [ ] Data formatada como `YYYY-MM-DD` (sem horário)
- [ ] NÃO preenche campos reservados para Zap 2

### **4. Teste End-to-End**
- [ ] Preencher formulário no site
- [ ] Verificar criação do lead no Notion
- [ ] Confirmar que Status = "Novo"
- [ ] Confirmar que Origem = "Website"
- [ ] Confirmar que campos de IA estão VAZIOS

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### **Erro 1: Campos select não preenchem**
**Causa:** Valor enviado não corresponde exatamente à opção no Notion
**Solução:** Usar mapeamento no Code Step (como mostrado acima)

### **Erro 2: Data em formato errado**
**Causa:** Notion espera `YYYY-MM-DD`, mas recebe ISO 8601 completo
**Solução:** Usar `.split('T')[0]` no JavaScript

### **Erro 3: Campos de IA sendo preenchidos no Zap 1**
**Causa:** Mapeamento incorreto
**Solução:** Remover TODOS os campos de IA do Zap 1 (deixar para Zap 2)

### **Erro 4: Webhook não recebe dados**
**Causa:** CORS ou Content-Type incorreto
**Solução:** Garantir `Content-Type: application/json` no fetch

---

## 🔗 LINKS ÚTEIS

- **Zap 1 Editor:** https://zapier.com/editor/zap/342764091
- **Notion Database:** https://www.notion.so/c9ef8025597c411bb9a5460f2da7c355
- **Formulário:** https://hoffmannss.github.io/prismatic-labs-2026/proposta.html
- **Documentação Zap 2:** `03-AUTOMACAO/ZAP-2-CONFIG.md` (próximo)

---

## 📅 HISTÓRICO DE VERSÕES

- **v1.0** (2026-01-10): Configuração inicial com mapeamento básico
- **v1.1** (2026-01-10): Separação de responsabilidades (Zap 1 vs Zap 2)
- **v1.2** (próxima): Validação de campos obrigatórios

---

**Última atualização:** 10/01/2026 21:30 BRT  
**Responsável:** Sistema de automação Prismatic Labs
