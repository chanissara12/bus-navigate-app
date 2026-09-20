# pull

```
node scripts/jira.mjs pull -id|--id <issueKey>
```

Fetches the issue in full detail — all fields, full description, subtasks, linked issues, attachment names/URLs (not the files themselves), and every comment — and writes it to `.jira/task/<issueKey>-<slug>.md` (slug derived from the summary). Intended as context to hand to an agent for follow-up work on that issue.

- Always overwrites the file if it already exists for that issue — this is a snapshot of the latest Jira state, not a version history. Don't ask the user before overwriting.
- Attachments are listed by filename + URL only; the script does not download the actual files.
