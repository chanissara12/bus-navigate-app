# Before Creating New Code (shared fragment)

Used by: react, angular, netcore, go

Resolve rule: emit `## Plain` with `{{ARTIFACTS}}` substituted using the value given in
the marker's argument — inline the resolved sentence into `### Before Creating New Code`
in the final CLAUDE.md/AGENTS.md. Never leave the marker or an unresolved `{{ARTIFACTS}}`
token in delivered output.

## Plain

Before creating a new {{ARTIFACTS}} — search whether an equivalent implementation
already exists and reuse it whenever possible. Before introducing any new type, ask the
user to confirm its name unless the name is explicitly specified in the requirement.
