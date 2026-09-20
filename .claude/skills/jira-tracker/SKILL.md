---
name: jira-tracker
version: 0.1.0
description: A skill that allows you to interact with Jira Cloud REST API workflow, Use when the user asks to list, create, view, move, transition, or update Jira issues
disable-model-invocation: true
argument-hint: "[init] · [list --all|--me] [--status <status>] [--sprint] · [create --project <key> --topic <topic> --description <desc>] · [view --id <key>] · [move --id <key> --transition <status>] · [pull --id <key>]"
---

# Jira Tracker

Talks to Jira Cloud via REST API v3 through `scripts/jira.mjs` — every command below is
`node scripts/jira.mjs <command> [flags]` run from the project root, invoked with Bash.
The script owns API calls, JQL/ADF/field handling, and output formatting; relay its
stdout to the user as-is on success, and its stderr message as-is on failure (exit code
non-zero). Don't reimplement any of that logic by hand or call the Jira REST API directly.

Config lives at `.jira/config.local.json` (baseUrl, email, apiToken, defaultProjectKey).
If it's missing, every other command errors and points to `init`; if it still has
placeholder/blank values, they error listing what's missing — show the user that
message and stop, don't try to work around it.

## Commands

| Command  | Category | Description       | Reference                                    |
| -------- | -------- | ----------------- | -------------------------------------------- |
| `init`   | Init     | Create `.jira/config.local.json` from template | [references/init.md](references/init.md) |
| `list`   | List     | List Jira issues  | [references/list.md](references/list.md)     |
| `create` | Create   | Create Jira issue | [references/create.md](references/create.md) |
| `view`   | View     | View Jira issue   | [references/view.md](references/view.md)     |
| `move`   | Move     | Move Jira issue   | [references/move.md](references/move.md)     |
| `pull`   | Pull     | Pull full issue detail into `.jira/task/` | [references/pull.md](references/pull.md)     |