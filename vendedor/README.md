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
- `src/domain`: contratos de status, eventos, regras do pipeline e guardrails operacionais.
- `src/utils`: acesso compartilhado a arquivos e JSON.
- `test`: testes de contrato iniciais para dashboard e guardrails.
- `docs`: documentacao arquitetural.

## O que ja ficou profissional

- Entry point novo em `src/core/orchestrator.js`.
- Tracker central em `src/core/tracker.js`, agora com pipeline e outcomes de DM no mesmo nucleo.
- Dashboard migrado para `src/services/dashboard-api.js`.
- Autopilot migrado para `src/core/autopilot.js`.
- Learner migrado para `src/agents/learner.js` com consumo de eventos estruturados.
- Guardrails operacionais configurados em `config/guardrails.json`.
- Status canonicos e regras de transicao em `src/domain/`.
- Wrappers estruturados para manter compatibilidade com os modulos legados.

## Observacao

Nesta fase, a estrutura nova funciona como camada profissional sobre os modulos legados, reduzindo risco de quebra enquanto a migracao interna e feita por etapas.
