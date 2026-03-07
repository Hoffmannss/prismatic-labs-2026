# Client Activation Checklist

## Antes de ativar

- [ ] `.env` configurado com segredos reais do ambiente.
- [ ] `npm ci` executado.
- [ ] `npm run preflight` sem erro.
- [ ] `npm run test:contracts` sem erro.
- [ ] `npm run smoke:e2e` sem erro.
- [ ] `npm run healthcheck` sem erro.
- [ ] `npm run backup:create` executado e arquivo gerado.
- [ ] Dashboard acessivel e coerente.
- [ ] `config/guardrails.json` revisado para o perfil do cliente.
- [ ] Owner tecnico e owner comercial definidos.

## Primeira semana

- [ ] Operar com quotas reduzidas.
- [ ] Revisar manualmente mensagens aprovadas.
- [ ] Checar stores de quotas e circuit breakers em `data/metrics/`.
- [ ] Revisar taxa de resposta e bloqueios no tracker.
- [ ] Confirmar se follow-ups nao estao extrapolando a politica comercial.

## Antes de escalar

- [ ] Pelo menos 3 leads reais percorreram analyze -> qa -> sent -> tracker sem inconsistencias.
- [ ] Backup e restore foram testados em ambiente nao produtivo.
- [ ] Cliente aprovou linguagem, ICP e limites de outreach.
- [ ] Operacao comercial tem rotina de acompanhamento semanal.
