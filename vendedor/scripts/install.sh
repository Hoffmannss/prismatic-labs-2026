#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[Vendedor AI] Instalando dependencias..."
npm ci

echo "[Vendedor AI] Preparando estrutura local..."
mkdir -p data/crm data/leads data/mensagens data/metrics data/relatorios data/tracker data/learning config public

echo "[Vendedor AI] Executando preflight..."
node scripts/validate-env.js

echo "[Vendedor AI] Ambiente local pronto."
echo "  - Dashboard: npm run dashboard"
echo "  - Relatorio: npm run report"
echo "  - Readiness estrito: npm run readiness"
