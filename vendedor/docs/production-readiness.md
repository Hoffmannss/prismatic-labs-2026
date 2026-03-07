# Production Readiness

## Situacao honesta

O projeto ja saiu da fase de script solto e entrou na fase de stack operacional organizada, mas ainda nao deve ser vendido como produto plug-and-play sem a camada abaixo estar fechada.

## Minimo para operar internamente

- `npm ci` executa sem erro.
- `npm run preflight` passa com sucesso.
- `npm run test:contracts` passa.
- `npm run smoke:report` sobe leitura do pipeline sem quebrar.
- `npm run smoke:e2e` valida o fluxo isolado com fixture e restaura os arquivos operacionais ao final.
- `npm run healthcheck` confirma stores, arquivos base e variaveis essenciais.
- `.env` existe com `GROQ_API_KEY` e `APIFY_API_TOKEN` validos.
- Dashboard abre localmente e responde em `/api/stats`, `/api/guardrails` e `/api/quotas`.
- Fluxo de analyze -> qa -> sent -> tracker foi validado com pelo menos 3 leads de teste reais depois do smoke isolado.

## Minimo para vender

- Onboarding guiado para cliente nao tecnico, com setup de credenciais e checklist operacional.
- Deploy repetivel, com script de instalacao, preflight, smoke test, backup e validacao de ambiente.
- Observabilidade minima, com logs organizados, alarmes para falha de integrações e monitoramento de quota.
- Backup e restore testados do diretório `data/` e das configuracoes `config/`.
- Politica de suporte: o que a Prismatic opera, o que o cliente opera e quais limites de SLA existem.
- Aprovacao/auditoria por canal e campanha antes de liberar automacao plena em contas reais.
- Modelo minimo por cliente documentado, mesmo antes da configuracao multi-conta existir no codigo.

## Go-to-market recomendado

### Fase 1 — Operacao assistida
- Prismatic opera o sistema para os primeiros clientes.
- Autopilot fica sob guardrails conservadores.
- Dashboard e tracker servem como cockpit humano.

### Fase 2 — Produto assistido
- Cliente recebe onboarding com ambiente provisionado.
- Quotas, canais e campanhas passam a ser configuraveis por conta.
- Alertas e backups deixam de ser manuais.

### Fase 3 — Escala vendavel
- Provisionamento padronizado.
- Healthcheck, logs e backup auditaveis.
- Processo comercial repetivel com proposta, setup, ativacao e handoff claros.

## Ordem dura de execucao

1. Fechar onboarding e checklist de ativacao.
2. Adicionar observabilidade e restore drills.
3. Implementar conta/canal/campanha no codigo.
4. Automatizar deploy por ambiente.
5. So depois acelerar vendas.
