# Vendedor AI

Base profissional inicial do projeto de automacao comercial da Prismatic Labs.

## Entradas principais

```bash
npm start
npm run dashboard
npm run scout
npm run report
npm test
npm run test:contracts
```

## Estrutura inicial

- `src/core`: coordenacao principal, autopilot e tracker estruturado.
- `src/agents`: wrappers e futuros modulos profissionais dos agentes, incluindo learner estruturado.
- `src/services`: servicos operacionais, incluindo dashboard e Notion.
- `src/domain`: contratos de status, eventos, regras do pipeline, guardrails e quotas operacionais.
- `src/utils`: acesso compartilhado a arquivos, JSON, retry/backoff e circuit breaker.
- `test`: testes de contrato para dashboard, guardrails, quotas, tracker e retry.
- `docs`: documentacao arquitetural.

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

## Observacao

Nesta fase, a estrutura nova funciona como camada profissional sobre os modulos legados, reduzindo risco de quebra enquanto a migracao interna e feita por etapas.
