# {{SESSION_TITLE}}

_Template session — copy this folder, do not run as-is._

## Copy a new session

From repo root:

```bash
./scripts/new-session.sh my-session-slug "My Session Title"
```

Or manually:

```bash
cp -r sessions/_template sessions/my-session-slug
# Replace {{SESSION_SLUG}} and {{SESSION_TITLE}} in SESSION.md, README.md, .cursor/rules/*.mdc
```

## Files to customize

| File | Purpose |
|------|---------|
| `SESSION.md` | Agent playbook |
| `README.md` | Human documentation |
| `notion-config.json` | Optional — remove if not using Notion |
| `scripts/` | Optional — add runnable tools |
| `.cursor/rules/*.mdc` | Cursor rule trigger description |

See [facebook-article-content](../facebook-article-content/) for a complete example.
