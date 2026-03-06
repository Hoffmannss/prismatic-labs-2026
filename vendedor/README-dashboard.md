# Vendedor AI Dashboard

Dashboard web interativo para acompanhar o pipeline de vendas do Vendedor AI.

## Iniciar

```bash
cd vendedor
node 8-dashboard.js
# Acesse: http://localhost:3131
```

Porta customizada:
```bash
node 8-dashboard.js 4000
```

## Funcionalidades

- **KPI Cards**: Total leads, Taxa de contato, Em negotiacao, Followups hoje
- **Kanban interativo**: 5 colunas (Novo / Contatado / Em Negociacao / Fechado / Perdido)
- **Filtros**: Todos / Hot / Warm / Cold / Followup pendente
- **Modal de lead**: Ver analise completa, historico, notas + alterar status direto
- **Score chart**: Bar chart dos top 15 leads por score
- **Followup panel**: Lista de leads com followup pendente hoje
- **Auto-refresh**: Atualiza automaticamente a cada 30s
- **Sem dependencias extras**: Usa apenas Node.js built-in

## Arquitetura

```
node 8-dashboard.js
  GET  /          -> Dashboard HTML (Tailwind CDN + Chart.js CDN)
  GET  /api/data  -> JSON com leads + pipeline
  POST /api/status -> Atualizar status de um lead
```

## Addon para Clientes

Para vender como addon, considere:
- Adicionar autenticacao basica (usuario/senha no .env)
- Deploy no Railway/Render (junto com a API)
- Notion sync como alternativa para clientes que preferem
