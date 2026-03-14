#!/bin/bash
# PSYCHE/OS - Extract from Codex CLI sessions
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

mkdir -p "$OUTPUT_DIR"

SOURCE="${1:-$PSYCHE_CODEX_HISTORY}"
PROMPT_FILE="$PROMPT_DIR/extraction.txt"

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: Source file not found: $SOURCE"
  echo "Usage: $0 [path-to-codex-history.md|path-to-history.jsonl]"
  echo "Or set: PSYCHE_CODEX_HISTORY=/path/to/file"
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: Prompt file not found: $PROMPT_FILE"
  exit 1
fi

echo "=== Extract: Codex Sessions ==="
echo "CLI: $PSYCHE_CLI"
echo "Source: $SOURCE"

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT INT TERM
cat "$PROMPT_FILE" > "$TMP"
echo -e "\n\n--- SOURCE DATA (Codex CLI Sessions) ---\n" >> "$TMP"
head -c 200000 "$SOURCE" >> "$TMP"

SIZE=$(/usr/bin/wc -c < "$TMP" | tr -d ' ')
echo "Input size: ${SIZE} bytes"

psyche_redact_secrets "$TMP"
psyche_llm_run "$TMP" "$OUTPUT_DIR/extraction-codex-sessions.json"
psyche_strip_fences "$OUTPUT_DIR/extraction-codex-sessions.json"
rm -f "$TMP"
