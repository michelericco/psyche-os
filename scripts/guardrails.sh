#!/bin/bash
# PSYCHE/OS Guardrails: block risky repository actions.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

print_header() {
  echo "=== PSYCHE/OS Guardrails ==="
}

print_blocked() {
  local blocked="$1"
  echo "ERROR: Operazione bloccata. Sono presenti file sensibili nello stage:"
  echo "$blocked" | sed 's/^/- /'
  echo ""
  echo "Rimuovi i file dallo stage con:"
  echo "  git restore --staged <path>"
}

list_staged_files() {
  git diff --cached --name-only --diff-filter=ACMRTUXB
}

validate_staged() {
  local staged
  staged="$(list_staged_files || true)"

  if [ -z "$staged" ]; then
    echo "OK: Nessun file staged da validare."
    return 0
  fi

  local blocked=""
  local path

  while IFS= read -r path; do
    case "$path" in
      sources/*|extractions/*|psyche_extraction.json|psyche_os_extraction.json|.env|.env.*|\
      *.key|*.pem|*.crt|*.p12|*.pfx|*.cer|*.der|\
      .git/config|.gitconfig|\
      *id_rsa*|*id_ed25519*|*id_ecdsa*)
        blocked+="$path"$'\n'
        ;;
      output/*)
        if [ "$path" != "output/.gitkeep" ]; then
          blocked+="$path"$'\n'
        fi
        ;;
    esac
  done <<< "$staged"

  if [ -n "$blocked" ]; then
    print_blocked "${blocked%$'\n'}"
    return 1
  fi

  echo "OK: Nessun path sensibile nello stage."
}

main() {
  cd "$PROJECT_DIR"
  print_header

  case "${1:---check-staged}" in
    --check|--check-staged)
      validate_staged
      ;;
    *)
      echo "Usage: bash scripts/guardrails.sh [--check-staged|--check]"
      exit 2
      ;;
  esac
}

main "$@"
