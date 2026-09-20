---
name: code-review
version: 0.1.0
description: Review source code changes independently of any Git hosting provider. Use when the user asks to review a pull request, working-tree changes, staged changes, a commit range, specific files, or a directory, or when another skill (e.g. review-pr) needs a structured review result.
argument-hint: "[--working-tree] · [--staged] · [--diff <base>...<head>] · [--commits <a>..<b>] · [--files <path> ...] · [--path <dir>] · [--input <file.json>] · [--lang en|th]"
---

# Code Review

Reviews a set of code changes and returns a **structured review result** plus a
human-readable Markdown report. Provider-agnostic: it never talks to GitHub, GitLab,
or Bitbucket, and never posts, approves, merges, or pushes anything.

Callable by a human (`/code-review ...`) or by an orchestrator skill such as
`review-pr`, which supplies a target and consumes the JSON.

## Workflow

Run these steps in order. Do not skip step 2 — repository rules outrank the generic
policies in this skill.

1. **[Resolve the review target](#1-resolve-the-review-target)**
2. **[Read repository instructions](#2-read-repository-instructions)**
3. **[Detect the stack](#3-detect-the-stack)**
4. **[Read the diff and its context](#4-read-the-diff-and-its-context)**
5. **[Run deterministic checks](#5-run-deterministic-checks)**
6. **[Review against the policies](#6-review-against-the-policies)**
7. **[Emit the result](#7-emit-the-result)**

Settle the [report language](#report-language) at the start, together with step 1 —
not after the review is written.

## Report language

The Markdown report is written in the caller's language. Resolve it in this order:

1. `--lang en` or `--lang th` was passed → use it.
2. `--input` supplies `reportLanguage` → use it. **Never prompt in an orchestrated
   run**; if the field is absent, default to English and note the assumption.
3. Interactive invocation with no flag → **ask the user once, before starting the
   review**: English or Thai. Ask together with any target clarification so there is
   only one interruption.

Record the choice in `reportLanguage` (`"en"` or `"th"`).

What the language setting does **not** change:

- The JSON is a machine contract. `verdict`, `severity`, `category`, `status`, and
  every other enum stay in English exactly as the schema defines them.
- Identifiers, file paths, commands, log excerpts, and quoted code stay verbatim.
- Rule citations keep the source's own wording (`AGENTS.md#layering`).
- **All headings and field labels stay English**, in every language — the report title,
  `Verdict`, `Reviewed range`, `Scope`, `Blocking`, `Warnings`, `Suggestions`, `Checks`,
  `Limitations`, `Recommended change`, `Evidence` — along with the status values
  (`Changes requested`) and check results (`Passed`, `Failed`). These are the terms the
  provider UI already shows and the team already says out loud; translating them would
  give one thing two names. `reportLanguage` changes the sentences, not the frame.

Only prose is translated: `summary`, `title`, `message`, `impact`, `suggestion`,
`evidence`, `limitations`, and the Markdown report. Write natural Thai, not a literal
translation — keep technical terms (null, deadlock, migration, race condition) in
English rather than forcing an unnatural Thai equivalent.

## 1. Resolve the review target

| Invocation | Target |
| --- | --- |
| `--working-tree` | `git diff` (unstaged + untracked) |
| `--staged` | `git diff --cached` |
| `--diff dev...HEAD` | `git diff dev...HEAD` (three-dot: merge-base) |
| `--commits abc123..def456` | `git diff abc123..def456` |
| `--files a.cs b.cs` | those files, full content, reviewed as-is |
| `--path src/Payments` | changed files under that path, else the whole subtree |
| `--input review-context.json` | target described by the JSON file (see below) |
| *(none)* | inferred — see below |

**Inference when no flag is given**, in this order:

1. Unstaged or untracked changes exist → review the working tree.
2. Staged changes exist → review staged.
3. Current branch differs from the default branch (`main`/`master`/`dev`) →
   review `git diff <default>...HEAD`.
4. Otherwise → review the last commit (`HEAD~1..HEAD`), and say so in the summary.
5. If the repo state is ambiguous or the branch has no clear base, **ask** rather
   than guessing a wide range.

`--input` accepts a JSON file with at least `{ "type": ..., "base": ..., "head": ... }`
or `{ "type": "files", "files": [...] }`. Extra fields (PR title, description,
linked issue) are context only — treat them as claims to verify, not as facts.

Record the resolved target in `reviewTarget`. Never widen the range on your own; a
huge accidental diff is a reason to stop and ask, not to review everything.

## 2. Read repository instructions

Search for and read, from the changed paths upward:

`AGENTS.md`, `CLAUDE.md`, `CODE_REVIEW.md`, `ARCHITECTURE.md`, `DESIGN.md`,
`PRODUCT.md`, `PLAN.md`, `TASK.md`, `README.md`, `CONTRIBUTING.md`

**Precedence** (closest wins on conflict):

1. Instructions in or nearest the changed file's directory
2. Module-level instructions
3. Repository-root instructions
4. The policies in `policies/`

Read selectively — only documents covering the affected modules. Skip a 400-line
`README.md` about deployment when reviewing a UI component. List everything you
actually read in `repositoryContext.instructionsRead`; do not list files you skipped.

When a repository rule is marked mandatory ("must", "never", "always"), cite it in the
finding's `rule` field (e.g. `AGENTS.md#layering`). A violation is **blocking** when it
also carries real consequence — wrong behavior, a security or data risk, or a broken
build. A violation of a rule that is purely convention (formatting, file layout,
naming) is a **warning**, however emphatically the rule is worded. Severity comes from
impact, not from the rule's tone of voice.

## 3. Detect the stack

Infer from repo files and changed paths — `*.sln`/`*.csproj` (ASP.NET Core / C#),
`package.json` + `angular.json` (Angular), `package.json` + React deps, plain
Node.js, `go.mod` (Go), `*.sql`, `Dockerfile`/`compose.yml`, Terraform/Helm/k8s
manifests. Record them in `detectedStacks`.

Use only conventions and tools that exist in this repository. **Never invent** a test
framework, layering rule, or lint config the repo does not have.

## 4. Read the diff and its context

Read the full diff, then read enough surrounding code to actually verify claims:
method contracts, interfaces, call sites, existing implementations, tests,
dependency direction, migrations and DB behavior, and error-handling conventions.

A finding you could not verify by reading the code is a hypothesis — either verify
it or leave it out. Do not report an issue you inferred purely from a file name.

## 5. Run deterministic checks

Discover commands from `package.json` scripts, `*.sln`/`*.csproj`, `Makefile`,
`Taskfile.yml`, `README.md`, `AGENTS.md`/`CLAUDE.md`, and CI config
(`.github/workflows/`, `.gitlab-ci.yml`, `azure-pipelines.yml`). Prefer what CI runs.

Run what is relevant and practical: build, type check, lint, format check, unit
tests, static analysis, architecture tests, security scans **already configured**
in the repo.

Rules:

- **Do not install dependencies** unless the user explicitly allows it.
- **Do not claim a check passed unless you ran it and it exited zero.** Report the
  real status: `passed` / `failed` / `skipped` / `not_available`.
- A check that could not run goes in `limitations` with the reason.
- Run read-only/verification commands only — never a command that deploys, migrates
  production data, rewrites history, or mutates remote state.
- If tests take unreasonably long or need unavailable infrastructure, skip them and
  record the limitation rather than hanging.

A build or test failure **caused by the reviewed change** is a blocking finding.
A pre-existing failure is a limitation, not a finding.

## 6. Review against the policies

Read the policy files relevant to the change:

| Policy | Covers |
| --- | --- |
| [policies/correctness.md](policies/correctness.md) | Logic, null/boundary handling, contracts, breaking changes, concurrency, transactions |
| [policies/security.md](policies/security.md) | AuthN/AuthZ, injection, secrets, input validation, sensitive data |
| [policies/architecture.md](policies/architecture.md) | Layering, dependency direction, module boundaries, data integrity |
| [policies/testing.md](policies/testing.md) | When tests are required and what makes them adequate |
| [policies/maintainability.md](policies/maintainability.md) | Clarity, duplication, error handling, performance, naming |

**Priority order** for findings: correctness → security → data integrity → breaking
changes → architecture violations → error handling → concurrency/transactions →
test adequacy → performance regressions → maintainability → naming and style.

**Diff-aware:** report only what the change introduces or exposes. Unrelated legacy
problems are out of scope unless the new code depends on or worsens them.

**Severity** — exactly three levels:

- `blocking` — incorrect behavior, security vulnerability, data corruption risk,
  severe architecture violation, missing required validation, unhandled breaking
  change, or a build/test failure caused by the change. Should normally prevent merge.
  A mandatory-rule violation qualifies only when it produces one of these effects.
- `warning` — a meaningful issue to consider before merge; may not always block.
- `suggestion` — non-blocking improvement.

Do not inflate severity. A style nit is never blocking. If you are unsure whether
something is a real defect, it is at most a `warning`, and say what you could not
verify.

**Every finding must:** name a concrete problem, explain why it matters, cite
file and line when possible, cite the project rule when one applies, and give a
practical remediation. No vague statements, no praise, no restating one root cause
as several findings — merge them into one with the strongest evidence.

### Write it short, and lead with the consequence

The reader wants **what breaks → why it matters → how to fix it**. How you proved it
comes last, or not at all. Never open a finding with your investigation method.

Hard limits — a finding that exceeds them is not more thorough, it is unread:

| Field | Limit | Contains |
| --- | --- | --- |
| `title` | one line | the defect as a noun phrase |
| `message` | **≤2 sentences** | what is wrong. Not how you found out. |
| `impact` | **≤2 sentences** | the concrete consequence if it ships |
| `suggestion` | **≤3 sentences** | the fix, specific enough to act on |
| `evidence` | **≤2 sentences**, optional | the proof, only when non-obvious |
| `patch` | **no prose cap**, optional | before/after code for the fix |

### Show the fix as code

`suggestion` says what to do; `patch` shows it. Include a patch whenever the
remediation is a concrete code edit — a reviewer should be able to apply it without
reconstructing it from a description. Omit it when the fix is structural (move this
into a shared service) or a judgement call, where invented code would be worse than none.

```json
"patch": [
  { "file": "src/BatchEditService.cs", "line": 491,
    "before": "var path = Path.Combine(root, param.PathName, param.UploadFile);",
    "after":  "var path = BuildLocalTempFilePath(param.PathName, param.UploadFile);" }
]
```

One entry per edit site, up to 5 — a fix touching more than that should show one or two
representative sites and describe the rest. `before` must be **verbatim from the file**,
not paraphrased, or the reader cannot match it against what they have; omit it for a
pure addition. `after` must be real code, never a description of code.

**Patches are exempt from the prose caps.** Code is not prose, and truncating it defeats
the point of including it — the limit is 800 characters per side, enough for a method
body and small enough to keep from pasting whole files. Quote only the lines that change
plus the minimum context needed to locate them.

**Code is never translated.** `reportLanguage` governs the prose around a patch; the code
itself, including comments and identifiers, is reproduced exactly as it appears — or
would appear — in the file. `note` is prose and follows the report language.

Verification discipline is unchanged — keep verifying exactly as thoroughly. `evidence`
exists so that the proof stays available without crowding out the point. Use it only
when the reader would otherwise doubt the claim (a non-obvious command, a byte-level
check, a count across many files). If the cited line speaks for itself, omit it.

Do not list every file you inspected. Name one or two representative ones and give the
count: "every source file at the base commit is CRLF (checked all 120)".

Bad — buries the point under methodology:

> Verified against raw blob bytes with `git cat-file blob` (not `git show`, which can
> apply EOL conversion): every pre-existing source file at the base commit is 100%
> CRLF (`OrderService.cs` 240/240, `PricingCalculator.cs` 360/360,
> `ConfigLoader.cs` 26/26), and the files this PR adds are also committed CRLF, and
> there is no `.gitattributes`, so the rule is violated by the very commit that
> introduces it, and …

Good — same facts, ordered for the reader:

> **message:** This PR adds `.editorconfig` with `end_of_line = lf`, but the whole
> repository is committed CRLF and there is no `.gitattributes` to normalize it.
> **impact:** The first `dotnet format` run rewrites every file, producing whole-file
> diffs unrelated to the change and destroying `git blame` attribution.
> **suggestion:** Either add `.gitattributes` (`* text=auto eol=lf`) and normalize in
> one isolated commit, or set `end_of_line = crlf` to match reality — the lower-risk
> option if there is no active move to LF.
> **evidence:** Checked with `git cat-file blob` rather than `git show`, which converts
> EOL; every file at the base commit and every file this PR adds is CRLF.

Say nothing about subjective preference unless it materially affects clarity,
consistency, safety, or maintainability. An empty findings list is a valid, good
outcome — do not manufacture findings to look thorough.

## 7. Emit the result

**Do not write the report by hand.** Write a draft JSON file of findings, then let
the script validate it, derive the verdict, and render the Markdown:

```bash
node "$SKILL_DIR/scripts/review.mjs" render --input draft.json           # Markdown
node "$SKILL_DIR/scripts/review.mjs" render --input draft.json --json    # JSON + report
node "$SKILL_DIR/scripts/review.mjs" validate --input draft.json         # check only
```

`--lang en|th` overrides the draft's `reportLanguage`. `--renumber` reassigns
`CR-001`… in severity order instead of failing on ordering.

The draft is a review result **without** `verdict` — everything else per
[schemas/review-result.schema.json](schemas/review-result.schema.json). If the script
exits non-zero, fix the draft and re-run; do not hand-write the output to work around
it. Relay its stdout as the report and its stderr as-is on failure.

Script diagnostics ("missing flag", "cannot read file") are Thai regardless of
`--lang`, matching `jira-tracker`. `--lang` governs the review that reaches the reader,
not the tooling messages you act on. Text that does reach the reader — a full-rerun
reason, a contradiction explanation — is written in both languages at its source.

**The verdict is derived, never chosen:**

| Condition | Verdict |
| --- | --- |
| any `blocking` finding | `changes_required` |
| `warning`s but no `blocking` | `pass_with_warnings` |
| no actionable findings | `pass` |
| target unresolvable / diff unreadable / review aborted | `unable_to_complete` |

Only `unable_to_complete` is declared by you — no set of findings can express "the
review did not happen" — and it requires a non-empty `limitations`.

### What the script enforces

Length caps, ordering, enums, verdict consistency, that a `preExisting` finding is never
`blocking`, and that the rendered output contains **no raw HTML** — Bitbucket renders
none of it, so a tag would reach the reader as literal text.

Prose is handled for you: a tag-shaped sequence left bare in `title`, `message`,
`impact`, `suggestion`, `evidence`, a patch `note`, a check detail or a limitation is
**wrapped in backticks automatically** — `Promise<void>`, `<ng-container>`, `<UserCard>`,
`Map<string, List<int>>`. Without that, GitHub strips the tag and the sentence silently
loses a word, so the backticks are the correct markup rather than a workaround.
Comparisons that are not tag-shaped (`count < 0`, SQL `<>`) are untouched, escaping twice
is a no-op, and you can still write the backticks yourself.

**`patch` is never escaped.** Code reaches the reader byte for byte — it renders inside a
fenced block, where no provider sanitizes anything and the reviewer needs it exact enough
to apply.

The `RenderError` remains for HTML the **renderer itself** produced, which is a bug in
this skill rather than something a finding can cause. Caps are **per language**: Thai has no inter-word spaces, so the same
character budget carries far more content, and its limits are ~60% of the English ones.
Sentence counts are checked for English only, ignoring periods inside `` `code` `` and
version numbers.

### Record what you dismissed

Anything you examined and decided **not** to report — a pattern that looks wrong but is
deliberate, a risk that turned out to be handled — belongs in `dismissed` with the
reason, not in `limitations` prose:

```json
{ "category": "testing", "file": "tests/OrderMappingTests.cs",
  "why": "characterization tests; inline comments and a docs/ writeup make the intent explicit" }
```

`review-pr` carries these into the next round's state and **refuses to render a later
review that reports one of them without explanation**. Skipping this field is how a
follow-up review ends up silently contradicting its own previous conclusion.

### Markdown report

Produced by `scripts/review.mjs` in [the resolved report language](#report-language) —
shown here so you know what the draft turns into, not as something to reproduce by hand.

```markdown
## Code Review

**Verdict:** Changes required
**Reviewed range:** `abc123..def456`
**Scope:** 24 of 31 changed files — `docs/**` excluded at the requester's direction

### Blocking

#### 1. Possible null dereference

`src/PaymentService.cs:84` · violates `AGENTS.md#null-handling`

The lookup result can be null before its `Id` property is accessed.
A missing payment record will throw at runtime instead of returning 404.

**Recommended change:** Validate the result and return the repository-standard
not-found response.

```diff
-var payment = await _repo.FindAsync(id);
+var payment = await _repo.FindAsync(id);
+if (payment is null) return NotFound();
```

_Evidence: checked all three call sites; none guard the result._

### Warnings

...

### Checks

- `dotnet build` — Passed
- `dotnet test` — Failed

### Limitations

- Integration tests were not executed because the required database was unavailable.
```

The renderer handles the rules that used to live here — `message` and `impact` as
separate sentences rather than a wall of text, `evidence` last in italics, `Scope`
only when coverage was partial, empty sections omitted.

Findings are `####` headings and **nothing is indented**: Bitbucket does not parse a
fenced block indented under a list item, and collapses it into a single inline run with
the language tag leaking in as text.

Return the report to the caller or user — **never post it anywhere.**

## Boundaries

This skill **must not**: merge branches, approve pull requests, push commits, create
or comment on PRs/issues, modify production configuration, expose secrets, run
destructive database commands, or silently edit source code.

It **may** propose patches inside findings. Actually applying a fix requires a
separate, explicit instruction from the user.
