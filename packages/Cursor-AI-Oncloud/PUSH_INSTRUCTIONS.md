# Publish this repo to GitHub

The Cloud Agent token cannot create new repositories. Use **one** of these methods:

## Method A — from this folder (if `.git` exists)

```bash
cd Cursor-AI-Oncloud
gh repo create Chai-saengnual/Cursor-AI-Oncloud --public --description "Cursor Cloud Agent sessions"
git remote add origin https://github.com/Chai-saengnual/Cursor-AI-Oncloud.git
git push -u origin main
```

## Method B — from git bundle (in sds-manager export branch)

```bash
git clone cursor-ai-oncloud.bundle Cursor-AI-Oncloud
cd Cursor-AI-Oncloud
gh repo create Chai-saengnual/Cursor-AI-Oncloud --public
git remote add origin https://github.com/Chai-saengnual/Cursor-AI-Oncloud.git
git push -u origin main
```

## Method C — copy folder from `sds-manager` branch

Branch `cursor/export-cursor-ai-oncloud-5411` contains `Cursor-AI-Oncloud/` at repo root. Create empty GitHub repo, then:

```bash
cp -r Cursor-AI-Oncloud /tmp/Cursor-AI-Oncloud
cd /tmp/Cursor-AI-Oncloud
git init && git add -A && git commit -m "Initial import"
git remote add origin https://github.com/Chai-saengnual/Cursor-AI-Oncloud.git
git push -u origin main
```

## Cursor Cloud Agent

1. Open **https://github.com/Chai-saengnual/Cursor-AI-Oncloud** (after push).
2. Start a Cloud Agent on `main`.
3. **Session name:** `Facebook article content` (folder: `sessions/facebook-article-content/`).
4. Enable **Notion MCP** in the agent environment.
5. Prompt: `Add article <facebook url>`
