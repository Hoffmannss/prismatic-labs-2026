# Operator Runbook

## Rotina diaria

1. Verificar `npm run healthcheck` no ambiente.
2. Conferir dashboard, quotas e leads para follow-up.
3. Revisar falhas de integracao e estado dos circuit breakers.
4. Avaliar leads bloqueados, perdidos e oportunidades abertas.
5. Rodar backup antes de mudancas relevantes de configuracao.

## Quando algo quebra

### Falha de credencial
- Revalidar `.env`.
- Rodar `npm run preflight`.
- Registrar quando a chave foi trocada e por quem.

### Falha de integracao externa
- Conferir stores em `data/metrics/`.
- Se circuit breaker abriu, nao insistir manualmente sem diagnostico.
- Validar fornecedor externo antes de reabrir operacao.

### Inconsistencia de pipeline
- Rodar `npm run smoke:e2e` para verificar espinha dorsal local.
- Conferir `data/crm/leads-database.json`, `pipeline.json` e eventos estruturados.
- Restaurar backup se houver corrupcao operacional.

## Rotina semanal

- Revisar quotas por cliente.
- Revisar taxa de resposta, oportunidade e fechamento.
- Revisar mensagens aprovadas versus performance real.
- Rever necessidade de aumentar ou reduzir guardrails.
