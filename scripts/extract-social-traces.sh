#!/bin/bash
# PSYCHE/OS - Extract from X/Twitter bookmarks and YouTube history
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

mkdir -p "$OUTPUT_DIR"
PROMPT_FILE="$PROMPT_DIR/extraction.txt"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: Prompt file not found: $PROMPT_FILE"
  exit 1
fi

echo "=== Extract: Social Traces ==="
echo "CLI: $PSYCHE_CLI"

# Combine social media sources
TMP=""  # initialized for trap coverage before SOCIAL_TEMP creation
SOCIAL_TEMP=$(mktemp)
trap 'rm -f "$SOCIAL_TEMP"; [ -n "${TMP:-}" ] && rm -f "$TMP"' EXIT INT TERM

if [ -f "$SOURCES_DIR/twitter/bookmarks-stats.md" ]; then
  cat "$SOURCES_DIR/twitter/bookmarks-stats.md" > "$SOCIAL_TEMP"
fi

if [ -f "$SOURCES_DIR/twitter/bookmarks-by-topic.md" ]; then
  echo -e "\n\n--- TWITTER BOOKMARKS BY TOPIC ---\n" >> "$SOCIAL_TEMP"
  head -c 300000 "$SOURCES_DIR/twitter/bookmarks-by-topic.md" >> "$SOCIAL_TEMP"
fi

for f in watch-history.md subscriptions.md search-history.md; do
  if [ -f "$SOURCES_DIR/youtube/$f" ]; then
    echo -e "\n\n--- YOUTUBE: $f ---\n" >> "$SOCIAL_TEMP"
    cat "$SOURCES_DIR/youtube/$f" >> "$SOCIAL_TEMP"
  fi
done

SOCIAL_SIZE=$(/usr/bin/wc -c < "$SOCIAL_TEMP" | tr -d ' ')
echo "Combined social media: ${SOCIAL_SIZE} bytes"

TMP=$(mktemp)
cat "$PROMPT_FILE" > "$TMP"
echo -e "\n\n--- SOURCE DATA (X/Twitter Bookmarks + YouTube) ---\n" >> "$TMP"
head -c 500000 "$SOCIAL_TEMP" >> "$TMP"
rm -f "$SOCIAL_TEMP"

SIZE=$(/usr/bin/wc -c < "$TMP" | tr -d ' ')
echo "Input size: ${SIZE} bytes"

psyche_redact_secrets "$TMP"
psyche_llm_run "$TMP" "$OUTPUT_DIR/extraction-social-traces.json"
psyche_strip_fences "$OUTPUT_DIR/extraction-social-traces.json"
rm -f "$TMP"
