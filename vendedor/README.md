# Vendedor AI

Base profissional inicial do projeto de automacao comercial da Prismatic Labs.

## Entradas principais

```bash
npm start
npm run dashboard
npm run scout
npm run report
npm run preflight
npm run smoke:e2e
npm run healthcheck
npm run backup:create
npm run readiness
npm test
npm run test:contracts
```

## Setup local rapido

```bash
cp .env.example .env
npm run install:local
npm run smoke:e2e
npm run healthcheck
npm run dashboard
```

## Estrutura inicial

- `src/core`: coordenacao principal, autopilot e tracker estruturado.
- `src/agents`: wrappers e futuros modulos profissionais dos agentes, incluindo learner estruturado.
- `src/services`: servicos operacionais, incluindo dashboard e Notion.
- `src/domain`: contratos de status, eventos, regras do pipeline, guardrails e quotas operacionais.
- `src/utils`: acesso compartilhado a arquivos, JSON, retry/backoff e circuit breaker.
- `scripts`: instalacao local, preflight operacional, smoke test, backup/restore e healthcheck.
- `test`: testes de contrato e fixtures operacionais.
- `docs`: documentacao arquitetural, readiness e deploy.

## O que ja ficou profissional

- Entry point novo em `src/core/orchestrator.js`.
- Tracker central em `src/core/tracker.js`, com autoridade sobre estados, outcomes e contabilidade de envio/followup.
- Dashboard migrado para `src/services/dashboard-api.js`.
- Autopilot migrado para `src/core/autopilot.js` com guardrails, retry policy e circuit breaker.
- Learner migrado para `src/agents/learner.js` com consumo de eventos estruturados.
- Guardrails operacionais configurados em `config/guardrails.json`.
- Quotas diarias persistidas em `data/metrics/daily-quotas.json`.
- Status canonicos e regras de transicao em `src/domain/`.
- Wrappers estruturados para manter compatibilidade com os modulos legados.
- Preflight de ambiente em `scripts/validate-env.js`.
- Smoke test isolado em `scripts/smoke-test.js`.
- Backup/restore em `scripts/backup.sh`.
- Healthcheck operacional em `scripts/healthcheck.js`.
- Checklist de readiness em `docs/production-readiness.md`.
- Guia de deploy em `docs/deployment.md`.

## O que ainda falta antes de vender em escala

- Deploy automatizado por cliente ou ambiente.
- Observabilidade, backup/restore testado em rotina e alertas.
- Onboarding comercial e tecnico sem dependencia direta de engenharia.
- Configuracao por canal/campanha/conta.
- Processo comercial e suporte com SLA claros.

## Observacao

Nesta fase, a estrutura nova funciona como camada profissional sobre os modulos legados, reduzindo risco de quebra enquanto a migracao interna e feita por etapas.
