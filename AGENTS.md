# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

## Routing — read first, even for trivial edits

Before touching any file under a path below, you MUST Read the matching file
first — no exceptions for small changes.

| Path prefix | Read this file first |
| --- | --- |
| `frontend/**` | `frontend/AGENTS.md` |
| `backend/**` | `backend/AGENTS.md` |

## Security Rules

- DO NOT hardcode API keys, tokens, passwords, or credentials in source code
- DO NOT log sensitive data (passwords, tokens, secrets, connection strings)
- DO NOT commit `.env`, `.env.local`, or any file containing secrets or credentials
- `.env.example` is the only env file allowed in version control — placeholder values only
- Never expose stack traces or internal error details in API responses
- `appsettings.Example.json` is also an acceptable config template alongside `.env.example` — placeholder values only

## Definition of Done

A task is complete only when

- Build succeeds
- Tests pass
- Formatting and any configured analyzers pass, verified in CI and not only locally
- Existing behavior is preserved
- Requested functionality is implemented
- No unnecessary files are added
- No unrelated code is modified

## Workflow Rules

- **Never `git commit` automatically.** Finishing an implementation — even with a clean
  build, passing tests, and a clean `/code-review` — is not authorization to commit.
  Always stop, summarize the work, and wait for the user to explicitly say to commit in
  the same conversation before running `git commit`.
- **Explain the flow after finishing work.** Before asking whether to commit, walk the
  user through the flow and how the key functions/pieces work together — not just a
  list of changed files. Cover what triggers the flow, what each piece does, and any
  non-obvious design decision (e.g. why a value is nullable, why a check is implicit).
