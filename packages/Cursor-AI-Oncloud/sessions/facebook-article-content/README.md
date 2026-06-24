# Facebook article content

Clone of the **Cursor Cloud Agent** workflow used to add Facebook videos and posts to Notion **Chai Article**.

## Install

```bash
cd sessions/facebook-article-content/scripts
pip3 install --user -r requirements.txt
# System: ffmpeg
```

## Commands

| Task | Command |
|------|---------|
| OG metadata | `python3 ../fetch_og.py "FACEBOOK_URL"` |
| Extract + transcribe | `./run.sh "URL" -o ./out --model small --language th` |
| Full Manus-like | `./run-full.sh "URL"` (needs `OPENAI_API_KEY`) |
| Gemini video | `./run-full.sh "URL" --gemini` |

See [scripts/README.md](scripts/README.md) for pipeline details.

## Agent usage

In Cursor Cloud Agent with **Notion MCP**:

1. Open repo **Cursor-AI-Oncloud**
2. User: `Add article <facebook url>`
3. Agent follows [SESSION.md](SESSION.md)

## Notion target

- Database: **Chai Article** (บทความ)
- `data_source_id`: see [notion-config.json](notion-config.json)
