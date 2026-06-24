# Facebook → Transcript → Notion (Manus-like)

> **Canonical Cloud Agent session:** repo [Cursor-AI-Oncloud](https://github.com/Chai-saengnual/Cursor-AI-Oncloud) → `sessions/facebook-article-content/` (see `SESSION.md`). This copy in `sds-manager` is kept in sync for app development.

Extract and **understand** Facebook videos/reels, then save to your Notion **บทความ** database.

## Can I do the same as Manus?

**Yes — with the right mode:**

| Mode | What you need | Quality vs Manus |
|------|----------------|------------------|
| **Caption only** | Nothing extra | Same for Reels where full text is in the post (e.g. หมอปอนด์) |
| **`run-full.sh`** (OpenAI) | `OPENAI_API_KEY` | Good — Whisper API + GPT summarizes like Manus |
| **`run-full.sh --gemini`** | `GOOGLE_API_KEY` | **Closest** — watches the actual video (audio + visuals) |

Manus ≈ **download video + multimodal AI + structured report**.  
This folder automates that inside Cursor.

## Quick start

```bash
cd scripts/facebook-to-notion
pip3 install --user -r requirements.txt   # once

# Manus-like (recommended) — needs OpenAI key
export OPENAI_API_KEY=sk-...
./run-full.sh "https://www.facebook.com/share/v/1NnqQQwRFy/?mibextid=wwXIfr"

# Closest to Manus — needs Google AI key
export GOOGLE_API_KEY=...
./run-full.sh "https://www.facebook.com/share/v/..." --gemini
```

Outputs in `facebook-extract-out/`:

| File | Use |
|------|-----|
| `manus-style-analysis.md` | Full report (like Manus export) |
| `analysis.json` | Notion properties + body |
| `notion-draft.md` | Ready for Cursor to push to Notion |

Then in **Cursor**: *“Add to บทความ from `scripts/facebook-to-notion/facebook-extract-out/manus-style-analysis.md`”*

## Step-by-step (manual)

```bash
# 1) Extract audio + transcript
python extract.py "URL" --transcriber openai   # or local (free, no API key)

# 2) Analyze (Manus-style structure)
export OPENAI_API_KEY=sk-...
python analyze.py -o ./facebook-extract-out

# Gemini (video understanding)
python extract.py "URL" --download-video
export GOOGLE_API_KEY=...
python analyze.py -o ./facebook-extract-out --mode gemini
```

## Cursor workflow (no terminal)

1. Paste Facebook URL in chat.
2. Say: **“Run run-full.sh on this URL and add to Notion บทความ”**
3. Agent runs the script (you add API keys in Cursor **Secrets** / env).

Put keys in project `.env` (gitignored) or cloud agent secrets:

```bash
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...   # optional, for --gemini
```

## Requirements

- Python 3.10+, `ffmpeg`
- `pip install -r requirements.txt`
- Public Facebook posts (private → `yt-dlp --cookies cookies.txt`)

## Cost (approx.)

| Step | OpenAI |
|------|--------|
| Whisper API (~2 min audio) | ~$0.01 |
| GPT-4o-mini analysis | ~$0.01 |
| Gemini video (~2 min) | Google free tier often enough |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Wrong topic (like our first Whisper draft) | Use `run-full.sh` or `--gemini` — LLM fixes transcript errors |
| Poor Thai transcript | `--transcriber openai` |
| `Video unavailable` | Export Facebook cookies for yt-dlp |
| Reel has full caption in post | `python extract.py URL --metadata-only` — skip transcription |

## Why local Whisper alone isn’t enough

Local Whisper heard “parent–child rules” on a video about **couple dynamics**.  
Manus (and `--analyze` / Gemini) use **reasoning over the full context**, not raw transcript only.
