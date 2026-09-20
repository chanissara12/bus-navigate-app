# GitHub adapter

Provider commands for GitHub and GitHub Enterprise. Prefer the **GitHub CLI**; fall back
to `gh api` only where the CLI cannot express what is needed.

Do not use GitHub Copilot Code Review or any paid auto-review service.

## detect

```bash
git remote get-url origin        # host is github.com, or a GitHub Enterprise host
gh repo view --json nameWithOwner --jq .nameWithOwner
```

`gh repo view` succeeding inside the repository is strong confirmation. For Enterprise,
the host must also appear in `gh auth status`.

## authenticate

```bash
gh auth status
```

Missing or expired → stop and tell the user to run `gh auth login`. Never run it for
them, never print the token. Required scopes: `repo` read, pull request read, and
comment write. Do not request `admin` or merge-capable scopes.

## listOpen

```bash
gh pr list \
  --state open \
  --base "$BASE" \
  --limit 20 \
  --json number,title,author,baseRefName,headRefName,isDraft,reviewDecision,updatedAt
```

Filter out drafts and PRs whose `reviewDecision` is already `APPROVED` unless the user
asked for everything. Add `--author` when the user narrowed by author.

Verify the base branch exists before filtering on it:

```bash
git ls-remote --heads origin dev
```

## get

```bash
gh pr view "$ID" --json number,title,body,author,baseRefName,headRefName,\
isDraft,state,reviewDecision,updatedAt,headRefOid,changedFiles,additions,deletions
```

`headRefOid` is the head SHA. Resolve the base SHA from the merge base after fetching:

```bash
git fetch origin "$BASE_BRANCH"
git merge-base "origin/$BASE_BRANCH" "$HEAD_SHA"
```

Using the merge base (rather than the current base tip) keeps the review scoped to the
PR's own commits.

## checkout

Preferred — isolated worktree, leaves the user's working directory untouched:

```bash
git fetch origin "pull/$ID/head:refs/remotes/origin/pr-$ID"
git worktree add ".review-worktrees/pr-$ID" "refs/remotes/origin/pr-$ID"
```

Only when the working tree is clean and the user prefers in-place:

```bash
gh pr checkout "$ID"
```

Verify afterwards:

```bash
git -C ".review-worktrees/pr-$ID" rev-parse HEAD   # must equal headRefOid
```

Mismatch → stop.

## getDiff

```bash
gh pr diff "$ID"
```

Or, from the prepared worktree, the exact range:

```bash
git diff "$BASE_SHA...$HEAD_SHA"
```

## getChangedFiles

```bash
gh pr view "$ID" --json files --jq '.files[].path'
```

## getComments

```bash
gh pr view "$ID" --json comments --jq '.comments[] | {id, author: .author.login, body}'
```

Scan bodies for the `<!-- ai-review-state: ... -->` marker to find a previous
AI-assisted review and its `reviewedHeadSha`.

## postComment

```bash
gh pr comment "$ID" --body-file "$BODY_FILE"
```

Use `--body-file`, not `--body`, so Markdown and backticks survive shell quoting.

To update an existing AI-review comment instead of duplicating:

```bash
gh pr comment "$ID" --edit-last --body-file "$BODY_FILE"
```

`--edit-last` edits the last comment **by the authenticated user** — safe only when
`getComments` confirmed that comment is the AI review carrying the state marker.
Otherwise post a new comment labeled as an updated review.

Treat the comment as posted only when the command exits zero and returns the comment
URL. Report that URL.

## postInlineComment

Optional. Requires a review with positioned comments:

```bash
gh api "repos/$OWNER/$REPO/pulls/$ID/reviews" \
  -f event=COMMENT \
  -f body="$SUMMARY" \
  -F 'comments[][path]=src/PaymentService.cs' \
  -F 'comments[][line]=84' \
  -F 'comments[][side]=RIGHT' \
  -F 'comments[][body]=...'
```

Only for lines present in the diff at the reviewed head SHA — GitHub rejects positions
outside the diff. Never send `event=REQUEST_CHANGES` or `event=APPROVE` here.

## Disabled by default

```bash
gh pr review --approve          # never
gh pr review --request-changes  # explicit Senior Developer instruction only
gh pr merge                     # never
```

`approve` and merge are not implemented. `requestChanges` runs only on an explicit,
confirmed instruction — see the approval policy in [../SKILL.md](../SKILL.md).
