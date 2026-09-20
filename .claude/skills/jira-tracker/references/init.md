# init

```
node scripts/jira.mjs init [-f|--force]
```

Creates `.jira/config.local.json` from a template (baseUrl, email, apiToken, defaultProjectKey) and adds it plus `.jira/.cache.json` to `.gitignore`. Run this once before any other command in a new repo.

- If the file already exists, `init` does nothing and says so — it will not overwrite credentials the user already filled in.
- `--force` resets it back to the placeholder template, discarding whatever is there. Only use this if the user explicitly asks to reset the config; otherwise leave existing config alone.
- After running, tell the user to fill in `baseUrl`, `email`, and `apiToken` in the file before using any other command — every other command will refuse to run until those are filled in.
