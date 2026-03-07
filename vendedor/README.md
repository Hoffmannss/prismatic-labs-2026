# Vendedor AI

Base profissional inicial do projeto de automacao comercial da Prismatic Labs.

## Entradas principais

```bash
npm start
npm run dashboard
npm run scout
npm run report
```

## Estrutura inicial

- `src/core`: coordenacao principal do sistema e tracker estruturado.
- `src/agents`: wrappers e futuros modulos profissionais dos agentes.
- `src/services`: servicos operacionais, incluindo dashboard e Notion.
- `src/domain`: contratos de status, eventos e regras do pipeline.
- `docs`: documentacao arquitetural.

## O que ja ficou profissional

- Entry point novo em `src/core/orchestrator.js`.
- Tracker central em `src/core/tracker.js`.
- Status canonicos e regras de transicao em `src/domain/`.
- Wrappers estruturados para manter compatibilidade com os modulos legados.

## Observacao

Nesta fase, a estrutura nova funciona como camada profissional sobre os modulos legados, reduzindo risco de quebra enquanto a migracao interna e feita por etapas.
