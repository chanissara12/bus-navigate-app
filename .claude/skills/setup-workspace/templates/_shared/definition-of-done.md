# Definition of Done (shared fragment)

Used by: react, angular, netcore, go

Resolve rule: emit `## Plain` verbatim as the `## Definition of Done` section in the
final CLAUDE.md/AGENTS.md. Identical for every stack — never leave a pointer to this
file in delivered output.

## Plain

A task is complete only when

- Build succeeds
- Tests pass
- Formatting and any configured analyzers pass, verified in CI and not only locally
- Existing behavior is preserved
- Requested functionality is implemented
- No unnecessary files are added
- No unrelated code is modified
