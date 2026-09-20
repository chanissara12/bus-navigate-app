---
name: bridge
version: 0.1.1
description: Send work to another agent (any CLI agent participating in this project's mailbox — Claude Code, Codex, or others) or check for a reply, via the Agent Bridge mailbox, so agents can hand tasks to each other without a human relaying prompts. Trigger on "/bridge" or "$bridge", or when the user asks to have another agent implement, review, or fix something.
---

# Agent Bridge (`/bridge`)

CLI backing this skill: `scripts/bridge.js`, a plain Node.js script (no dependencies) living in a `scripts/` subfolder **right next to this SKILL.md file**. Wherever this skill folder is loaded from (this file's own path tells you), `scripts/bridge.js` is there too — self-contained, nothing to install or link. Resolve `<skill-dir>` as the directory containing this SKILL.md, then run:

```bash
node "<skill-dir>/scripts/bridge.js" <command> --flags
```

Full protocol write-up (design rationale, not needed to operate this skill) lives in the agent-hub source repo at `docs/agent-bridge-spec.md`. Message JSON shape is formally defined in `schema/message.schema.json` next to this file — `bridge.js` validates every message it writes against it, so a malformed `send`/`reply` fails with a schema error rather than writing garbage to the mailbox.

The mailbox lives at `<project>/.agent-bridge/mailbox/` inside whatever project you're currently working in — pass `--project "<cwd>"` (defaults to current working directory) so mail is scoped to the right project.

**Agent names are free-form, not a fixed pair.** `--as`/`--from`/`--to` accept any non-empty string — `claude`, `codex`, `chatgpt`, `gemini`, whatever identifies each participant consistently. There's no registry to update to add a new agent; any CLI capable of running `bridge.js` and picking a name can join the same mailbox. **Work out who "you" are first**: use a short, stable, lowercase name for `--as`/`--from` (match what other agents already use for you if this project has bridged before — check recent messages in the mailbox, or ask the user). Figure out the intended recipient's name the same way — ask the user if it's not obvious from context. The rest of this skill says "you" / "the other agent" — substitute your name and the recipient's name accordingly.

## Default behavior (`/bridge` with no other context): check inbox and do incoming work

1. Run:
   ```bash
   node "<skill-dir>/scripts/bridge.js" check --project "<cwd>" --as <you>
   ```
2. If there's unclaimed mail addressed to you:
   - Claim it: `node "<skill-dir>/scripts/bridge.js" claim --project "<cwd>" --id "<id>"`.
   - Do the work described in `content`/`context.instructions`/`context.files`.
   - Reply with what you did, and mark the original done in the same step:
     ```bash
     node "<skill-dir>/scripts/bridge.js" reply --project "<cwd>" --from <you> --to <other> --task-id "<taskId>" --type result --content "<summary of what changed and why>" --complete-id "<the claimed id>"
     ```
3. If nothing's there, say so — nothing to do.

## When the user asks you to send the other agent a task (you're the issuer)

1. **Scope `content`/`instructions`/`files` to what this one task needs — not a dump of the whole session.** The other agent starts with zero memory of this conversation; write for that reader. Concretely:
   - `content`: the task itself, stated so it stands alone.
   - `--instructions`: only the constraints/decisions that actually bear on this task (a chosen approach, a rejected alternative worth not re-litigating, an acceptance criterion) — not a transcript of how the conversation got here.
   - `--files`: only the paths the recipient actually needs to touch or read to do the work, not everything discussed this session.
   - Leave out prior back-and-forth, unrelated tangents, and context that only explains *why the user asked* rather than *what to do*. If a fact doesn't change what the recipient should do or check, it doesn't belong in the message.
2. Run:
   ```bash
   node "<skill-dir>/scripts/bridge.js" send --project "<cwd>" --from <you> --to <other> --type delegate --content "<what to do>" --instructions "<extra detail>" --files "<comma,separated,paths>"
   ```
   Use `--type review` instead of `delegate` for read-only work ("have it review this diff") rather than "implement/fix this." Note the `taskId` from the response.
3. Tell the user the task was handed off, and that **they need to separately run `/bridge` inside the other agent's own session** for it to notice and pick up the work — there's nothing watching by default; the first hop of a new thread always needs a human to trigger both sides.
4. Wait for the reply — **the two sides are not symmetric here**:
   - **If you're Claude Code**: spawn a background task (this session's own async task mechanism) that runs
     ```bash
     node "<skill-dir>/scripts/bridge.js" wait --project "<cwd>" --as claude --task-id "<taskId>" --timeout-ms 1800000 --interval-ms 5000
     ```
     This is genuine fire-and-forget — keep working with the user on other things; you'll be notified when it resolves.
   - **If you're any other agent** (Codex, or otherwise) without a native "wake me when done": run a **bounded poll**, not an indefinite wait:
     ```bash
     node "<skill-dir>/scripts/bridge.js" wait --project "<cwd>" --as <you> --task-id "<taskId>" --timeout-ms 60000 --interval-ms 3000
     ```
     This blocks for up to ~60 seconds. If it returns a reply, show it to the user. If it returns `{"status":"timeout",...}`, tell the user it hasn't replied yet and they can run `/bridge` again later — don't retry in a loop yourself.

## When you get a reply (wait resolved, or found via `check`)

The message is `type: "result"` or `"review"`. Summarize what the other agent did/found for the user. If it claims work is done, **review the diff yourself before telling the user it's good** — this is the review step in the loop, not an automatic pass.

- **If it looks wrong**: send a `review`-type reply back describing what to fix (`send`/`reply` with `--to <other> --type review --task-id <same taskId>`), tell the user to `/bridge` on the other side again to pick up the fix request, then wait for the next reply as above.
- **If it looks right**: close out the reply message before telling the user it's done — otherwise it sits unresolved in the mailbox forever.
  - If you found it via `wait`, it's already claimed (`wait` claims automatically) — just mark it done:
    ```bash
    node "<skill-dir>/scripts/bridge.js" complete --project "<cwd>" --id "<the reply's id>"
    ```
  - If you found it via `check`, it's still unclaimed — claim it first, then mark it done:
    ```bash
    node "<skill-dir>/scripts/bridge.js" claim --project "<cwd>" --id "<the reply's id>"
    node "<skill-dir>/scripts/bridge.js" complete --project "<cwd>" --id "<the reply's id>"
    ```
  Then tell the user it's done. Don't chain any further automatic action beyond that — one command in, one response out, then stop, per the Agent Bridge protocol.
