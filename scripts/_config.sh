#!/bin/bash
# PSYCHE/OS Pipeline Configuration
# Override any variable via environment before running scripts.

# --- AI CLI ---
# Supported: claude, codex, gemini
# Each has slightly different flags. The wrapper function below normalizes them.
PSYCHE_CLI="${PSYCHE_CLI:-claude}"
# Whitelist: reject any value not in the supported set to prevent command injection.
case "$PSYCHE_CLI" in
  claude|codex|gemini) ;;
  *)
    echo "ERROR: Invalid PSYCHE_CLI='$PSYCHE_CLI'. Must be: claude, codex, or gemini." >&2
    exit 1
    ;;
esac

# --- Source paths ---
# Relative to the project's parent directory by default.
# Override with absolute paths if your sources are elsewhere.
SCRIPT_DIR="${SCRIPT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
OUTPUT_DIR="${OUTPUT_DIR:-$PROJECT_DIR/output}"
SOURCES_DIR="${PSYCHE_SOURCES_DIR:-$(cd "$PROJECT_DIR/.." 2>/dev/null && pwd)/sources}"
PROMPT_DIR="${PROMPT_DIR:-$PROJECT_DIR/web/src/prompts}"

PSYCHE_CLAUDE_HISTORY="${PSYCHE_CLAUDE_HISTORY:-$SOURCES_DIR/claude/markdown/claude-history.md}"
PSYCHE_CODEX_HISTORY="${PSYCHE_CODEX_HISTORY:-$SOURCES_DIR/codex/markdown/codex-history.md}"

# --- Budget ---
PSYCHE_MAX_BUDGET="${PSYCHE_MAX_BUDGET:-5}"
PSYCHE_SKIP_PERMISSIONS="${PSYCHE_SKIP_PERMISSIONS:-0}"

# --- CLI wrapper ---
# Normalizes different CLI tools into a single interface.
# Usage: psyche_llm_run <input_file> <output_file> [max_budget]
psyche_llm_run() {
  local input_file="$1"
  local output_file="$2"
  local max_budget="${3:-$PSYCHE_MAX_BUDGET}"
  local log_file
  log_file=$(mktemp "/tmp/psyche-XXXXXX.log") || { echo "ERROR: mktemp failed" >&2; return 1; }

  case "$PSYCHE_CLI" in
    claude)
      local claude_args=(
        -p
        --model sonnet
        --max-budget-usd "$max_budget"
        --no-session-persistence
        -
      )
      if [ "$PSYCHE_SKIP_PERMISSIONS" = "1" ]; then
        claude_args=(--dangerously-skip-permissions "${claude_args[@]}")
      fi
      cat "$input_file" | claude "${claude_args[@]}" > "$output_file" 2>"$log_file"
      ;;
    codex)
      cat "$input_file" | codex -p \
        --model o4-mini \
        - > "$output_file" 2>"$log_file"
      ;;
    gemini)
      cat "$input_file" | gemini -p \
        --model gemini-2.5-pro \
        - > "$output_file" 2>"$log_file"
      ;;
    *)
      echo "ERROR: Unknown CLI '$PSYCHE_CLI'. Set PSYCHE_CLI to: claude, codex, or gemini"
      exit 1
      ;;
  esac

  local exit_code=$?
  local size=$(/usr/bin/wc -c < "$output_file" | tr -d ' ')

  if [ $exit_code -eq 0 ] && [ "$size" -gt 100 ]; then
    echo "Done! Output: $output_file (${size} bytes)"
  else
    echo "FAILED (exit=$exit_code, size=$size)"
    echo "Log: $log_file"
    cat "$log_file" 2>/dev/null | tail -10
    return 1
  fi
}

# --- Strip markdown fences from JSON output ---
psyche_strip_fences() {
  local file="$1"
  # Pass the path as sys.argv[1] — never interpolate file paths into Python source code.
  python3 -c "
import sys, re
path = sys.argv[1]
text = open(path, encoding='utf-8').read()
text = re.sub(r'^\s*\x60\x60\x60json?\s*\n', '', text)
text = re.sub(r'\n\s*\x60\x60\x60\s*$', '', text)
open(path, 'w', encoding='utf-8').write(text)
" -- "$file" 2>/dev/null || true
}
