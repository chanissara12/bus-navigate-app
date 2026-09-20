# list

```
node scripts/jira.mjs list [-p|--project <projectKey>] [-a|--all | -me|--me] [-s|--status <status>] [-sp|--sprint]
```

- No flags at all → behaves like `--me` (issues assigned to the configured user, excluding Done/Closed).
- `-a`/`--all` → all issues in the project (no assignee filter, excluding Done/Closed).
- `-me`/`--me` → issues assigned to the configured user.
- `--all` and `--me` together → the script errors out; don't pass both.
- `-p`/`--project` omitted → falls back to `defaultProjectKey` from config; if neither is set, the script errors asking for it.
- `-s`/`--status <status>` → filters to that status. Must match a real status in the project (case-insensitive); if it doesn't, the script errors and lists the real statuses — surface that list to the user rather than guessing a fix.
- `-sp`/`--sprint` → only issues in the currently open sprint(s).

If more than 30 issues match, the script automatically switches to a compact summary table (Task/Status/Assignee only, no full detail block) — this is expected behavior, not a bug. Suggest the user narrow with `--status`/`--me`/`--sprint` if they want full detail.
