# Módulo 10 — AUTOPILOT

Fluxo totalmente automático de geração de leads:

```
Hashtags (Apify) → Enrich Perfis (Apify) → Analyze/Copy/Review (AI) → CRM + Notion
```

## Uso rápido

```bash
# Ciclo completo com defaults do .env
node 10-autopilot.js

# Especificar nicho, qtd de leads e quantos analisar
node 10-autopilot.js api-automacao 20 8
node 10-autopilot.js saude-bem-estar 30 10

# Ver nichos disponíveis
node 6-scout.js --list
```

## Parâmetros

| Parâmetro | .env var | Padrão | Descrição |
|---|---|---|---|
| `[nicho]` | `AUTOPILOT_NICHO` | `api-automacao` | Nicho de prospecção |
| `[qtd]` | `AUTOPILOT_QTD` | `20` | Leads para coletar por ciclo |
| `[maxAnalyze]` | `AUTOPILOT_MAX_ANALYZE` | `10` | Máx. de leads para analisar com AI |
| — | `AUTOPILOT_SYNC_NOTION` | `true` | Sincronizar Notion no final |

## Etapas internas

1. **Scout** — `apify~instagram-hashtag-scraper` coleta posts das hashtags do nicho
2. **Enrich** — `apify~instagram-profile-scraper` busca bio, followers e posts de cada perfil
3. **Analyze** — `5-orchestrator.js analyze` roda analyzer → copywriter → reviewer
4. **Notion** — `9-notion-sync.js sync` sincroniza os leads novos com o Notion CRM

## Custo estimado (plano Free Apify)

| Ação | Crédito Apify |
|---|---|
| 1 ciclo de 20 leads | ~U$0.10 |
| 50 ciclos/mês | ~U$5 (dentro do free) |

## Depois do autopilot

Abra o dashboard e envie as DMs manualmente:

```bash
node 8-dashboard.js
# → http://localhost:3000
```

Filtros úteis no dashboard:
- **Status: HOT** → prioridade máxima, enviar hoje
- **Status: WARM** → enviar esta semana
- **Status: COLD** → avaliar antes de enviar
