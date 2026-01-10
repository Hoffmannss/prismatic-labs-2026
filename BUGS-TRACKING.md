# 🐛 TRACKING DE BUGS - PRISMATIC LABS
**Data de Criação:** 10/01/2026  
**Última Atualização:** 10/01/2026 19:43  
**Status Geral:** 🔴 CRÍTICO - 2 bugs bloqueadores de vendas  

---

## 🚨 BUGS CRÍTICOS (Bloqueiam vendas)

### BUG #1: Select com fonte branca invisível
- **Arquivo:** `08-WEBSITE/proposta.html` (linha 58)
- **Impacto:** ⛔ Usuário não consegue ver opções do formulário
- **Status:** 🔴 ABERTO
- **Prioridade:** P0 - CRÍTICA
- **Descoberto:** 10/01/2026
- **Responsável:** Daniel Hoffmann
- **Estimativa:** 10 minutos

**Sintoma:**
```
- Dropdown do campo "Objetivo" aparece com texto branco
- Fundo do dropdown também é branco (padrão do navegador)
- Resultado: texto invisível
```

**Causa raiz:**
```css
/* Problema: color:#fff sem estilização de <option> */
<select style="color: #fff;">
    <option>Texto</option> <!-- Herda cor mas não background -->
</select>
```

**Solução proposta:**
```css
/* Adicionar no <head> */
select option {
    background-color: #1a1a1a !important;
    color: #ffffff !important;
    padding: 10px !important;
}
```

**Checklist de correção:**
- [ ] Adicionar CSS no `<head>` de `proposta.html`
- [ ] Testar em Chrome
- [ ] Testar em Firefox
- [ ] Testar em Safari
- [ ] Testar em mobile
- [ ] Commit e push
- [ ] Validar em produção

---

### BUG #2: Webhook não envia dados ao Notion
- **Arquivo:** `08-WEBSITE/proposta.html` (linha 179-194)
- **Impacto:** ⛔ Leads NÃO chegam ao Notion = perda de vendas
- **Status:** 🔴 ABERTO
- **Prioridade:** P0 - CRÍTICA
- **Descoberto:** 10/01/2026
- **Responsável:** Daniel Hoffmann
- **Estimativa:** 20 minutos

**Sintoma:**
```
- Usuário preenche formulário
- Clica em "Enviar"
- Mensagem de sucesso aparece
- MAS dados não chegam no Notion
```

**Causa raiz (hipóteses):**
1. URL do webhook Zapier incorreta/expirada
2. Formato JSON incompatível
3. CORS bloqueando requisição
4. Zapier desativado/pausado

**Diagnóstico necessário:**
```javascript
// Verificar:
1. console.log(data) antes do fetch
2. Testar resposta do fetch
3. Validar URL do webhook
4. Conferir status do Zap
```

**Solução proposta:**
```javascript
// Adicionar logging e error handling completo
document.getElementById('propostaForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    console.log('📤 Enviando dados:', data); // DEBUG
    
    try {
        const response = await fetch('https://hooks.zapier.com/hooks/catch/25974741/uw77c8k/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📥 Resposta:', response.status); // DEBUG
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        this.style.display = 'none';
        document.getElementById('propostaSuccess').style.display = 'block';
    } catch (error) {
        console.error('❌ Erro:', error); // DEBUG
        alert('⚠️ Erro ao enviar. Entre em contato via WhatsApp: +55 48 98458-0234');
    }
});
```

**Checklist de correção:**
- [ ] Adicionar logging no JavaScript
- [ ] Testar envio com DevTools aberto
- [ ] Verificar resposta do webhook
- [ ] Validar Zap está ativo
- [ ] Confirmar dados chegam no Notion
- [ ] Remover logs de debug
- [ ] Commit e push
- [ ] Teste end-to-end em produção

---

## ⚠️ BUGS MÉDIOS (Afetam UX mas não bloqueiam)

### BUG #3: [PENDENTE AUDITORIA]
- **Arquivo:** A definir
- **Impacto:** A definir
- **Status:** 🟡 PENDENTE DESCOBERTA
- **Prioridade:** P1-P2

*Será preenchido após auditoria completa de links/botões*

---

## 🔍 AUDITORIA DE ELEMENTOS INTERATIVOS

### Checklist de páginas a auditar:

#### 📄 index.html
- [ ] Logo clicável (link para index.html)
- [ ] Menu navegação (5 links)
- [ ] Botão "Solicitar Proposta" (CTA principal)
- [ ] Botão "Ver Portfólio" (se existir)
- [ ] Links de contato (Email, WhatsApp, Instagram)
- [ ] Botão mobile menu (toggle)
- [ ] Footer links
- [ ] Smooth scroll (âncoras)

#### 📄 servicos.html
- [ ] Navegação completa
- [ ] CTAs de conversão
- [ ] Links internos

#### 📄 processo.html
- [ ] Navegação completa
- [ ] CTAs de conversão

#### 📄 documentos.html
- [ ] Navegação completa
- [ ] Downloads funcionais

#### 📄 contato.html
- [ ] Formulário de contato
- [ ] Validação de campos
- [ ] Envio funcional
- [ ] Links de contato direto

#### 📄 proposta.html (CRÍTICO)
- [ ] Formulário completo
- [ ] Select "Objetivo" (BUG #1)
- [ ] Radio buttons "Pacote"
- [ ] Textarea "Descrição"
- [ ] Inputs: Nome, WhatsApp, Email
- [ ] Botão submit
- [ ] Webhook funcionando (BUG #2)
- [ ] Mensagem de sucesso

---

## 🔗 AUDITORIA DE INTEGRAÇÕES

### Zapier Webhooks

#### Zap 1: Portfolio → Notion
- **URL:** [A confirmar]
- **Status:** ✅ FUNCIONANDO (confirmado em STATUS-ATUAL-08JAN2026.md)
- **Última verificação:** 08/01/2026
- **Checklist:**
  - [x] Webhook ativo
  - [x] Parser JSON configurado
  - [x] Mapeamento de campos correto
  - [x] Teste de ponta a ponta OK

#### Zap 2: Proposta → Notion
- **URL:** `https://hooks.zapier.com/hooks/catch/25974741/uw77c8k/`
- **Status:** ❓ A VERIFICAR (relatado como não funcionando)
- **Última verificação:** NUNCA
- **Checklist:**
  - [ ] Webhook ativo no Zapier
  - [ ] URL correta no código
  - [ ] Parser JSON configurado
  - [ ] Mapeamento de campos
  - [ ] Teste de envio
  - [ ] Dados chegam no Notion

---

## 📊 GUIA DE VERIFICAÇÃO DOS ZAPS

### PASSO 1: Acessar Zapier Dashboard
```
1. Ir para https://zapier.com/app/zaps
2. Login: Hoffmanns_@hotmail.com
3. Verificar lista de Zaps
```

### PASSO 2: Verificar Status do Zap
```
Para cada Zap:
1. Verificar se está "ON" (toggle verde)
2. Verificar "Zap History" (últimas execuções)
3. Ver se há erros recentes
4. Confirmar data da última execução
```

### PASSO 3: Testar Webhook Manualmente
```
1. Abrir Zap específico
2. Clicar em "Test" no trigger
3. Enviar dados de teste:
   {
     "nome": "Teste Manual",
     "email": "teste@example.com",
     "whatsapp": "48984580234",
     "objetivo": "captacao_leads",
     "pacote": "pro",
     "descricao": "Teste de integração"
   }
4. Verificar se chegou no Notion
```

### PASSO 4: Verificar Mapeamento
```
1. Abrir Zap
2. Ir para Action "Create Database Item"
3. Conferir mapeamento:
   - nome → Name (Notion)
   - email → Email (Notion)
   - whatsapp → WhatsApp (Notion)
   - objetivo → Tipo de Projeto (Notion)
   - pacote → Pacote (Notion)
   - descricao → Mensagem (Notion)
```

### PASSO 5: Verificar Notion Database
```
1. Abrir workspace no Notion
2. Localizar database correto
3. Verificar se:
   - Campos existem
   - Tipos estão corretos (Text, não Email/Phone)
   - Não há limitações de caracteres
```

---

## 🔄 FLUXO DE CORREÇÃO

### Priorização:
```
1. 🔴 P0 - CRÍTICO (Bloqueiam vendas)
   → Corrigir IMEDIATAMENTE
   → Testar em produção
   → Validar funcionamento

2. 🟠 P1 - ALTO (Afetam conversão)
   → Corrigir em até 24h
   → Testar localmente
   → Deploy

3. 🟡 P2 - MÉDIO (Afetam UX)
   → Corrigir em até 3 dias
   → Incluir em próximo sprint

4. 🟢 P3 - BAIXO (Melhorias)
   → Backlog
   → Avaliar ROI
```

### Workflow de correção:
```
1. Identificar bug
2. Reproduzir localmente
3. Diagnosticar causa raiz
4. Implementar fix
5. Testar localmente
6. Commit com mensagem descritiva
7. Push para main
8. Validar em produção
9. Atualizar este documento
10. Marcar como ✅ RESOLVIDO
```

---

## 📝 TEMPLATE DE REGISTRO DE BUG

```markdown
### BUG #X: [Título descritivo]
- **Arquivo:** `caminho/do/arquivo` (linha X)
- **Impacto:** [⛔ Bloqueador | ⚠️ Alto | 🔸 Médio | 🔹 Baixo]
- **Status:** [🔴 ABERTO | 🟡 EM PROGRESSO | ✅ RESOLVIDO]
- **Prioridade:** [P0 | P1 | P2 | P3]
- **Descoberto:** DD/MM/YYYY
- **Resolvido:** DD/MM/YYYY
- **Responsável:** Nome

**Sintoma:**
```
Descrição do que acontece
```

**Causa raiz:**
```
Por que acontece
```

**Solução:**
```code
Código ou processo de correção
```

**Checklist:**
- [ ] Etapa 1
- [ ] Etapa 2
```

---

## 📈 MÉTRICAS DE QUALIDADE

### Bugs por categoria:
- 🔴 CRÍTICOS: 2
- 🟠 ALTOS: 0
- 🟡 MÉDIOS: 0
- 🟢 BAIXOS: 0

### Status:
- 🔴 ABERTOS: 2
- 🟡 EM PROGRESSO: 0
- ✅ RESOLVIDOS: 0

### Taxa de correção:
- Última semana: 0 bugs corrigidos
- Tempo médio de correção: N/A

---

## 🎯 PRÓXIMAS AÇÕES

### Imediato (hoje):
1. [ ] Corrigir BUG #1 (select branco)
2. [ ] Corrigir BUG #2 (webhook)
3. [ ] Auditar todos os links e botões
4. [ ] Testar Zaps no Zapier
5. [ ] Validar dados chegam no Notion

### Curto prazo (esta semana):
1. [ ] Implementar testes automatizados
2. [ ] Criar checklist de pré-deploy
3. [ ] Documentar padrões de código
4. [ ] Configurar alertas de erro

### Médio prazo (este mês):
1. [ ] Implementar error tracking (Sentry)
2. [ ] Configurar CI/CD
3. [ ] Criar ambiente de staging
4. [ ] Implementar testes E2E

---

**Última atualização:** 10/01/2026 19:43  
**Responsável:** Daniel Hoffmann  
**Status:** 🔴 EM CORREÇÃO ATIVA
