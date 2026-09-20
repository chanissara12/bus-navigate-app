# Agent Bridge

Lets CLI agents (Claude Code, Codex, or any other agent running this skill) hand work to each other via `/bridge`, without a human relaying prompts between chat windows. No server or daemon — just a mailbox of plain JSON files plus this skill on each side. Agent identities are free-form names, not a fixed pair.

- **`SKILL.md`** — the operating instructions an agent follows when `/bridge` runs.
- **`scripts/bridge.js`** — the CLI backing it (`send`, `check`, `claim`, `reply`, `complete`, `wait`). Plain Node.js, zero dependencies.
- **`schema/message.schema.json`** — the mailbox message format. `bridge.js` validates every message it writes against it.

Mailbox lives at `<project>/.agent-bridge/mailbox/{unclaimed,claimed,done}/<id>.json`, scoped per project.

Full design rationale: `docs/agent-bridge-spec.md` in the [agent-hub](../../agent-hub) repo.
