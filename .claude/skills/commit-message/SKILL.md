---
name: commit-message
description: Use before writing any git commit message in this repository — defines the required commit format. Trigger this any time you are about to run `git commit`, even for a small change.
---

# Commit Message Convention

This repo's history does not use conventional-commit prefixes (`feat:`, `fix:`, ...) — match the existing style instead.

- Subject only, imperative mood, capitalized first word, no trailing period
- One line, no body and no footer, even for a multi-file change
- Describe the effect of the change, not the mechanism — e.g. "Penalize walks that cross a major road in journey ranking", not "Update rankJourneys.ts"
- One logical change per commit — never mix a refactor with a feature or a format-only sweep with a fix

Examples (from this repo's actual history):
- `Buffer unsnapped walking legs instead of trusting their straight-line length`
- `Penalize walks that cross a major road in journey ranking`
- `Collapse board-now cards to their best option by default`
