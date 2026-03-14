#!/bin/bash
# Install/uninstall/status for optional local pre-commit hook.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOK_SOURCE="$PROJECT_DIR/.githooks/pre-commit"
HOOK_TARGET="$PROJECT_DIR/.git/hooks/pre-commit"

usage() {
  echo "Usage: bash scripts/install-git-hook.sh [--install|--uninstall|--status]"
}

ensure_repo() {
  if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo "ERROR: .git directory not found in $PROJECT_DIR"
    exit 1
  fi
}

install_hook() {
  ensure_repo
  if [ ! -f "$HOOK_SOURCE" ]; then
    echo "ERROR: Hook source not found: $HOOK_SOURCE"
    exit 1
  fi

  install -m 0755 "$HOOK_SOURCE" "$HOOK_TARGET"
  echo "Installed pre-commit hook at: $HOOK_TARGET"
  echo "Disable temporarily for one commit: SKIP_GUARDRAILS=1 git commit ..."
}

uninstall_hook() {
  ensure_repo
  if [ -f "$HOOK_TARGET" ]; then
    rm -f "$HOOK_TARGET"
    echo "Removed pre-commit hook: $HOOK_TARGET"
  else
    echo "No pre-commit hook installed at: $HOOK_TARGET"
  fi
}

status_hook() {
  ensure_repo
  if [ -f "$HOOK_TARGET" ]; then
    echo "pre-commit hook: INSTALLED"
    ls -l "$HOOK_TARGET"
  else
    echo "pre-commit hook: NOT INSTALLED"
  fi
}

main() {
  case "${1:---install}" in
    --install)
      install_hook
      ;;
    --uninstall)
      uninstall_hook
      ;;
    --status)
      status_hook
      ;;
    *)
      usage
      exit 2
      ;;
  esac
}

main "$@"
