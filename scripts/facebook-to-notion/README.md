# Facebook → Transcript → Notion

Extract spoken content from Facebook videos/reels when captions are not in the page HTML.

## Requirements

- Python 3.10+
- `ffmpeg` (system)
- pip packages in `requirements.txt`

## Setup

```bash
cd scripts/facebook-to-notion
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
# Full pipeline: metadata + audio download + Thai transcription (default: small model)
python extract.py "https://www.facebook.com/share/v/1NnqQQwRFy/?mibextid=wwXIfr"

# Faster draft (lower accuracy for Thai)
python extract.py "URL" -o ./my-out --model base

# Metadata only (no download)
python extract.py "URL" --metadata-only
```

## Outputs

| File | Description |
|------|-------------|
| `metadata.json` | Title, uploader, description, duration, URL |
| `transcript.txt` | Whisper transcription |
| `notion-draft.md` | Markdown draft for your Notion article DB |

## Notion workflow (Cursor)

1. Run `extract.py` on the Facebook URL.
2. Review `transcript.txt` and edit `notion-draft.md` if needed.
3. In Cursor, ask the agent to add/update a row in your **บทความ** database using the draft.

## Notes

- **Public videos** usually work without login. Private or login-walled posts may fail; export cookies for `yt-dlp` if needed (`--cookies cookies.txt`).
- Reels with full text in `og:title` (e.g. some creator pages) may not need transcription — metadata-only is enough.
- First run downloads the Whisper model (~150MB for `base`).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Video unavailable` | Post may be private; try cookies or a different URL format |
| Poor Thai accuracy | Use `--model small` |
| Slow transcription | Use `--model tiny` for drafts |
