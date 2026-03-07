#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
MODE="${1:-create}"
TARGET="${2:-}"

mkdir -p "$BACKUP_DIR"

create_backup() {
  local archive="$BACKUP_DIR/vendedor-backup-$STAMP.tar.gz"
  echo "[Vendedor AI] Criando backup em $archive"
  tar -czf "$archive" \
    -C "$ROOT_DIR" \
    data config .env .env.example package.json package-lock.json 2>/dev/null || \
  tar -czf "$archive" \
    -C "$ROOT_DIR" \
    data config .env.example package.json package-lock.json
  echo "[Vendedor AI] Backup criado: $archive"
}

restore_backup() {
  if [ -z "$TARGET" ]; then
    TARGET="$(ls -1t "$BACKUP_DIR"/vendedor-backup-*.tar.gz 2>/dev/null | head -n 1 || true)"
  fi

  if [ -z "$TARGET" ] || [ ! -f "$TARGET" ]; then
    echo "[Vendedor AI] Backup nao encontrado para restore."
    exit 1
  fi

  echo "[Vendedor AI] Restaurando backup: $TARGET"
  tar -xzf "$TARGET" -C "$ROOT_DIR"
  echo "[Vendedor AI] Restore concluido."
}

case "$MODE" in
  create)
    create_backup
    ;;
  restore)
    restore_backup
    ;;
  *)
    echo "Uso: bash scripts/backup.sh [create|restore] [arquivo-backup-opcional]"
    exit 1
    ;;
esac
