# Comment Code (shared fragment)

Used by: react, angular, netcore, go

Resolve rule: emit `## Plain` always. Append the stack-named section's bullets after it
only when the target stack matches — inline the merged result into `### Comment Code` in
the final CLAUDE.md/AGENTS.md. Never leave a pointer to this file in delivered output.

## Plain

- `// Note:` — allowed for context that aids understanding
- `// TODO:` — if encountered **in files you are editing**, flag it to the user before proceeding

## Go

- Exported identifiers get a doc comment starting with the identifier name (`// PaymentService handles...`) only when the name alone doesn't make behavior obvious
