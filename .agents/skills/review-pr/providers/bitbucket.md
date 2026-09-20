# Bitbucket Cloud adapter

Provider commands for Bitbucket Cloud. There is no official first-party CLI equivalent
to `gh`/`glab`, so this adapter combines **local Git** with the **Bitbucket REST API
v2.0**.

Do not require Bitbucket Rovo AI review or any paid AI review product.

## Conventions

```text
API base:   https://api.bitbucket.org/2.0
Workspace:  the org/team slug        (e.g. acme)
Repo slug:  the repository slug      (e.g. payments-api)
PR id:      the number shown in the UI
```

Derive workspace and repo slug from the remote:

```bash
git remote get-url origin
# https://bitbucket.org/<workspace>/<repo>.git
# git@bitbucket.org:<workspace>/<repo>.git
```

## detect

Host is `bitbucket.org`. Confirm with an authenticated read before proceeding (run the
`bb-auth.mjs` step below first, so `$BB_AUTH` is set):

```bash
curl -sS -f -H "Authorization: $BB_AUTH" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO"
```

## authenticate

Authentication uses a workspace/repository/project **access token**, sent as
`Authorization: Bearer`. That is the only supported credential — app passwords were
removed by Atlassian on 2026-07-28, and a second path is deliberately not offered so an
auth failure has one explanation rather than several. See
[../references/config.md](../references/config.md).

Credentials come from, in order:

1. `.review-pr/config.local.json` → `bitbucket.token`
2. environment variable `BITBUCKET_TOKEN`
3. the `bitbucket.org` entry in the Git credential manager / `~/.netrc`

Required permissions: **Repositories: Read** and **Pull requests: Write** (write is what
grants comment creation). Do not request Admin, Webhooks, or merge permissions.

**Load the credential into the environment without printing it.** The helper reads the
config and emits only an `export BB_AUTH=…` line that `eval` consumes silently:

```bash
eval "$(node "$SKILL_DIR/scripts/bb-auth.mjs")"   # sets BB_AUTH; nothing is printed
```

`$SKILL_DIR` is this skill's directory. Every Bitbucket request below then sends
`-H "Authorization: $BB_AUTH"` — there is no `-u user:password` on the command line, so
the secret never appears in a command echo.

When the credential comes from the environment instead of the config file, set `BB_AUTH`
yourself the same way — a `Bearer <token>` value — rather than passing `-u`.

If no credential resolves, **stop** and tell the user to fill in
`.review-pr/config.local.json` (creating it from the template if missing) or set the
environment variables. **Never echo the token, the API token, the header value, or a
credential file** — not in output, not in a command, not in a PR comment.

## listOpen

```bash
curl -sS -f -H "Authorization: $BB_AUTH" -G \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO/pullrequests" \
  --data-urlencode 'state=OPEN' \
  --data-urlencode "q=destination.branch.name=\"$BASE\"" \
  --data-urlencode 'sort=-updated_on' \
  --data-urlencode 'pagelen=20'
```

Useful fields per entry:

```text
id
title
author.display_name  /  author.nickname
destination.branch.name        → base branch
source.branch.name             → head branch
source.commit.hash             → head SHA (short; expand locally)
destination.commit.hash        → base commit
updated_on
state
```

Bitbucket has no draft flag — treat every open PR as reviewable. Verify the base branch
exists before filtering:

```bash
git ls-remote --heads origin dev
```

## get

```bash
curl -sS -f -H "Authorization: $BB_AUTH" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO/pullrequests/$ID"
```

Read `id`, `title`, `description`, `author`, `source`, `destination`, `state`,
`updated_on`, `participants` (for existing approvals), `merge_commit`.

Bitbucket returns **12-character short hashes**. Expand to full SHAs locally after
fetching, and use the full SHAs everywhere downstream:

```bash
git rev-parse "$SHORT_SHA"
```

Resolve the base as the merge base, not the destination tip:

```bash
git fetch origin "$BASE_BRANCH" "$HEAD_BRANCH"
git merge-base "origin/$BASE_BRANCH" "$HEAD_SHA"
```

## checkout

Bitbucket exposes no `pull-requests/*/head` ref namespace. Fetch the source branch and
verify it still points at the PR head:

```bash
git fetch origin "$HEAD_BRANCH"
git worktree add ".review-worktrees/pr-$ID" "$HEAD_SHA"
```

Check out the **SHA**, not the branch name — the contributor may push between the
metadata call and the checkout, and the review must be pinned to a known commit.

Verify:

```bash
git -C ".review-worktrees/pr-$ID" rev-parse HEAD   # must equal the expanded head SHA
```

If the SHA is not reachable after fetching (branch deleted or force-pushed), stop and
report it.

## getDiff

From the worktree, using the verified range:

```bash
git diff "$BASE_SHA...$HEAD_SHA"
```

Or from the API when local fetch is unavailable:

```bash
curl -sS -f -H "Authorization: $BB_AUTH" -L \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO/pullrequests/$ID/diff"
```

`-L` matters — the diff endpoint redirects.

## getChangedFiles

```bash
curl -sS -f -H "Authorization: $BB_AUTH" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO/pullrequests/$ID/diffstat?pagelen=100"
```

Read `values[].new.path` (`old.path` for deletions). Follow the `next` link when the
result is paginated — a truncated file list silently narrows the review.

## getComments

```bash
curl -sS -f -H "Authorization: $BB_AUTH" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO/pullrequests/$ID/comments?pagelen=100"
```

Skip entries with `deleted: true`. Scan `content.raw` for the
`<!-- ai-review-state: ... -->` marker.

## postComment

```bash
curl -sS -f -H "Authorization: $BB_AUTH" \
  -X POST \
  -H 'Content-Type: application/json' \
  --data @"$PAYLOAD_FILE" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO/pullrequests/$ID/comments"
```

`$PAYLOAD_FILE` holds `{"content": {"raw": "<markdown>"}}`. Build it with a JSON
encoder — do not hand-splice Markdown into a JSON string; backticks, quotes and newlines
in findings will corrupt the payload.

To update a previous AI review comment instead of duplicating:

```bash
curl -sS -f -H "Authorization: $BB_AUTH" \
  -X PUT \
  -H 'Content-Type: application/json' \
  --data @"$PAYLOAD_FILE" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO/pullrequests/$ID/comments/$COMMENT_ID"
```

Only update a comment authored by the authenticated account **and** carrying the state
marker. Never edit or delete a human's comment.

Treat the comment as posted only on HTTP 201 (or 200 for update) with an `id` in the
response. `-f` makes curl exit non-zero on HTTP errors — keep it, and check the exit
code rather than assuming success.

## postInlineComment

**Optional; not required for the initial version.** Bitbucket supports it via an `inline`
object:

```json
{
  "content": { "raw": "..." },
  "inline": { "path": "src/PaymentService.cs", "to": 84 }
}
```

`to` is a line in the new file, `from` a line in the old. Bitbucket silently orphans
comments whose line is not in the diff, so prefer the general comment unless the position
is certain.

## Disabled by default

```text
POST .../pullrequests/$ID/approve   # never
POST .../pullrequests/$ID/merge     # never
```

Approval and merge are not implemented in this adapter. Bitbucket's "request changes"
maps to `POST .../request-changes` and requires an explicit Senior Developer
instruction — see the approval policy in [../SKILL.md](../SKILL.md).
