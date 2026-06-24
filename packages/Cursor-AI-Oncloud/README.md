# Cursor-AI-Oncloud

Reusable **Cursor Cloud Agent** sessions: workflows, scripts, and agent rules for recurring tasks outside a single app repo.

## Sessions

| Session | Purpose |
|--------|---------|
| [facebook-article-content](sessions/facebook-article-content/) | Facebook video/post → extract → Notion **Chai Article** (บทความ) |

## Quick start

1. Open this repo in a **Cursor Cloud Agent** (or local agent with Notion MCP).
2. Go to the session folder you need and read `SESSION.md`.
3. Paste a Facebook URL and say: **Add article** (or follow the session prompt).

## Requirements (Facebook session)

- Python 3.10+, `ffmpeg`
- Notion MCP connected in Cursor
- Optional: `OPENAI_API_KEY`, `GOOGLE_API_KEY` for Manus-like analysis

## Structure

```
sessions/
  <session-name>/
    SESSION.md          # Agent playbook + Notion IDs
    README.md           # Human docs
    notion-config.json  # Database / property reference
    scripts/            # Runnable pipeline
    .cursor/rules/      # Cursor rules for this session
```

Add new sessions:

```bash
./scripts/new-session.sh my-session-slug "My Session Title"
```

Or copy `sessions/_template/` manually. Reference implementation: `sessions/facebook-article-content/`.
