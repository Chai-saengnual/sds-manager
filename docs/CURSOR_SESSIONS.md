# Cursor Cloud Agent sessions

Agent playbooks and scripts are maintained in a **separate repository**:

**[github.com/Chai-saengnual/Cursor-AI-Oncloud](https://github.com/Chai-saengnual/Cursor-AI-Oncloud)**

## Why separate?

- Cloud Agents run on a dedicated repo (smaller, faster, Notion-focused).
- Avoids duplicating session code under `packages/` and `scripts/facebook-to-notion/` in sds-manager.

## Quick links

| Session | Path in Cursor-AI-Oncloud |
|---------|-------------------------|
| Facebook → Notion Chai Article | `sessions/facebook-article-content/` |

## Local clone

```bash
git clone https://github.com/Chai-saengnual/Cursor-AI-Oncloud.git
cd Cursor-AI-Oncloud
```

Legacy pointers: `packages/README.md`, `scripts/facebook-to-notion/README.md`.
