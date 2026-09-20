# GitLab adapter

Provider commands for GitLab.com and self-hosted GitLab. Prefer the **GitLab CLI**
(`glab`); fall back to the REST API via `glab api` where the CLI is insufficient.

GitLab calls them **Merge Requests**. Use that term in provider-facing commands and in
user-visible GitLab output; the parent skill's workflow stays unified.

Do not require GitLab Duo or any paid AI review feature.

## detect

```bash
git remote get-url origin        # gitlab.com, or a self-hosted GitLab host
glab repo view 2>/dev/null
```

For self-hosted, confirm the host from `glab auth status`, a `GITLAB_HOST` environment
variable, or a `.gitlab-ci.yml` in the repository. A `.gitlab-ci.yml` alone is
suggestive but not conclusive — a repo can be mirrored. Require host agreement before
declaring GitLab.

## authenticate

```bash
glab auth status
```

Missing → stop and tell the user to run `glab auth login --hostname <host>`. For API
access, `GITLAB_TOKEN` may already be set; use it without echoing it. Required scope:
`api` read plus note-create. Do not request `sudo` or maintainer-level scopes.

## listOpen

```bash
glab mr list --target-branch "$BASE" --per-page 20
```

For structured fields, prefer the API:

```bash
glab api "projects/:id/merge_requests?state=opened&target_branch=$BASE&order_by=updated_at&per_page=20"
```

Useful fields: `iid`, `title`, `author.username`, `target_branch`, `source_branch`,
`draft`, `updated_at`, `sha`, `has_conflicts`.

**Use `iid` (per-project id), not `id`** — `iid` is the number shown as `!142` in the UI
and the one `glab mr` commands accept.

Drop drafts (`draft: true`) and already-approved MRs unless the user asked otherwise.
Verify the base branch exists first:

```bash
git ls-remote --heads origin dev
```

## get

```bash
glab mr view "$IID" --output json
```

Read: `iid`, `title`, `description`, `author.username`, `target_branch`,
`source_branch`, `draft`, `state`, `updated_at`, `sha`, `diff_refs`.

`diff_refs` gives the authoritative revisions:

- `diff_refs.base_sha` → base SHA
- `diff_refs.head_sha` → head SHA
- `diff_refs.start_sha` → the base at the time the MR was opened

Use `base_sha` and `head_sha`. If `diff_refs` is absent (MR still being prepared by
GitLab), stop and retry rather than inventing a range.

## checkout

Preferred — isolated worktree:

```bash
git fetch origin "merge-requests/$IID/head:refs/remotes/origin/mr-$IID"
git worktree add ".review-worktrees/pr-$IID" "refs/remotes/origin/mr-$IID"
```

The `merge-requests/*/head` ref namespace is available on GitLab.com and standard
self-hosted installs. If the fetch fails, fall back to fetching the source branch by
name, then verify the SHA matches.

In-place, only when the working tree is clean:

```bash
glab mr checkout "$IID"
```

Verify:

```bash
git -C ".review-worktrees/pr-$IID" rev-parse HEAD   # must equal diff_refs.head_sha
```

## getDiff

```bash
glab mr diff "$IID"
```

Or, from the worktree, the exact range:

```bash
git diff "$BASE_SHA...$HEAD_SHA"
```

## getChangedFiles

```bash
glab api "projects/:id/merge_requests/$IID/changes" --jq '.changes[].new_path'
```

Note `new_path` vs `old_path` for renames; report the new path.

## getComments

```bash
glab api "projects/:id/merge_requests/$IID/notes?per_page=100" \
  --jq '.[] | {id, author: .author.username, system, body}'
```

Ignore `system: true` notes (GitLab's own activity entries). Scan the rest for the
`<!-- ai-review-state: ... -->` marker.

## postComment

```bash
glab mr note "$IID" --message "$(cat "$BODY_FILE")"
```

Or via API when the message must be passed as a file:

```bash
glab api --method POST "projects/:id/merge_requests/$IID/notes" \
  --field "body=@$BODY_FILE"
```

To update an existing AI-review note rather than duplicate it:

```bash
glab api --method PUT "projects/:id/merge_requests/$IID/notes/$NOTE_ID" \
  --field "body=@$BODY_FILE"
```

Only edit a note authored by the authenticated user and carrying the state marker.
Never edit a human's note.

Treat as posted only on a successful response containing the new note id.

## postInlineComment

Optional. GitLab inline comments are discussions with a position payload:

```bash
glab api --method POST "projects/:id/merge_requests/$IID/discussions" \
  -f body="..." \
  -f position[position_type]=text \
  -f position[base_sha]="$BASE_SHA" \
  -f position[start_sha]="$START_SHA" \
  -f position[head_sha]="$HEAD_SHA" \
  -f position[new_path]="src/PaymentService.cs" \
  -f position[new_line]=84
```

All three SHAs must come from `diff_refs`, and the line must exist in the diff — GitLab
rejects mismatched positions. If a position is uncertain, put the finding in the general
comment instead.

## Disabled by default

```bash
glab mr approve   # never
glab mr merge     # never
```

Approval and merge are not implemented. GitLab approval rules often carry policy
meaning; only a human may satisfy them.
