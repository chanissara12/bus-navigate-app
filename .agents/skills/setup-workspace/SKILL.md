---
name: setup-workspace
version: 0.3.0
description: Generate or update the AI agent system-prompt file (CLAUDE.md/AGENTS.md) documenting this repo's stack and conventions — works for both an existing codebase and a brand-new/empty one.
disable-model-invocation: true
---

# Setup Workspace

Generate or update the system-prompt file (`CLAUDE.md`/`AGENTS.md`) documenting this
repo's stack and conventions for AI coding agents. This does NOT scaffold the project —
no init commands, no source folders — it writes documentation only, for an existing repo
or a brand-new one.

## Process

### 1. Explore

Look at the repo's structure and tech stack.

- Existing `AGENTS.md`/`CLAUDE.md` at **any** location (not just root) → re-run, so step 4
  is update mode, not fresh-write. Carry this forward, don't just note it.
- Formatting contract, all four checks:
  - `.editorconfig` at root — does `[*]` declare `end_of_line`?
  - `.gitattributes` at root — does it declare `text=auto` or `eol=`?
  - `.vscode/settings.json` — does it set `editor.detectIndentation`/`files.eol`? Both
    default to values that silently override `.editorconfig`.
  - `git config --show-origin --get core.autocrlf` — on Windows this is usually `true`,
    inherited from Git's own system config, not set by anyone deliberately.
  - If `.editorconfig` declares an ending but `.gitattributes` is missing, check whether
    the tree has already diverged: `git cat-file blob HEAD:<path> | wc -c` vs. the on-disk
    size of that tracked text file — one extra byte per line means CR is added at
    checkout. Use `git cat-file blob` only; `git show`/`git grep` apply working-tree
    conversion and misdiagnose this as "committed with CRLF."
  - `.gitignore` at root — any already-**tracked** files the step 6 rules would ignore?
    `git ls-files -i -c --exclude-standard` lists them; report, don't untrack (step 6).
- Stack signals per top-level folder (mono-repo aware):

| Signal | Stack | Template |
| --- | --- | --- |
| `package.json` deps on `react` | React | `templates/react.md` |
| `package.json` deps on `@angular/core` | Angular | `templates/angular.md` |
| `*.csproj` / `*.sln` | .NET Core | `templates/netcore.md` |
| `go.mod` | Go | `templates/go.md` |

- No signal files and little/no source content (empty, or just README/.git/license) →
  **new project**, not unrecognized stack. This flips step 2A/step 4 to ask-and-propose
  instead of detect-and-describe.

### 2. Present findings and ask for confirmation

Summarize what's present/missing, then confirm one section at a time. Lead each with the
recommended answer so the user can accept in a word; skip the explainer when obvious.

**Section A — Confirm detected stack(s)**

Multi-select when asking (ambiguous/new-project case) — a repo can commit to more than one
stack at once (mono-repo from day one), so single-select forces multiple re-runs.

- **Single, unambiguous stack** — state as the recommended answer, e.g. "Detected React
  (`package.json` has `react` + `vite`) — proceeding with `templates/react.md`, correct?"
- **Multiple stacks** (e.g. `frontend/`=React, `backend/`=.NET Core) — list each
  sub-app/folder with its template and confirm the split before writing anything.
- **New project** — nothing to detect; ask directly which stack. Use the matching
  template + step 4's new-project fallback, or confirm hand-writing from the canonical
  skeleton if no template fits.
- **Conflicting/unknown signals on an existing repo** — do not guess silently; same
  fallback as above.

**Section B — Create a system prompt**

Ask which file: **CLAUDE.md** (preferred), **AGENTS.md**, or **Both**.

- If step 1 found existing file(s), recommend what's already there (`CLAUDE.md` alone →
  `CLAUDE.md`; both present → "Both"). Switching filenames on a re-run orphans the old one
  — confirm what happens to it if the user switches anyway.
- "Both" → write `AGENTS.md` first, copy verbatim to `CLAUDE.md` (only the `{{FILE_NAME}}`
  substitution differs).
- Write it as a standing instruction set — clear, concise, actionable, not descriptive
  prose.

### 3. Plan the output file(s)

Use the stack(s)/filename already confirmed in step 2 — don't re-detect or re-ask.

- **Single stack** → one output file (two if "Both") at the repo root.
- **Mono-repo** → do NOT merge into one file. Root holds only what's shared (Security
  Rules, repo-wide Definition of Done) plus a mandatory routing table (below). Each
  sub-app gets its own file from its matching template, with those same two sections
  replaced by a pointer back to root (step 4). Same filename everywhere.

Commit Message is never part of any CLAUDE.md/AGENTS.md, in either case — see step 7.

**Root routing table (mono-repo only)** — a markdown link isn't enough: no agent
auto-loads a file just because another file links to it, and a softly-worded pointer gets
skipped for changes that look small even with the root file already in context. Keep the
wording below close to verbatim — trimming "no exceptions for small changes" is what makes
it get skipped. Place immediately after the root file's title/intro, before any other
section:

```
## Routing — read first, even for trivial edits

Before touching any file under a path below, you MUST Read the matching file
first — no exceptions for small changes.

| Path prefix | Read this file first |
| --- | --- |
| `<sub-app-folder>/**` | `<sub-app-folder>/{{FILE_NAME}}` |
```

One row per sub-app, using its real folder name. "Both" → substitute `CLAUDE.md`/
`AGENTS.md` per copy, same as every other cross-link in step 4.

### 4. Resolve the template and write real content

**Fresh write vs. update**, per output location: no file there → fresh write, resolve the
template below. File exists → update in place — it's the source of truth for what the
user customised; the template only supplies content that's new since the last run, never
a wholesale regeneration.

Update procedure: map existing `##`/`###` headings onto the canonical skeleton, then per
section — **absent on disk** → resolve from template, insert at its position (picks up
sections added since the last run). **Matches what this skill would produce** → replace,
so fragment wording fixes land. **Diverged** (user edited/trimmed) → keep their version,
propose new content rather than overwrite. **Not in skeleton** → user-authored, leave
untouched. `Tech Stack`/`Architecture`/`Project Structure` and real folder/class tables
describe *this* repo — re-survey and correct only what changed, never overwrite with
template defaults. Show a summary (add/update/leave-alone) and confirm before writing. A
skeleton section missing on disk may be a deliberate removal — ask before restoring it.

**Resolve `{{FILE_NAME}}`** — every template's H1 is `# {{FILE_NAME}}`; substitute the
chosen filename. "Both" → resolve once, write to `AGENTS.md`, copy verbatim to
`CLAUDE.md`, swap only the H1 word — at **every** planned location in a mono-repo, not
just root. Any cross-link in the body (root↔sub-app, or the netcore.md sub-app pointer)
must also swap to match: `CLAUDE.md` links only to sibling `CLAUDE.md` files. Grep for the
wrong filename before calling this done, e.g. `grep -rn "CLAUDE.md" **/AGENTS.md`.

**Resolve shared fragments** — a marker like `<!-- resolve: _shared/x.md (Plain) -->`
replaces inline content: open the `_shared/` file, take its `## Plain` block (append an
extra stack's block if the selector names one), substitute any `{{TOKEN}}` the marker
passes, inline the result, delete the marker. A delivered file still containing a
`resolve:` marker is a bug — that content is never auto-loaded and the rule silently
vanishes.

**Mono-repo dedup** — for a sub-app file, skip resolving `_shared/security-rules.md` and
`_shared/definition-of-done.md`; those two live once, at root, and resolving them per
sub-app is how one rule ends up duplicated and drifting. Replace both sections with one
line:

> Root-wide rules (security, Definition of Done) live in
> [<path-to-root>/{{FILE_NAME}}](<path-to-root>/{{FILE_NAME}}) — this file only covers
> what's specific to the <sub-app>.

Use the real relative path. Root's routing table (step 3) says which sub-app file to read
for stack rules; this line says where the everywhere-rules live — together the agent gets
the full picture from either direction. Skip this for a single-stack repo, where both
sections resolve normally.

**Canonical skeleton:**

```
## Tech Stack
## Architecture
## Project Structure
    ### Rules
## Coding Convention
    ### Naming
    ### Coding Rules
    ### For Typescript        (React / Angular only)
    ### Editor Config
    ### Formatting Display
    ### UI & Design System    (only if the repo renders UI)
    ### Comment Code
    ### Before Creating New Code
    ### Loading Indicator     (React / Angular only)
    ### Commands
## Testing & Quality
    ### Test Runner
    ### Unit Test Rules
    ### Rules
## Security Rules
## Definition of Done
```

Commit Message is intentionally absent from this skeleton — see step 7, it's delivered as
a project skill instead of a section here.

Not a file to copy verbatim — replace every library, folder, and naming-table entry with
the repo's real ones; never leave a placeholder like `<Project>` unresolved.

`## Tech Stack` is deliberately thin (framework/language/styling only) — write the real
list yourself from the lockfile/`*.csproj`/`go.mod`. Deeper choices (UI kit, auth, state
management, DB, hosting) vary per project and go stale if hardcoded — ask if a
dependency's purpose isn't obvious, and leave it out rather than inventing an entry.

**New project** — no lockfile yet: ask what's planned beyond the template baseline rather
than inventing libraries. Treat `## Project Structure` as a proposed layout, not a survey
result, and say so.

**Detected-pattern subsections** (e.g. `Business Validation` in `netcore.md` — a
`resolve:` comment says what to search for): **found** → name the real class/function,
show real usage covering every variant the template calls out. **Not found, existing
repo** → delete the subsection, no placeholder. **Not found, new project** → don't
scaffold the source file (this skill only writes docs); write the section as a standing
instruction with a minimal, self-contained shape inline. Never let "not found" default to
inventing something plausible.

Don't drop a section just because the repo doesn't need it yet (e.g. `Formatting Display`
still matters for a UI-less Go service) — only drop `For Typescript`/`UI & Design
System`/`Loading Indicator` when the stack doesn't apply, and only replace `Security
Rules`/`Definition of Done` with the root pointer for a mono-repo
sub-app file.

### 5. Generate the formatting contract

Three files enforce one set of rules because three different consumers each read only
their own file: `.editorconfig` (formatters/CI), `.gitattributes` (Git, at checkout),
`.vscode/` (the human's editor). Ship only the first and the rules become decoration — a
repo can declare `end_of_line = lf` while every Windows checkout still writes CRLF, status
bar reading `Spaces: 2`, nothing visibly broken. All three are written **once at the repo
root only**, even in a mono-repo — their patterns already match files at any depth, and
`.vscode/settings.json` applies workspace-wide.

**`.editorconfig`** — from `templates/editorconfig/`: `_base.editorconfig` (charset, line
endings, base indent, `[*.md]` override) plus each confirmed stack's
`<stack>.editorconfig` override if one exists (React/Angular don't — both match the
4-space base). Write combined to root.

**`.gitattributes`** — same shape: `_base.gitattributes` (`* text=auto eol=lf`, Windows
script-host CRLF exceptions, binary guards — outranks a contributor's `core.autocrlf`,
which is what actually enforces) plus any `<stack>.gitattributes` override (none exist
today; add one only when a stack's tooling demonstrably rewrites endings, not
speculatively).

**`.vscode/`** — copy `templates/vscode/settings.json` + `extensions.json` verbatim, no
per-stack variants. VS Code has no native `.editorconfig` support and
`editor.detectIndentation` defaults to `true`, silently overriding whatever's declared
elsewhere — `settings.json` turns that off. Formatting keys only, and only keys that
govern what a contributor types or creates — never `files.trimTrailingWhitespace`/
`files.insertFinalNewline`, which rewrite a whole file on save and turn a one-line edit
into a fifty-line diff. `.editorconfig` + CI already enforce those.

**If any of these three already exist** (step 1): don't overwrite — show what would
change and confirm; merge into project-specific decisions this skill can't know about,
never replace wholesale.

**If step 1 found the checkout mismatch** (ending declared, no `.gitattributes`, machine
converts at checkout): writing `.gitattributes` only fixes future checkouts.
Renormalizing tracked files is the user's call — report it and print this block for them
to run themselves, never run it:

```bash
git add --renormalize .
git status   # review before committing — this touches every mismatched file
git commit -m "Normalize line endings"
```

Everyone else with a local clone must also refresh after this commit lands:

```bash
git rm -r --cached .
git reset --hard HEAD
```

(a fresh clone also works). Never run these or offer to, and never reformat files just to
silence a formatter.

**Keep the four declarations in sync** — indentation/line endings are each stated once per
audience (`_base.editorconfig`, `_base.gitattributes`, `vscode/settings.json`, and
`_shared/editor-config.md` prose for the agent, since it has no built-in way to auto-load
`.editorconfig`). Change one, change all four, or one audience silently goes
unconfigured — the reason this step exists at all.

### 6. Generate `.gitignore`

Written **once at the repo root only**, same as step 5.

Build from `templates/gitignore/`: start with `_base.gitignore` (secrets, `*.local.*`,
editor/OS cruft, logs, plus the `.vscode/` allowlist that keeps step 5's two committed
files tracked while ignoring the rest — keep these in sync if step 5's `.vscode/` output
changes) then append every confirmed stack's `<stack>.gitignore` (all four exist). Write
the combined result to root.

Curate, don't generate exhaustively (`dotnet new gitignore` emits ~485 lines nobody
reviews) — add project-specific rules to the project, stack-wide ones to the template.

**Mono-repo** — read the combined result before writing; appending two stacks can
over-reach into the other's tree (Go's `bin/` vs. .NET's `bin/`). Scope anything ambiguous
to its sub-app path (`backend/bin/`) rather than leaving it global.

**If `.gitignore` already exists** — don't overwrite; show which rules are missing and let
the user choose. It's usually a generated list already reviewed once; adding the missing
lines beats replacing it.

**Never untrack an already-committed file.** If step 1 found tracked files the new rules
would ignore, report and stop — `git rm --cached` is the user's call and the user's
command, exactly like renormalizing in step 5. Never run it, never present it as part of
finishing this step.

### 7. Generate the commit-message skill

Commit Message is never resolved as a CLAUDE.md/AGENTS.md section (see step 4's
skeleton) — it's delivered as a standalone, model-invocable skill instead, at
`.claude/skills/commit-message/SKILL.md`. The commit convention only matters at the
moment of running `git commit`, not on every file touch the way stack conventions do —
putting it in the always-loaded root file makes an agent carry it in context on every
turn for a fact it only needs once per commit, and testing showed a plain CLAUDE.md
section doesn't reliably stop an agent from padding the message with a body/footer a
convention never asked for either. A skill with a trigger-worthy `description` is read
only when the agent is actually about to commit.

Written **once at the repo root only**, even in a mono-repo — same reasoning as step 5/6:
one convention for the whole repo, not one per sub-app.

Copy `templates/skills/commit-message/SKILL.md` verbatim to
`.claude/skills/commit-message/SKILL.md` — no per-stack variants, no `{{FILE_NAME}}`
substitution (the skill's own filename never changes). If it already exists, don't
overwrite silently — show what would change and confirm, same as step 5's formatting
files.

**Keep the file's own worked examples one line each.** A worked example carries more
weight than a prose rule — if this file is ever edited to add a multi-line example
(a body, a footer), an agent will start reproducing that shape even where the rule beside
it says "optional" or doesn't forbid it. The file currently has none; don't add one.
