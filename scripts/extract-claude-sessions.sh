#!/bin/bash
# PSYCHE/OS - Extract from Claude Code sessions
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

mkdir -p "$OUTPUT_DIR"

SOURCE="${1:-$PSYCHE_CLAUDE_HISTORY}"
PROMPT_FILE="$PROMPT_DIR/extraction.txt"

if [ ! -e "$SOURCE" ]; then
  echo "ERROR: Source file not found: $SOURCE"
  echo "Usage: $0 [path-to-claude-history.md|path-to-session.jsonl|path-to-claude-dir]"
  echo "Or set: PSYCHE_CLAUDE_HISTORY=/path/to/file-or-dir"
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: Prompt file not found: $PROMPT_FILE"
  exit 1
fi

echo "=== Extract: Claude Sessions ==="
echo "CLI: $PSYCHE_CLI"
echo "Source: $SOURCE"

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT INT TERM
cat "$PROMPT_FILE" > "$TMP"
echo -e "\n\n--- SOURCE DATA (Claude Code Sessions) ---\n" >> "$TMP"
if [ -d "$SOURCE" ]; then
  find "$SOURCE" -maxdepth 1 -type f -name '*.jsonl' | sort | while IFS= read -r file; do
    printf '\n\n--- FILE: %s ---\n' "$file" >> "$TMP"
    head -c 200000 "$file" >> "$TMP"
  done
else
  head -c 200000 "$SOURCE" >> "$TMP"
fi

SIZE=$(/usr/bin/wc -c < "$TMP" | tr -d ' ')
echo "Input size: ${SIZE} bytes"

psyche_redact_secrets "$TMP"
psyche_llm_run "$TMP" "$OUTPUT_DIR/extraction-claude-sessions.json"
psyche_strip_fences "$OUTPUT_DIR/extraction-claude-sessions.json"
rm -f "$TMP"
