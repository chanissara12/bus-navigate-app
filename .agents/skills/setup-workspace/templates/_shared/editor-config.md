# Editor Config (shared fragment)

Used by: react, angular, netcore, go

Resolve rule: emit `## Plain` bullets always. Append the matching stack's `##` block's
bullet(s) after the Plain ones, if that stack has one — inline the merged result into
`### Editor Config` in the final CLAUDE.md/AGENTS.md. Never leave a pointer to this file
in delivered output.

## Plain

This repo enforces formatting via `.editorconfig` at the repo root. An AI agent has no
built-in mechanism to auto-load editor config files the way an IDE does — the concrete
rule is restated here so it's actually in context. Match it in every file you write or
edit; don't infer indentation by eyeballing surrounding code.

- Indent: 4 spaces (repo-wide default)
- Line endings: LF, UTF-8, final newline required
- Trailing whitespace trimmed (except Markdown, where it's meaningful for line breaks)
- Line endings are enforced by `.gitattributes` at the repo root, not by your local Git
  settings — never "fix" them by hand, and never change `core.autocrlf` to work around a
  complaint from a formatter
- `.vscode/settings.json` is committed and pins the same rules for the editor. It is not
  personal configuration — do not add themes, fonts, or machine-specific paths to it, and
  do not relax its formatting keys to match a file that is already wrong

If a formatter reports a line-ending or whitespace failure across files you did not
touch, that is a repository configuration problem, not a code problem. Report it and
leave it alone. Do not answer it with a repo-wide reformat, and never let unrelated
reformatted files ride along in a change.

## Go

- `.go` files use tabs, not spaces — enforced by `gofmt`, not a style choice

## .Net Core

- `.csproj`/`.props`/`.targets` use 2 spaces instead of the 4-space default
