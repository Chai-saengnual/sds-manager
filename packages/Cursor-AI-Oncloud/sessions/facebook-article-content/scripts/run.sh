#!/usr/bin/env bash
# Run from repo root or this directory. Installs deps to user site if needed.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="${HOME}/.local/bin:${PATH}"

if ! python3 -c "import yt_dlp" 2>/dev/null; then
  echo "Installing Python dependencies..."
  pip3 install --user -q -r "${DIR}/requirements.txt"
fi

exec python3 "${DIR}/extract.py" "$@"
