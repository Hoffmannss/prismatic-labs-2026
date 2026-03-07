# Client Onboarding

## Objetivo

Onboarding nao pode depender de memoria do operador. Este documento define o minimo necessario para ativar um cliente sem improviso.

## Entradas obrigatorias do cliente

- Nome da conta/cliente.
- Nicho principal e subnichos permitidos.
- Canal inicial de operacao (ex.: Instagram DM, WhatsApp, email).
- Oferta principal e ticket medio esperado.
- ICP basico: quem pode receber outreach e quem nao pode.
- Regras de compliance e limites de linguagem.
- Credenciais aprovadas para Groq, Apify, Notion e acessos auxiliares.
- Responsavel operacional do lado do cliente.

## Sequencia de onboarding

1. Preencher `config/client-profile.example.json` como base para a conta.
2. Validar credenciais no ambiente com `npm run preflight` e `npm run healthcheck`.
3. Ajustar guardrails em `config/guardrails.json` para quota, score minimo e limites de follow-up.
4. Rodar `npm run smoke:e2e` antes de qualquer operacao real.
5. Fazer ativacao assistida com lote pequeno e supervisao humana.

## Regras para ativacao inicial

- Comecar com quotas conservadoras.
- Nao liberar autopilot agressivo no dia 1.
- Exigir aprovacao humana das mensagens ate o cliente passar pela fase assistida.
- Registrar owner da conta, owner tecnico e owner comercial.

## Criterio de saida do onboarding

O onboarding so termina quando ambiente, credenciais, smoke test, dashboard, backup e responsaveis operacionais estiverem todos confirmados.
