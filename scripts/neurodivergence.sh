#!/bin/bash
# PSYCHE/OS - Neurodivergence screening (requires all 3 extractions)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_config.sh"
PROMPT_FILE="$PROMPT_DIR/neurodivergence.txt"

# Verify extractions exist
for f in extraction-claude-sessions.json extraction-codex-sessions.json extraction-social-traces.json; do
  if [ ! -f "$OUTPUT_DIR/$f" ]; then
    echo "ERROR: Missing extraction: $OUTPUT_DIR/$f"
    echo "Run the individual extraction scripts first."
    exit 1
  fi
done

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: Prompt file not found: $PROMPT_FILE"
  exit 1
fi

echo "=== Neurodivergence Screening ==="
echo "CLI: $PSYCHE_CLI"

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT INT TERM
cat "$PROMPT_FILE" > "$TMP"

echo -e "\n\n--- EXTRACTION: claude-sessions ---\n" >> "$TMP"
head -c 80000 "$OUTPUT_DIR/extraction-claude-sessions.json" >> "$TMP"
echo -e "\n\n--- EXTRACTION: codex-sessions ---\n" >> "$TMP"
head -c 80000 "$OUTPUT_DIR/extraction-codex-sessions.json" >> "$TMP"
echo -e "\n\n--- EXTRACTION: social-traces ---\n" >> "$TMP"
head -c 60000 "$OUTPUT_DIR/extraction-social-traces.json" >> "$TMP"

SIZE=$(/usr/bin/wc -c < "$TMP" | tr -d ' ')
echo "Input size: ${SIZE} bytes"

psyche_llm_run "$TMP" "$OUTPUT_DIR/neurodivergence-screening.json" 3
psyche_strip_fences "$OUTPUT_DIR/neurodivergence-screening.json"
rm -f "$TMP"
