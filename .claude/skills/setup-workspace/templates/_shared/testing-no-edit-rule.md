# Testing Rules — DO NOT edit a test to make it pass (shared fragment)

Used by: react, angular, netcore, go

Resolve rule: emit `## Plain` verbatim into the `### Rules` subsection under
`## Testing & Quality` in the final CLAUDE.md/AGENTS.md. Identical for every stack —
never leave a pointer to this file in delivered output.

## Plain

- **DO NOT edit a test to make a failure pass.** When a test breaks after a code change, stop and report which tests failed and why — decide whether the _code_ regressed or the expected behavior genuinely changed, summarize the impact, and wait for explicit approval before touching any test. Do not assume the test is wrong just because it is red.
