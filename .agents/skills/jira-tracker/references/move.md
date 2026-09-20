# move

```
node scripts/jira.mjs move -id|--id <issueKey> -t|--transition <statusName>
```

- The script looks up the transitions actually available from the issue's current status and matches `<statusName>` case-insensitively. If there's no match, it errors and lists the transitions that are actually possible from here — surface that list rather than retrying with a guess.
- If the target transition requires extra fields the workflow demands (e.g. a resolution when moving to Done) that weren't supplied, the script errors explaining what's missing instead of letting the move fail silently or halfway.
- On success, prints the issue's new state using the same format as `view`.
