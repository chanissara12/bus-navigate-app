# For Typescript (shared fragment)

Used by: react, angular

Resolve rule: emit `## Plain` bullets always as `### For Typescript` in the final
CLAUDE.md/AGENTS.md. Never leave a pointer to this file in delivered output.

## Plain

- Strict mode on, avoid `any` — prefer `unknown` + narrowing when the real type isn't known yet
- Named exports only — plays better with refactors and auto-import than default exports
- Prefer `undefined` for "no value yet" (optional props, uninitialized state — it's TS/JS's native absence); use `null` only when a value is intentionally, explicitly empty (e.g. mirrors a nullable API/DB field) — don't use the two interchangeably
- `async/await` over `.then` chains
- Avoid the non-null assertion (`!`) — narrow the type instead; `!` compiles clean but is a top cause of "compiles fine, crashes at runtime" bugs
