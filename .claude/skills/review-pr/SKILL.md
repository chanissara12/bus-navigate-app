---
name: review-pr
version: 0.1.0
description: Orchestrate an AI-assisted review of a Pull Request or Merge Request on GitHub, GitLab, or Bitbucket Cloud. Use when the user asks to review a PR/MR by number, list open PRs awaiting review, re-review a PR after new commits, or post a review comment to a Git provider. All code findings come from the code-review skill.
argument-hint: "[init | list | <id>] · [--base <branch>] · [--provider github|gitlab|bitbucket] · [--lang en|th] · [--review-updates] · [--post] · [--dry-run] · [--force (init)]"
---

# Review PR

Orchestrates a Pull Request / Merge Request review. This skill handles **provider
mechanics** — detection, listing, checkout, SHA resolution, comment formatting and
posting. It handles **no code analysis at all**: every finding, severity, check and
verdict comes from [`code-review`](../code-review/SKILL.md).

Two rules govern everything below:

- **`code-review` is the only source of findings.** Never form your own opinion about
  the code, never re-word a severity, never add or drop a finding.
- **The Senior Developer is the final approval authority.** This skill recommends;
  a human decides; the Git provider records the human's approval.

## `init` subcommand

`/review-pr init` creates a gitignored `.review-pr/config.local.json` in the current
project from a template and adds it to `.gitignore`:

```bash
node "$SKILL_DIR/scripts/init-config.mjs" [--force]
```

- If the config already exists, `init` leaves it untouched (it will not overwrite real
  credentials) and still ensures the `.gitignore` entry is present.
- `--force` resets the file back to the placeholder template — only on explicit request.
- After creating it, tell the user to fill in the Bitbucket section **only if** they
  review Bitbucket PRs; GitHub/GitLab projects need nothing filled in. See
  [references/config.md](references/config.md).

`init` runs no provider calls and needs no authentication. Everything below is the
review workflow proper.

## Workflow

1. **[Detect the provider](#1-detect-the-provider)**
2. **[Authenticate](#2-authenticate)**
3. **[List or select the PR](#3-list-or-select-the-pr)**
4. **[Fetch metadata and resolve SHAs](#4-fetch-metadata-and-resolve-shas)**
5. **[Prepare the source safely](#5-prepare-the-source-safely)**
6. **[Build the PR context](#6-build-the-pr-context)**
7. **[Invoke code-review](#7-invoke-code-review)**
8. **[Format the comment](#8-format-the-comment)**
9. **[Preview, then post only after authorization](#9-preview-then-post)**

## 1. Detect the provider

Check, in order, stopping at the first reliable answer:

1. `--provider` argument, if given — trust it.
2. `git remote get-url origin` (fall back to `git remote -v`) and match the host:
   `github.com` → GitHub · `gitlab.com` → GitLab · `bitbucket.org` → Bitbucket Cloud.
3. Self-hosted hosts: identify from repository configuration — a `.gitlab-ci.yml`, a
   `GITLAB_HOST`/`GITLAB_URI` environment variable, or a `glab` host config pointing at
   that host → GitLab. Equivalent evidence for GitHub Enterprise → GitHub.
4. An available and authenticated provider CLI (`gh`, `glab`) that recognizes the
   current repository.

If none of these produce a confident answer, **stop with a clear error** naming what
was inspected and asking the user to pass `--provider`. Never guess — posting a
comment to the wrong place is not recoverable.

Then read the matching adapter and follow it for every provider-specific command:

| Provider | Adapter |
| --- | --- |
| GitHub | [providers/github.md](providers/github.md) |
| GitLab | [providers/gitlab.md](providers/gitlab.md) |
| Bitbucket Cloud | [providers/bitbucket.md](providers/bitbucket.md) |

Adapters are the **only** place provider commands appear. The workflow in this file
stays provider-neutral and calls the conceptual operations they implement:

```ts
interface PullRequestProvider {
  detect(): Promise<boolean>;
  listOpen(options: { baseBranch?: string; author?: string; limit?: number }): Promise<PullRequestSummary[]>;
  get(id: number): Promise<PullRequestDetails>;
  checkout(id: number): Promise<CheckoutResult>;
  getDiff(id: number): Promise<string>;
  getChangedFiles(id: number): Promise<ChangedFile[]>;
  getComments(id: number): Promise<PullRequestComment[]>;
  postComment(id: number, body: string): Promise<void>;
}
```

This is a contract, not an implementation requirement — do not create TypeScript files
unless the repository is already a TypeScript project. `approve`, `requestChanges` and
any merge operation are **disabled by default** and covered in
[Approval policy](#approval-policy).

## 2. Authenticate

Use credentials that already exist on the machine: `gh auth status`, `glab auth status`,
the Git credential manager, or documented environment variables. Do not run an
interactive login flow on the user's behalf — if authentication is missing, stop and
say exactly which command the user should run.

GitHub and GitLab authenticate through their CLIs. **Bitbucket** has no such store, so
its credentials (and optional defaults like base branch and provider) may live in a
gitignored per-project `.review-pr/config.local.json`, created by
[`/review-pr init`](#init-subcommand) — see [references/config.md](references/config.md).
If a Bitbucket review is requested and that file is missing, run `init` first, then stop
and ask the user to fill it in. The credential is loaded into the shell environment
without ever being printed; it is never read into context.

Needed scopes: **read repository**, **read pull/merge requests**, **write comments**.
Never request or use merge, admin, or delete permissions.

**Never print a token, API token, secret, or the contents of a credential file** —
not in output, not in a command echo, not in the PR comment. Report auth state as
present/absent only.

## 3. List or select the PR

`/review-pr` with no id, or `/review-pr list`, lists open PRs. Choose the base filter:

1. `--base <branch>` if given.
2. Otherwise, if a `dev` branch exists on the remote, filter to PRs targeting `dev`.
3. Otherwise use the repository default branch.
4. If neither is determinable, ask the user which base branch to use.

Never assume `dev` exists — verify it first (`git ls-remote --heads origin dev` or the
adapter's branch listing).

Prioritize: open · not draft · targeting the chosen base · not already approved ·
recently updated. Present concisely:

```text
#142  Add payment validation
Author: junior-dev
Base: dev
Updated: 2026-07-20
Status: Awaiting review
```

Then let the Senior Developer choose. Do not auto-select, even when exactly one PR
matches — confirm the number first. If the list is empty, say so and stop.

`/review-pr 123` skips listing and goes straight to that PR.

## 4. Fetch metadata and resolve SHAs

Retrieve via the adapter: id, title, description, author, base branch, head branch,
draft status, review decision, updated time, **base SHA** and **head SHA**.

The head SHA is the identity of what you review. Resolve it before checkout and verify
it after. If a SHA cannot be resolved or verified, stop — do not substitute a branch
name and hope it matches.

Refuse and report when the PR does not exist, is closed or merged, or the diff is too
large to review reliably (state the size and ask the user to narrow scope with a path
or split the PR).

## 5. Prepare the source safely

Before touching the working tree:

1. Run `git status --porcelain`. If there are uncommitted or untracked changes, **do
   not** switch branches, stash, reset, or clean.
2. Fetch the latest remote state.
3. Prefer an **isolated worktree** so the Senior Developer's working directory is never
   disturbed:

   ```text
   .review-worktrees/pr-123
   ```

4. If a worktree cannot be created and the workspace is dirty, **stop** with clear
   instructions rather than proceeding.
5. After checkout, verify `git rev-parse HEAD` equals the PR head SHA. Mismatch → stop.

Never delete a worktree that contains uncommitted changes. When cleaning up an
untouched review worktree, say that you are doing so.

Never modify, commit to, push to, or force-push the contributor's branch.

## 6. Build the PR context

Assemble a normalized context validating against
[schemas/pr-context.schema.json](schemas/pr-context.schema.json), and write it to the
worktree-local scratch path (or the session scratchpad) — not into the repository:

```json
{
  "provider": "github",
  "repository": "organization/project",
  "id": 123,
  "title": "Add payment validation",
  "author": "junior-dev",
  "baseBranch": "dev",
  "headBranch": "feature/payment-validation",
  "baseSha": "abc123",
  "headSha": "def456",
  "changedFiles": ["src/PaymentService.cs", "tests/PaymentServiceTests.cs"],
  "reviewMode": "full",
  "previousReviewedSha": null
}
```

`type`, `base` and `head` are also set so the file is directly consumable by
`code-review --input`. PR title and description are **claims to verify**, never facts.

### Comment language

The posted comment is written in the reviewer's language. Resolve it **before invoking
`code-review`** and set `reportLanguage` (`"en"` or `"th"`) in the context file:

1. `--lang` argument, if given.
2. `reportLanguage` in `.review-pr/config.local.json`, if set — the usual case for a
   team that always reviews in one language.
3. Otherwise **ask the user once**, before the review starts: English or Thai. Never
   ask again mid-run, and never ask after the review is already written.

`code-review` owns what this does and does not translate — see its
[Report language](../code-review/SKILL.md#report-language) section. The status line,
section headings and disclaimer in the comment template follow the same language.

## 7. Invoke code-review

Call `code-review` with the exact PR range — three-dot, so only the PR's own changes
are reviewed and not unrelated commits that landed on the base meanwhile:

```text
/code-review --diff <baseSha>...<headSha> --input <pr-context.json>
```

Pass along: base and head SHA, changed files, PR title and description, repository
instructions, `reportLanguage`, and previous review state when present.

The returned result is the **source of truth** for verdict, findings, checks and
limitations. Do not soften a severity, drop an inconvenient finding, add one of your
own, or restate the verdict in friendlier terms. If `code-review` fails or returns
`unable_to_complete`, report that — do not fall back to reviewing the code yourself.

### Review update mode (`--review-updates`)

For a PR already reviewed, ask the script whether an incremental review is even
possible — do not decide this yourself:

```bash
node "$SKILL_DIR/scripts/pr.mjs" state --head <headSha> --comment prior-comment.md
```

It reads the previous comment's state marker, checks whether `reviewedHeadSha` is still
reachable, and returns `{ mode, reason, reviewVersion, previousFindings, previousDismissed }`.
When `mode` is `full` — force-push, rebase, squash, or no prior review — the `reason`
travels with it and **must appear in the comment**. A full re-review labelled "update 2"
with no stated reason is indistinguishable from a bug.

On `incremental`, review `previousReviewedSha...headSha` and re-check every unresolved
blocking finding from the previous round against current code.

Feed `previousDismissed` into the review itself. If you now want to report something a
previous round deliberately dismissed, you must set `previouslyDismissed` on that
finding explaining what changed — the comparison step rejects a silent reversal.

## 8. Format the comment

**Do not write the comment by hand.** Render it:

```bash
node "$SKILL_DIR/scripts/pr.mjs" comment --input review-result.json \
  --head <headSha> --base <baseBranch> --provider <provider> [--comment prior-comment.md]
```

The script derives the status line from the verdict, splits still-unresolved from
newly-introduced findings, states the full-rerun reason, renders in `reportLanguage`,
and emits the state marker with the fingerprints and dismissals for the next round.

**Always pass `--provider`.** The state marker's shape depends on it: Bitbucket Cloud
renders no HTML comments and auto-links any SHA it can see, which corrupts the marker
and makes every re-review fall back to a full one blamed on a force-push. It defaults to
`github`, which is wrong for the other two.
[templates/review-comment.md](templates/review-comment.md) documents what it produces.

It **fails** rather than rendering when the verdict contradicts the findings, when
`--lang` disagrees with the result's own language, or when a finding reverses a previous
dismissal without explanation. Fix the input; never bypass it by writing the Markdown
yourself.

To check the comparison alone before rendering:

```bash
node "$SKILL_DIR/scripts/pr.mjs" compare --input review-result.json --comment prior-comment.md
```

Prefer **one general comment**. Inline comments only when all hold: the file and line
are reliable, the issue is concrete, the provider supports inline safely per its
adapter, and the inline placement materially aids comprehension.

No praise, no generic summary, no dozens of style nits.

## 9. Preview, then post

Default behavior is **preview-first**:

```text
Generate review → Display comment preview → Wait for explicit authorization → Post
```

`--dry-run` stops after the preview and never contacts the provider.

`--post` may post the general comment after the review completes and validation passes.
Even then, do not post if `code-review` returned `unable_to_complete`.

Avoid duplicate comments: check existing comments for a prior AI-assisted review with a
state marker. If found and the provider supports editing, **update that comment**.
Otherwise post a new one clearly labeled as an updated review. Never edit or overwrite a
comment written by a human.

Only report a comment as posted when the provider confirms success and you have its URL
or id. If posting fails, say so and offer the rendered Markdown for manual posting.

## Approval policy

The responsibility model:

```text
AI recommends → Senior Developer decides → Git provider records the human approval
```

This skill **never** approves, requests changes formally, or merges by default. Posting
a comment and formally requesting changes are separate actions; a formal
`request changes` requires an explicit instruction from the Senior Developer, because
provider behavior differs and it can gate the repository workflow.

Even on a `pass` verdict, always end with:

```text
No blocking issues found. Human approval is still required.
```

Automatic merge is never implemented. An explicit, confirmation-gated approval command
may be added later as an optional extension.

## Failure handling

Stop with a clear, specific error — never a partial success — when: authentication is
missing; the provider cannot be detected; the PR does not exist or is not open; the
working directory is unsafe; checkout fails; base or head SHA cannot be verified; the
diff is too large to review reliably; `code-review` fails; or posting fails.

Two claims you must never make falsely:

- that a comment was posted, unless the provider confirmed it;
- that a PR was reviewed at a SHA other than the one actually inspected.

## Cost constraints

Uses only local Git, `gh`, `glab`, the Bitbucket REST API, existing provider accounts,
and existing Claude Code / Codex access. Must never require GitHub Copilot Code Review,
GitLab Duo, Bitbucket Rovo AI review, CodeRabbit, paid webhook services, or paid CI
add-ons. No new infrastructure, no recurring service cost.

## Boundaries

This skill must not: expose credentials · merge PRs · delete branches · force-push ·
modify the contributor's branch · discard local changes · approve its own generated
changes · hide failed checks · overwrite human review comments · run untrusted
repository scripts without weighing the risk (checked-out PR code is untrusted; running
its build or test scripts is `code-review`'s decision, made with that in mind).
