#!/bin/bash
# Auto-push with guardrails. Requires explicit opt-in.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ "${AUTO_PUSH_ENABLED:-0}" != "1" ]; then
  echo "Auto-push disabilitato. Per abilitarlo usa: AUTO_PUSH_ENABLED=1 bash auto-push.sh"
  exit 1
fi

BRANCH="${AUTO_PUSH_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
INTERVAL_SECONDS="${AUTO_PUSH_INTERVAL_SECONDS:-60}"

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  if [ "${AUTO_PUSH_ALLOW_PROTECTED:-0}" != "1" ]; then
    echo "Branch protetto ($BRANCH)."
    echo "Per consentire auto-push su branch protetti: AUTO_PUSH_ALLOW_PROTECTED=1"
    exit 1
  fi
fi

echo "[auto-push] branch=$BRANCH interval=${INTERVAL_SECONDS}s"

while true; do
  git add -A

  if ! bash scripts/guardrails.sh --check-staged; then
    echo "[auto-push] guardrails bloccano il push; rimozione stage e riprovo tra ${INTERVAL_SECONDS}s"
    git restore --staged . 2>/dev/null || git reset HEAD . 2>/dev/null || true
    sleep "$INTERVAL_SECONDS"
    continue
  fi

  if git diff --cached --quiet; then
    echo "[auto-push] nessuna modifica da committare"
    sleep "$INTERVAL_SECONDS"
    continue
  fi

  git commit -m "Auto-commit $(date '+%Y-%m-%d %H:%M:%S')"
  git push origin "$BRANCH"

  echo "[auto-push] modifiche inviate su $BRANCH a $(date '+%H:%M:%S')"
  sleep "$INTERVAL_SECONDS"
done
