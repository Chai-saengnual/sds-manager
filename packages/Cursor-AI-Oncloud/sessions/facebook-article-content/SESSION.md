# Session: Facebook article content

**Use this file as the Cloud Agent playbook** when the user says *Add article* + a Facebook URL.

## Goal

Turn a Facebook **video/reel** or **text post** into a structured page in Notion **Chai Article** (บทความ) with:

- Properties: Name, Summary, Key Takeaways (HTML `<br>` bullets), Personal Action, Link, Source, Category, etc.
- Body: callout, tables for numbered lists, full transcript or post text, related links

Config: `notion-config.json` in this folder.

## User prompt (examples)

- `Add article https://www.facebook.com/share/v/...`
- `Add article https://www.facebook.com/share/p/...`

## Workflow

### 1. Resolve content type

| URL pattern | Type | First step |
|-------------|------|------------|
| `/share/v/`, `/reel/`, `/watch` | Video/reel | OG + optional transcribe |
| `/share/p/`, `story.php` | Text/image post | `fetch_og.py` with Twitterbot; WebFetch permalink if needed |

```bash
cd sessions/facebook-article-content
python3 fetch_og.py "SHARE_URL" --json
```

### 2. Video/reel pipeline

```bash
cd sessions/facebook-article-content/scripts
pip3 install --user -r requirements.txt   # once; needs ffmpeg

# Quick (free): local Whisper
python3 extract.py "URL" -o ./out --model small --language th   # Thai
python3 extract.py "URL" -o ./out --model small --language en   # English

# Caption-only (หมอปอนด์-style full text in post)
python3 extract.py "URL" --metadata-only

# Manus-like (recommended when API keys available)
export OPENAI_API_KEY=sk-...
./run-full.sh "URL"
# or: GOOGLE_API_KEY=... ./run-full.sh "URL" --gemini
```

**OG shortcut (no yt-dlp):**

```bash
curl -sL -A "facebookexternalhit/1.1" "URL" | grep -oP 'og:(title|description)" content="\K[^"]+'
```

For `/share/p/` posts, use **Twitterbot** if externalhit returns login wall:

```bash
curl -sL -A "Twitterbot/1.0" "URL"
```

### 3. Build Notion page (MCP)

1. Call `notion-create-pages` with parent `data_source_id` from `notion-config.json`.
2. Match style of existing articles: emoji icon, blue callout, tables, Thai Summary/Key Takeaways, English transcript block.
3. Set `Link` and `Source` to the **share URL** the user pasted.
4. Link **related** pages (same creator, same theme) when you find them via `notion-search`.

### 4. Property templates

```json
{
  "Name": "<Title> — <Creator>",
  "Media Type": "Article",
  "Category": "MindSet",
  "Publisher": "Indie",
  "Status": "Ready to Start",
  "Review Status": "To Review",
  "Reading Priority": "Medium",
  "Description": "Facebook ... — one line",
  "Link": "<user share URL>",
  "Source": "<user share URL>",
  "Summary": "Thai 2-4 sentences",
  "Key Takeaways": "- point<br>- point",
  "Personal Action": "Thai concrete action this week",
  "date:Publishing/Release Date:start": "YYYY-MM-DD",
  "date:Publishing/Release Date:is_datetime": 0
}
```

Use `Publisher: TheCoach.in.th` (or page name) when source is a known page.

## Pitfalls

| Issue | Fix |
|-------|-----|
| Same OG caption, different videos (e.g. Ryan Moresby-White) | **Always transcribe** — do not trust caption alone |
| `/share/p/` login wall | `fetch_og.py` or Twitterbot UA; WebFetch permalink from `og:url` |
| yt-dlp "registered users only" | Use OG + WebFetch for text posts; cookies for private videos |
| Whisper Thai errors | `--model small`, or `--transcriber openai` |
| Wrong Notion page updated | Verify page ID / Name before `notion-update-page` |
| Text post (no video) | No `extract.py`; use full post body from WebFetch |

## Creators already in library (search before duplicate)

- หมอปอนด์, แม่ติ๊ด, Lewis Huckstep, Ryan Moresby-White, Mel Robbins / Gabor Maté, TheCoach.in.th, Awakening With Brian, Holistic Psychologist, Rungpfamily

## Commit / PR (when working inside another repo)

If scripts were developed in `sds-manager`, keep **this session** as the canonical copy. Sync changes here first, then cherry-pick to app repos if needed.

## Session identity

- **Session name:** `facebook-article-content`
- **Folder:** `sessions/facebook-article-content/`
- **Cursor rule:** `.cursor/rules/facebook-article-content.mdc`
