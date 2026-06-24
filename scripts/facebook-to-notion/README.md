# Moved → Cursor-AI-Oncloud

This pipeline now lives in the **Cursor-AI-Oncloud** repository.

**Canonical path:** `sessions/facebook-article-content/`

| Task | Where |
|------|--------|
| Agent playbook | [SESSION.md](https://github.com/Chai-saengnual/Cursor-AI-Oncloud/blob/main/sessions/facebook-article-content/SESSION.md) |
| Scripts | `sessions/facebook-article-content/scripts/` |
| OG fetch | `sessions/facebook-article-content/fetch_og.py` |

## Clone and use

```bash
git clone https://github.com/Chai-saengnual/Cursor-AI-Oncloud.git
cd Cursor-AI-Oncloud/sessions/facebook-article-content/scripts
pip3 install --user -r requirements.txt
./run.sh "FACEBOOK_URL" -o ./out --model small --language en
```

## Cursor Cloud Agent

Open the **Cursor-AI-Oncloud** repo (not sds-manager), enable Notion MCP, then:

`Add article https://www.facebook.com/share/...`

---

Legacy script copies were removed from sds-manager to avoid drift. See [MIGRATION.md](https://github.com/Chai-saengnual/Cursor-AI-Oncloud/blob/main/MIGRATION.md).
