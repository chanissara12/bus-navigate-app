# Loading Indicator (shared fragment)

Used by: react, angular

Resolve rule: emit `## Plain` verbatim as `### Loading Indicator` (table + `#### Rules`)
in the final CLAUDE.md/AGENTS.md. Never leave a pointer to this file in delivered output.

## Plain

Classify by what's on screen, not by how long a call might take — an agent can always
tell from the markup/template whether something is static, fetched, or a triggered
action; it can never know a call's real-world latency ahead of time.

| UI pattern                                                                                                    | Treatment                                                       |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Static text / content that never depends on a fetch                                                                 | No indicator                                                           |
| View is populated by fetched data — lists, detail pages, dropdown options, any `[label]: [input]` field backed by an API call | Skeleton UI                                                            |
| User-triggered action — submit, save, delete, any button that mutates data                                           | Spinner — disable the control and show the spinner inline/on the button |

#### Rules

- A dropdown/select whose options come from an API counts as fetched data even though it's a small control — skeleton it, don't treat it as static just because it's compact
- Use a full-screen/backdrop spinner only when the action blocks the entire view (e.g. a multi-step wizard submit) — otherwise keep the spinner scoped to the triggering control
- If a similar case already has a loading treatment elsewhere in the repo, match it — consistency beats re-deriving the pattern from scratch
