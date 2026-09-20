# Security Rules (shared fragment)

Used by: react, angular, netcore, go

Resolve rule: emit `## Plain` bullets always as `## Security Rules` in the final
CLAUDE.md/AGENTS.md. If the marker's selector names an extra stack, append that stack's
`##` block's bullets after the Plain ones. Never leave a pointer to this file in
delivered output.

## Plain

- DO NOT hardcode API keys, tokens, passwords, or credentials in source code
- DO NOT log sensitive data (passwords, tokens, secrets, connection strings)
- DO NOT commit `.env`, `.env.local`, or any file containing secrets or credentials
- `.env.example` is the only env file allowed in version control — placeholder values only

## .Net Core

- Never expose stack traces or internal error details in API responses
- `appsettings.Example.json` is also an acceptable config template alongside `.env.example` — placeholder values only
