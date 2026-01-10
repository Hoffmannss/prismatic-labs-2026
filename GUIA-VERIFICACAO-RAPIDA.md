# 📋 GUIA DE VERIFICAÇÃO RÁPIDA - PRISMATIC LABS

**Data:** 10/01/2026 - 19:50  
**Objetivo:** Verificar se todas as correções estão funcionando perfeitamente

---

## ✅ CHECKLIST RÁPIDO (5 MINUTOS)

### 1️⃣ **TESTE DO WEBSITE**

#### A. Navegação Principal
- [ ] Abrir: https://hoffmannss.github.io/prismatic-labs-2026/
- [ ] Clicar em cada item do menu:
  - [ ] Home → Volta para home
  - [ ] Serviços → Abre servicos.html
  - [ ] Processo → Abre processo.html
  - [ ] Documentos → Abre documentos.html
  - [ ] Contato → Abre contato.html
  - [ ] **"Solicitar Proposta"** (botão roxo) → Abre **proposta.html** ✅

#### B. Botões de Proposta (CRÍTICO)
Estes são os botões mais importantes do site - **TODOS devem abrir `proposta.html`**:

##### No INDEX.HTML:
- [ ] Hero → **"Solicitar Proposta Personalizada"** → proposta.html
- [ ] Pacote Básico → **"Solicitar Proposta"** → proposta.html?package=basico
- [ ] Pacote Pro → **"Solicitar Proposta"** → proposta.html?package=pro
- [ ] Pacote Premium → **"Solicitar Proposta"** → proposta.html?package=premium
- [ ] CTA Final → **"Solicitar Proposta Gratuita"** → proposta.html

##### No SERVICOS.HTML:
- [ ] Abrir: https://hoffmannss.github.io/prismatic-labs-2026/servicos.html
- [ ] Pacote Básico → proposta.html?package=basico
- [ ] Pacote Pro → proposta.html?package=pro
- [ ] Pacote Premium → proposta.html?package=premium
- [ ] CTA Final → proposta.html

##### No PROCESSO.HTML:
- [ ] Abrir: https://hoffmannss.github.io/prismatic-labs-2026/processo.html
- [ ] CTA Início → proposta.html
- [ ] CTA Final → proposta.html

##### No DOCUMENTOS.HTML:
- [ ] Abrir: https://hoffmannss.github.io/prismatic-labs-2026/documentos.html
- [ ] CTA Final → proposta.html

##### No CONTATO.HTML:
- [ ] Abrir: https://hoffmannss.github.io/prismatic-labs-2026/contato.html
- [ ] CTA "Solicitar Proposta Personalizada" → proposta.html

#### C. Teste do Formulário de Proposta
- [ ] Abrir: https://hoffmannss.github.io/prismatic-labs-2026/proposta.html
- [ ] Verificar se formulário está visível
- [ ] Preencher todos os campos:
  ```
  Nome: TESTE SISTEMA
  Email: teste@prismatic.com
  WhatsApp: +55 48 98458-0234
  Tipo Projeto: Landing Page
  Segmento: Infoprodutos
  Orçamento: R$ 2.500 - R$ 3.500
  Prazo: 10-15 dias
  Descrição: Teste do sistema após correções
  ```
- [ ] Clicar em **"Enviar Proposta Personalizada →"**
- [ ] Verificar se aparece mensagem de sucesso: ✅ "Proposta enviada com sucesso!"

---

### 2️⃣ **TESTE DO ZAP 1 (Captura de Lead)**

- [ ] Após enviar o formulário, aguardar 1-2 minutos
- [ ] Acessar: https://zapier.com/app/history
- [ ] Verificar última execução do Zap 1:
  - [ ] Status: ✅ **Success** (fundo verde)
  - [ ] Hora: Últimos 5 minutos
  - [ ] Dados corretos no payload

- [ ] Acessar Notion: https://notion.so/c9ef8025597c411bb9a5460f2da7c355
- [ ] Verificar se lead **"TESTE SISTEMA"** apareceu:
  - [ ] Nome: TESTE SISTEMA
  - [ ] Email: teste@prismatic.com
  - [ ] WhatsApp: +55 48 98458-0234
  - [ ] Status: Novo (vermelho)
  - [ ] Data de Entrada: HOJE

---

### 3️⃣ **TESTE DO ZAP 2 (IA Qualificadora)**

⚠️ **ATENÇÃO:** Zap 2 só dispara quando há INTERAÇÃO com o lead no Notion.

#### Como testar:
1. **No Notion, abrir o lead "TESTE SISTEMA"**
2. **Adicionar uma resposta/comentário** (simular lead respondendo):
   ```
   Olá! Vi o site de vocês e gostei muito do design dark mode + neon.
   Preciso de uma landing page para meu curso de marketing digital.
   Meu orçamento é de R$ 3.000 e preciso para daqui 12 dias.
   Podem me enviar mais detalhes?
   ```
3. **Salvar e aguardar 2-3 minutos**
4. **Verificar no Zapier:** https://zapier.com/app/history
   - [ ] Zap 2 executou? (Status: Success)
   - [ ] IA processou? (Campo "Análise IA" preenchido)
5. **Voltar no Notion** e verificar se:
   - [ ] Campo **"Análise IA"** foi preenchido com texto relevante
   - [ ] Campo **"Score IA"** foi calculado (número de 0-100)
   - [ ] Status mudou para **"Em Análise"** (laranja)

---

### 4️⃣ **TESTE DE RESPONSIVIDADE (Mobile)**

- [ ] Abrir site no celular: https://hoffmannss.github.io/prismatic-labs-2026/
- [ ] Menu hambúrguer funciona?
- [ ] Botões são clicáveis?
- [ ] Formulário funciona no mobile?
- [ ] Textos estão legíveis?

---

## 🚨 O QUE FAZER SE ALGO NÃO FUNCIONAR

### ❌ **Se link não abre:**
1. Verificar console do navegador (F12)
2. Ver se há erro 404
3. Confirmar que arquivo existe no GitHub
4. Limpar cache do navegador (Ctrl+Shift+R)

### ❌ **Se formulário não envia:**
1. Abrir console do navegador (F12)
2. Ver se há erro na aba "Network"
3. Verificar URL do webhook Zapier
4. Testar webhook diretamente: https://hooks.zapier.com/hooks/catch/25974741/uw77c8k/

### ❌ **Se Zap não dispara:**
1. Acessar: https://zapier.com/app/history
2. Ver últimos erros
3. Clicar no erro para ver detalhes
4. Verificar se:
   - Zap está LIGADO (On)
   - Webhook está correto
   - Campos do Notion existem

### ❌ **Se lead não aparece no Notion:**
1. Verificar se Zap executou com sucesso
2. Confirmar ID da base de dados no Zap
3. Verificar permissões do Zapier no Notion
4. Testar criar manualmente no Notion

---

## ✅ ESTRUTURA DO NOTION (VERIFICADA)

### **Base: "Leads - Sistema IA Completo"**
URL: https://notion.so/c9ef8025597c411bb9a5460f2da7c355

#### ✅ **Propriedades Principais (SEM DUPLICAÇÕES):**
1. **Name** (Title) - Nome do lead
2. **Email** (Email) - Email do lead
3. **WhatsApp** (Phone) - Telefone do lead
4. **Status** (Select) - Novo, Em Análise, Proposta Enviada, Negociando, Convertido, Perdido
5. **Tipo de Serviço** (Select) - Landing Page, E-commerce, Site Institucional, Aplicativo
6. **Pacote** (Select) - Básico, Pro, Premium
7. **Origem** (Select) - Website, Indicação, Redes Sociais, Outro
8. **Urgência** (Select) - Baixa, Média, Alta, Crítica
9. **Descrição** (Text) - Descrição do projeto
10. **Análise IA** (Text) - Análise gerada pelo Zap 2
11. **Score IA** (Number) - Pontuação de 0-100
12. **Prioridade** (Number) - Prioridade manual
13. **Valor Estimado** (Number) - Valor em R$
14. **Data de Entrada** (Date) - Quando lead entrou
15. **Data Último Contato** (Date) - Última interação
16. **Proposta Enviada** (Date) - Data da proposta
17. **Último Follow-up** (Date) - Última tentativa de contato
18. **Follow-ups** (Number) - Quantidade de follow-ups
19. **Próxima Ação** (Text) - O que fazer
20. **Notas** (Text) - Observações gerais
21. **Problema Principal** (Text) - Dor do cliente
22. **Solução** (Text) - Como resolver

#### ✅ **Views Criadas:**
1. 📊 **Todos os Leads** - Lista completa ordenada por Score IA
2. 🔥 **Leads Novos** - Filtra Status = "Novo"
3. 🎯 **Pipeline** - Kanban por Status
4. ⚡ **Alta Prioridade** - Score IA >= 70
5. 📬 **Precisa Follow-up** - Leads sem follow-up ainda

---

## 📊 MÉTRICAS DE SUCESSO

### ✅ **TUDO FUNCIONANDO SE:**
- [ ] Todos os links abrem páginas corretas
- [ ] Formulário envia e mostra mensagem de sucesso
- [ ] Zap 1 executa com status "Success"
- [ ] Lead aparece no Notion em até 2 minutos
- [ ] Todos os campos do lead estão preenchidos corretamente
- [ ] Zap 2 dispara quando há interação no Notion
- [ ] IA preenche "Análise IA" e "Score IA"

### ⚠️ **ATENÇÃO SE:**
- Links abrem erro 404
- Formulário não envia ou fica travado
- Zap executa mas dá erro
- Lead não aparece no Notion após 5 minutos
- Campos ficam vazios no Notion
- Zap 2 não dispara mesmo com interação

---

## 🎯 RESULTADO ESPERADO

Após todos os testes, você deve conseguir:

1. ✅ Navegar por todo o site sem erros
2. ✅ Clicar em qualquer botão de "Solicitar Proposta" e ir para `proposta.html`
3. ✅ Preencher e enviar o formulário com sucesso
4. ✅ Ver o lead aparecer no Notion automaticamente
5. ✅ Interagir com o lead e ver a IA processar

---

## 📝 REGISTRAR RESULTADOS

Após completar TODOS os testes, preencha:

**Data do teste:** ___/___/2026  
**Hora:** ___:___  

**Resultados:**
- [ ] Website: ✅ OK | ❌ Problema: ________________
- [ ] Formulário: ✅ OK | ❌ Problema: ________________
- [ ] Zap 1: ✅ OK | ❌ Problema: ________________
- [ ] Notion: ✅ OK | ❌ Problema: ________________
- [ ] Zap 2: ✅ OK | ❌ Problema: ________________
- [ ] Mobile: ✅ OK | ❌ Problema: ________________

**Próximas ações necessárias:**
1. ________________________________
2. ________________________________
3. ________________________________

---

## 🚀 APÓS TUDO OK, PRÓXIMO PASSO:

**→ Começar campanhas de marketing para capturar primeiros leads reais!**

Documentos de marketing estão em:
- [01-CLIENTE-IDEAL.md](https://github.com/Hoffmannss/prismatic-labs-2026/blob/main/01-ESTRATEGIA/01-CLIENTE-IDEAL.md)
- [02-MENSAGENS.md](https://github.com/Hoffmannss/prismatic-labs-2026/blob/main/01-ESTRATEGIA/02-MENSAGENS.md)

---

✅ **FIM DO GUIA DE VERIFICAÇÃO**
