# Session: {{SESSION_TITLE}}

**Session folder:** `sessions/{{SESSION_SLUG}}/`

Replace `{{...}}` placeholders when copying this template.

## Goal

_Describe what the agent should accomplish in one paragraph._

## User prompts (examples)

- _Example user message 1_
- _Example user message 2_

## Prerequisites

- [ ] MCP servers: _list (e.g. Notion)_
- [ ] Env vars: _see `.env.example` in session or repo root_
- [ ] System tools: _e.g. ffmpeg, python3_

## Workflow

### 1. Intake

_What to parse from the user message (URL, file, ID)._

### 2. Extract / fetch

```bash
cd sessions/{{SESSION_SLUG}}
# commands here
```

### 3. Transform

_How to structure output (JSON schema, markdown sections)._

### 4. Deliver

_Where results go (Notion, PR, file path). MCP tool names and parent IDs from `notion-config.json` if applicable._

## Output checklist

- [ ] _Required field 1_
- [ ] _Required field 2_
- [ ] Link back to user in final message

## Pitfalls

| Issue | Fix |
|-------|-----|
| _Example_ | _Fix_ |

## Session identity

- **Session name:** `{{SESSION_TITLE}}`
- **Slug:** `{{SESSION_SLUG}}`
- **Cursor rule:** `.cursor/rules/{{SESSION_SLUG}}.mdc`
