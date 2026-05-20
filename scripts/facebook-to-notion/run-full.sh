#!/usr/bin/env bash
# Manus-like pipeline: extract → analyze → ready for Notion
#
# Usage:
#   OPENAI_API_KEY=sk-... ./run-full.sh "FACEBOOK_URL"
#   GOOGLE_API_KEY=... ./run-full.sh "FACEBOOK_URL" --gemini
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="${HOME}/.local/bin:${PATH}"

GEMINI=0
URL=""
for arg in "$@"; do
  if [[ "$arg" == "--gemini" ]]; then
    GEMINI=1
  elif [[ -z "$URL" ]]; then
    URL="$arg"
  fi
done

[[ -n "$URL" ]] || { echo "Usage: run-full.sh [--gemini] FACEBOOK_URL"; exit 1; }

if [[ "$GEMINI" -eq 1 ]]; then
  python3 "${DIR}/extract.py" "$URL" --download-video --transcriber openai --analyze --analyze-mode gemini
else
  python3 "${DIR}/extract.py" "$URL" --transcriber openai --analyze --analyze-mode openai
fi

echo ""
echo "=== Done ==="
echo "Review: ${DIR}/facebook-extract-out/manus-style-analysis.md"
echo "Then ask Cursor: add to Notion บทความ from manus-style-analysis.md"
