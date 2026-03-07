# Deployment Guide

## Alvo recomendado

O caminho mais seguro agora e operar o Vendedor AI como servico Node em ambiente Linux simples, com um diretório por cliente/ambiente e rotinas explicitas de backup, smoke test e healthcheck.

## Checklist por ambiente

### 1. Provisionamento
- Node 18+ instalado.
- Repositorio clonado em diretório dedicado.
- `.env` criado a partir de `.env.example`.
- `npm ci` executado sem erro.

### 2. Validacao inicial
- `npm run preflight`
- `npm run test:contracts`
- `npm run smoke:e2e`
- `npm run healthcheck`

### 3. Operacao minima
- `npm run backup:create` antes de ativacao comercial.
- Dashboard disponivel localmente ou via tunel/reverse proxy controlado.
- Guardrails revisados em `config/guardrails.json`.
- Quotas e circuit breakers monitorados nos stores em `data/metrics/`.

## Topologia sugerida

- `dev`: ambiente de mudanca, fixtures e smoke tests.
- `staging`: ambiente espelho para validacao operacional.
- `prod`: ambiente do cliente ou conta operada.

## Segredos

Nao commitar `.env` real. Cada ambiente deve manter suas proprias credenciais de Groq, Apify e Notion, e qualquer troca de chave deve ser seguida de `npm run preflight` e `npm run healthcheck`.

## Rotina operacional minima

1. Rodar backup antes de mudancas relevantes.
2. Rodar smoke e healthcheck depois de mudancas.
3. So liberar operacao comercial quando smoke, healthcheck e dashboard estiverem coerentes.
4. Manter um backup recuperavel recente antes de qualquer onboarding de cliente.
