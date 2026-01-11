# 🤖 ZAP 2 - ANÁLISE COM IA (CONFIGURAÇÃO COMPLETA)

## 🎯 OBJETIVO
Analisar leads recém-criados no Notion e preencher campos automaticamente usando **IA simples por código** (por enquanto) ou **OpenAI API** (futuro).

**IMPORTANTE:** Este Zap só executa DEPOIS que o Zap 1 criar o lead.

---

## 🔌 ESTRUTURA DO ZAP 2

### **TRIGGER: Notion - New Database Item**
- **Database:** `Leads - Sistema IA Completo`
- **Database ID:** `c9ef8025597c411bb9a5460f2da7c355`
- **Trigger Field:** `Status = "Novo"`
- **Polling Interval:** 1 minuto (gratuito) ou 5 minutos

#### **Filtro Importante:**
Adicionar filtro para garantir que só processa leads novos:
```
Status equals "Novo"
AND
Score IA is empty
```

---

### **ACTION 1: Code by Zapier (JavaScript) - Análise IA**

#### **Input Data:**
```javascript
{
  descricao: {{1. Descrição}},
  tipo_servico: {{1. Tipo de Serviço}},
  pacote: {{1. Pacote}},
  nome: {{1. Name}}
}
```

#### **Código - Versão 1.0 (IA Simples):**
```javascript
// 🤖 ZAP 2 - ANÁLISE DE LEADS COM IA SIMPLES
// Versão: 1.0 - Análise por palavras-chave
// Próxima versão: 2.0 - OpenAI API

const inputData = input;
const descricao = (inputData.descricao || '').toLowerCase();
const tipoServico = inputData.tipo_servico || 'Site Institucional';
const pacote = inputData.pacote || 'Pro';
const nome = inputData.nome || 'Lead';

// ======================================
// 1. CALCULAR SCORE (0-100)
// ======================================
function calcularScore(desc, pac) {
  let score = 50; // Base
  
  // +20 pontos: Descrição detalhada (>100 caracteres)
  if (desc.length > 100) score += 20;
  
  // +15 pontos: Menciona prazo/urgência
  if (/(urgente|rápido|logo|imediato|preciso agora)/i.test(desc)) score += 15;
  
  // +10 pontos: Menciona orçamento/investimento
  if (/(orçamento|quanto custa|investir|budget|valor)/i.test(desc)) score += 10;
  
  // +10 pontos: Pacote Premium
  if (pac === 'Premium') score += 10;
  else if (pac === 'Pro') score += 5;
  
  // +10 pontos: Já tem público/produto pronto
  if (/(já tenho|já existe|pronto|lançar)/i.test(desc)) score += 10;
  
  // -10 pontos: "talvez", "pensando", "futuro"
  if (/(talvez|pensando|futuramente|estudando)/i.test(desc)) score -= 10;
  
  return Math.min(100, Math.max(0, score));
}

// ======================================
// 2. DETECTAR URGÊNCIA
// ======================================
function detectarUrgencia(desc) {
  if (/(urgente|imediato|hoje|amanhã|esta semana)/i.test(desc)) {
    return 'Crítica';
  }
  if (/(rápido|breve|logo|próximos dias|semana que vem)/i.test(desc)) {
    return 'Alta';
  }
  if (/(mês|próximo mês)/i.test(desc)) {
    return 'Média';
  }
  return 'Baixa';
}

// ======================================
// 3. ESTIMAR VALOR
// ======================================
function estimarValor(pac, tipo) {
  const valores = {
    'Básico': { 'Landing Page': 2500, 'E-commerce': 3500, 'Site Institucional': 2800, 'Aplicativo': 4000 },
    'Pro': { 'Landing Page': 3500, 'E-commerce': 5000, 'Site Institucional': 4000, 'Aplicativo': 6000 },
    'Premium': { 'Landing Page': 4500, 'E-commerce': 7000, 'Site Institucional': 5500, 'Aplicativo': 8000 }
  };
  
  return valores[pac]?.[tipo] || 3500;
}

// ======================================
// 4. EXTRAIR PROBLEMA PRINCIPAL
// ======================================
function extrairProblema(desc) {
  if (/(não tenho|preciso de|falta|sem)/i.test(desc)) {
    // Tentar extrair frase após "preciso de" ou "não tenho"
    const match = desc.match(/(preciso de|não tenho|falta)\s+([^.!?]+)/i);
    if (match) return match[2].trim().slice(0, 100);
  }
  
  if (/(problema|dificuldade|desafio)/i.test(desc)) {
    return 'Lead mencionou dificuldades específicas no projeto';
  }
  
  return 'Lead quer solução digital para seu negócio';
}

// ======================================
// 5. SUGERIR SOLUÇÃO
// ======================================
function sugerirSolucao(tipo, pac) {
  const solucoes = {
    'Landing Page': `${pac} com design profissional, formulário de captura, integrações com email marketing e análise de conversão`,
    'E-commerce': `${pac} com catálogo de produtos, carrinho, pagamento integrado, painel administrativo e sistema de pedidos`,
    'Site Institucional': `${pac} com design moderno, páginas institucionais, blog (opcional) e otimização para conversão`,
    'Aplicativo': `${pac} com desenvolvimento nativo/híbrido, integrações de API e deploy nas lojas`
  };
  
  return solucoes[tipo] || `Pacote ${pac} personalizado para atender necessidades específicas do projeto`;
}

// ======================================
// 6. GERAR ANÁLISE TEXTUAL
// ======================================
function gerarAnalise(nome, score, urg, desc) {
  const qualificacao = score >= 70 ? '✅ Lead qualificado' : score >= 50 ? '🔶 Lead médio' : '⚠️ Lead para nutrir';
  const tamanho = desc.length > 100 ? 'Descrição detalhada' : 'Descrição breve';
  
  return `${qualificacao}. ${tamanho}. Urgência: ${urg}. Score: ${score}/100. Lead demonstra interesse em solução digital profissional.`;
}

// ======================================
// 7. DEFINIR PRÓXIMA AÇÃO
// ======================================
function definirProximaAcao(score, urg) {
  if (score >= 70 && (urg === 'Crítica' || urg === 'Alta')) {
    return '🔥 PRIORIDADE: Ligar em até 2 horas';
  }
  if (score >= 70) {
    return '📞 Ligar em até 24h para entender necessidades';
  }
  if (score >= 50) {
    return '📬 Enviar email com portfólio e agendar reunião';
  }
  return '💬 Enviar WhatsApp com conteúdo educativo';
}

// ======================================
// 8. CALCULAR PRIORIDADE (1-5)
// ======================================
function calcularPrioridade(score, urg, valor) {
  let prioridade = 3; // Média
  
  if (score >= 80) prioridade += 1;
  if (urg === 'Crítica') prioridade += 1;
  else if (urg === 'Alta') prioridade += 0.5;
  if (valor >= 5000) prioridade += 0.5;
  
  if (score < 40) prioridade -= 1;
  if (urg === 'Baixa') prioridade -= 0.5;
  
  return Math.min(5, Math.max(1, Math.round(prioridade)));
}

// ======================================
// EXECUTAR ANÁLISE
// ======================================
const score = calcularScore(descricao, pacote);
const urgencia = detectarUrgencia(descricao);
const valorEstimado = estimarValor(pacote, tipoServico);
const problemaPrincipal = extrairProblema(descricao);
const solucao = sugerirSolucao(tipoServico, pacote);
const analiseIA = gerarAnalise(nome, score, urgencia, descricao);
const proximaAcao = definirProximaAcao(score, urgencia);
const prioridade = calcularPrioridade(score, urgencia, valorEstimado);

// ======================================
// RETORNAR RESULTADOS
// ======================================
output = {
  score_ia: score,
  urgencia: urgencia,
  valor_estimado: valorEstimado,
  problema_principal: problemaPrincipal,
  solucao: solucao,
  analise_ia: analiseIA,
  proxima_acao: proximaAcao,
  prioridade: prioridade
};
```

---

### **ACTION 2: Notion - Update Database Item**

#### **Configuração:**
- **Database:** `Leads - Sistema IA Completo`
- **Record ID:** `{{1. Page ID}}` (do trigger)

#### **Mapeamento de Campos:**

| Campo Notion | Tipo | Valor | Origem |
|--------------|------|-------|--------|
| **Score IA** | number | `{{2. Score_ia}}` | IA |
| **Urgência** | select | `{{2. Urgencia}}` | IA |
| **Valor Estimado** | number | `{{2. Valor_estimado}}` | IA |
| **Problema Principal** | text | `{{2. Problema_principal}}` | IA |
| **Solução** | text | `{{2. Solucao}}` | IA |
| **Análise IA** | text | `{{2. Analise_ia}}` | IA |
| **Próxima Ação** | text | `{{2. Proxima_acao}}` | IA |
| **Prioridade** | number | `{{2. Prioridade}}` | IA |
| **Status** | select | `Em Análise` | Fixo |

#### **Formato JSON (Notion API):**
```json
{
  "Score IA": {{2. Score_ia}},
  "Urgência": "{{2. Urgencia}}",
  "Valor Estimado": {{2. Valor_estimado}},
  "Problema Principal": "{{2. Problema_principal}}",
  "Solução": "{{2. Solucao}}",
  "Análise IA": "{{2. Analise_ia}}",
  "Próxima Ação": "{{2. Proxima_acao}}",
  "Prioridade": {{2. Prioridade}},
  "Status": "Em Análise"
}
```

---

## 🚀 ROADMAP - EVOLUÇÃO DA IA

### **Versão 1.0 - IA Simples (ATUAL)**
✅ Análise por palavras-chave  
✅ Regras baseadas em padrões  
✅ Sem custo (roda no Zapier)  
✅ Rápido (< 1 segundo)  

### **Versão 2.0 - OpenAI API (FUTURO - após R$ 500 receita)**
```javascript
// PLACEHOLDER - Substituir Code Step quando tiver créditos
const openai = require('openai');
const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: "Você é um analista de leads especializado em projetos digitais..."
    },
    {
      role: "user",
      content: `Analise este lead:\nNome: ${nome}\nTipo: ${tipoServico}\nPacote: ${pacote}\nDescrição: ${descricao}`
    }
  ],
  response_format: { type: "json_object" }
});

const analise = JSON.parse(completion.choices[0].message.content);
output = analise; // Já no formato correto
```

**Benefícios da v2.0:**
- 🧠 Análise mais sofisticada
- 🎯 Identificação de padrões sutis
- 📝 Geração de textos personalizados
- 💡 Sugestões de ações mais precisas

**Custo estimado:** R$ 0,10 - R$ 0,30 por lead (gpt-4o-mini)

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **1. Trigger**
- [ ] Conectado ao database correto
- [ ] Filtro `Status = "Novo"` ativo
- [ ] Polling configurado (1-5 min)
- [ ] Teste: criar lead manualmente e verificar trigger

### **2. Code Step**
- [ ] Todas as funções estão definidas
- [ ] Output retorna 8 campos (score, urgência, valor, etc.)
- [ ] Valores de `urgencia` correspondem ao Notion (`Crítica`, `Alta`, `Média`, `Baixa`)
- [ ] Teste manual com descrições variadas

### **3. Notion Update**
- [ ] Page ID mapeado corretamente do trigger
- [ ] Todos os 8 campos mapeados
- [ ] Status muda para "Em Análise"
- [ ] Campos select usam valores EXATOS do Notion

### **4. Teste End-to-End**
- [ ] Criar lead via formulário (Zap 1)
- [ ] Aguardar 1-5 min para Zap 2 processar
- [ ] Verificar campos preenchidos no Notion
- [ ] Confirmar que Status mudou para "Em Análise"
- [ ] Validar qualidade da análise

---

## 💡 EXEMPLOS DE ANÁLISE

### **Exemplo 1: Lead Qualificado**
**Input:**
```
Descrição: "Preciso urgente de uma landing page para lançar meu curso de marketing digital. Já tenho 500 alunos na lista de espera e quero lançar em 10 dias. Quanto custa?"
Pacote: Premium
```

**Output:**
```json
{
  "score_ia": 95,
  "urgencia": "Crítica",
  "valor_estimado": 4500,
  "problema_principal": "uma landing page para lançar meu curso de marketing digital",
  "analise_ia": "✅ Lead qualificado. Descrição detalhada. Urgência: Crítica. Score: 95/100.",
  "proxima_acao": "🔥 PRIORIDADE: Ligar em até 2 horas",
  "prioridade": 5
}
```

### **Exemplo 2: Lead Médio**
**Input:**
```
Descrição: "Gostaria de um site para minha empresa."
Pacote: Básico
```

**Output:**
```json
{
  "score_ia": 45,
  "urgencia": "Baixa",
  "valor_estimado": 2800,
  "problema_principal": "Lead quer solução digital para seu negócio",
  "analise_ia": "⚠️ Lead para nutrir. Descrição breve. Urgência: Baixa. Score: 45/100.",
  "proxima_acao": "💬 Enviar WhatsApp com conteúdo educativo",
  "prioridade": 2
}
```

---

## 🔗 LINKS ÚTEIS

- **Notion Database:** https://www.notion.so/c9ef8025597c411bb9a5460f2da7c355
- **Documentação Zap 1:** `03-AUTOMACAO/ZAP-1-CONFIG.md`
- **Documentação Zap 3:** `03-AUTOMACAO/ZAP-3-CONFIG.md` (próximo)

---

**Última atualização:** 10/01/2026 21:30 BRT  
**Responsável:** Sistema de automação Prismatic Labs  
**Versão:** 1.0 (IA Simples)
