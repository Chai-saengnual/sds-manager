#!/usr/bin/env bash
# Scaffold a new Cursor Cloud Agent session from _template.
#
# Usage:
#   ./scripts/new-session.sh my-session-slug "My Session Title"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="${1:-}"
TITLE="${2:-}"

if [[ -z "$SLUG" || -z "$TITLE" ]]; then
  echo "Usage: $0 <session-slug> \"Session Title\""
  echo "Example: $0 notion-weekly-review \"Notion weekly review\""
  exit 1
fi

if [[ ! "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Slug must be lowercase kebab-case (e.g. my-new-session)"
  exit 1
fi

DEST="${ROOT}/sessions/${SLUG}"
if [[ -e "$DEST" ]]; then
  echo "Already exists: $DEST"
  exit 1
fi

cp -r "${ROOT}/sessions/_template" "$DEST"
rm -f "${DEST}/scripts/.gitkeep" 2>/dev/null || true
mkdir -p "${DEST}/scripts"

# Replace placeholders
while IFS= read -r -d '' f; do
  sed -i "s/{{SESSION_SLUG}}/${SLUG}/g; s/{{SESSION_TITLE}}/${TITLE}/g" "$f"
done < <(find "$DEST" -type f \( -name '*.md' -o -name '*.mdc' -o -name '*.json' \) -print0)

mv "${DEST}/.cursor/rules/session.mdc" "${DEST}/.cursor/rules/${SLUG}.mdc"

echo "Created session: ${DEST}"
echo "Next:"
echo "  1. Edit ${DEST}/SESSION.md"
echo "  2. Add scripts/ if needed"
echo "  3. Register in README.md sessions table"
