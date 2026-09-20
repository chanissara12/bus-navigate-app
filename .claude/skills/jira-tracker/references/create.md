# create

```
node scripts/jira.mjs create -p|--project <projectKey> -t|--topic <topic> [-d|--desc|--description <description>] [-it|--type <issueType>]
```

- `-p`/`--project` omitted → falls back to `defaultProjectKey` from config; if neither is set, the script errors asking for it.
- `-it`/`--type` omitted → defaults to `Task`.
- `-d`/`--desc`/`--description` supports basic markdown (bold, italic, links, bullet/numbered lists) — it's converted to Atlassian Document Format automatically. Don't hand-write ADF JSON yourself.
- Status is never set here — Jira doesn't allow it on create. The project's workflow default (typically "To Do"/"Not Started") applies automatically; this is expected, not a missing feature.
- On success, prints the newly created issue using the same detail-block format as `view`.
