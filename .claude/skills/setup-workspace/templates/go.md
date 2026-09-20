# {{FILE_NAME}}

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

<!--
  DRAFT — no existing Go project was surveyed for this template (unlike react.md /
  angular.md / netcore.md, which were reverse-engineered from real CLAUDE.md files).
  Coding Convention / Testing / Commands below reflect common Go idioms but haven't been
  checked against a real repo — sanity-check with the user before treating as ground truth.
-->

## Tech Stack

<!--
  resolve: agent-authored, not copied from this template.
  List only what's common/core to a Go service (language, and router/ORM only if the
  repo clearly commits to one). Do NOT guess a router, database driver, or decimal
  library — detect them from `go.mod`'s require block and list what's actually there.
  If something can't be detected, leave it for the user to fill in manually.
-->

- Go (module-based, see `go.mod` for version)

## Architecture

- Business logic belongs in `internal/service` (or the project's service layer) — not in
  HTTP handlers.
- Handlers only decode requests, call a service, and encode responses.
- Do not access the database directly from a handler.
- Keep the dependency direction one-way: `cmd` → `internal/handler` → `internal/service` → `internal/repository`.

## Project Structure

```
cmd/
    <app>/
        main.go              # wiring only — no business logic
internal/
    handler/                 # HTTP handlers — decode/encode only
        <feature>/
    service/                 # business logic
        <feature>/
    repository/               # data access (DB queries)
        <feature>/
    model/                    # domain structs, DTOs
    middleware/
pkg/                          # code safe for external import (rare — prefer internal/)
go.mod
go.sum
.env.example                  # environment template only — use fake credentials
.editorconfig
```

### Rules

- New feature code goes under the matching `<feature>/` folder in `handler/`, `service/`,
  and `repository/` — do not scatter feature code across unrelated packages.
- Package names are short, lowercase, no underscores (`payment`, not `payment_service`).
- One exported type/concept per file where practical; file name matches its primary type.

## Coding Convention

### Naming

| Pattern            | Use for                                              |
| ------------------ | ------------------------------------------------------ |
| `PascalCase`        | Exported identifiers (types, funcs, consts)              |
| `camelCase`         | Unexported identifiers, local variables                   |
| `snake_case`        | DB columns, JSON tags for API responses (map to FE/DB)      |
| `UPPER_SNAKE_CASE`  | Environment variable names only                             |

Acronyms stay fully capitalized in both cases — `UserID`/`userID`, `HTTPClient`, not
`UserId`/`HttpClient`.

### Coding Rules

- Always check and handle `error` — never discard with `_` unless justified by a comment
- Wrap errors with context: `fmt.Errorf("doing X: %w", err)` — never lose the original error
- Do not `panic` in normal request-handling flow; reserve `panic` for unrecoverable startup failures
- Keep functions focused and small — extract when a function does more than one thing
- Avoid duplicated logic; extract a helper only when reuse or clarity improves
- Prefer explicit context propagation (`context.Context` as first param) for anything doing I/O
- No package-level mutable state unless justified (prefer dependency injection)
- Accept interfaces, return concrete structs — keeps callers testable without over-abstracting the implementation
- Code must be `gofmt`/`goimports` clean — enforced by `golangci-lint run`, not manual review

### API Rules

- Keep API response format consistent with existing endpoints
- DO NOT change route paths, request, or response shapes unless required
- Return meaningful error messages without leaking internal details (never send a raw `err.Error()` to the client on a 5xx)

### Database Rules

- DO NOT modify the schema or migrations unless explicitly requested
- Always pass `context.Context` through to query calls — respect caller cancellation/timeouts
- Use parameterized queries — never string-concatenate SQL
- Wrap multi-statement writes in a transaction
- Close rows/statements (`defer rows.Close()`) — never leak a `*sql.Rows`

### Editor Config

<!-- resolve: _shared/editor-config.md (Plain + Go) -->

### Formatting Display

<!-- resolve: _shared/formatting-display.md (Plain + Go) -->

### Comment Code

<!-- resolve: _shared/comment-code.md (Plain + Go) -->

### Before Creating New Code

<!-- resolve: _shared/before-creating-new-code.md (Plain, {{ARTIFACTS}}="handler, service, repository method, or model") -->

### Commands

```bash
go build ./...
go test ./...
go vet ./...
gofmt -l .                 # lists misformatted files; empty output = pass, must pass in CI too
golangci-lint run
go run ./cmd/<app>
```

## Testing & Quality

Before marking task complete:

1. Run `go build ./...` — fix all compile errors
2. Run `go vet ./...` and `golangci-lint run` — fix all issues
3. Run `go test ./...` — fix all failing tests

### Test Runner

- Standard `testing` package; use `testify` (`assert`/`require`) for readable assertions
- Table-driven tests are the default shape for anything with more than one input case
- Tests are co-located with the code under test (`foo.go` + `foo_test.go`)

### Unit Test Rules

Unit test required for:

- Business logic and calculations
- Validation logic
- Formatting utilities

Do not write unit tests for:

- Thin wiring code (`main.go`)
- Third-party library behavior

### Rules

<!-- resolve: _shared/testing-no-edit-rule.md (Plain) -->

## Security Rules

<!-- resolve: _shared/security-rules.md (Plain) -->

## Definition of Done

<!-- resolve: _shared/definition-of-done.md (Plain) -->
