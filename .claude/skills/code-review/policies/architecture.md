# Architecture and data integrity

Architecture findings must cite a rule that **exists in this repository** — an
`AGENTS.md`/`CLAUDE.md`/`ARCHITECTURE.md` statement, an architecture test, a lint
rule, or a consistent, demonstrable pattern in the surrounding code. Never assert a
layering rule the repo does not hold; "most projects do X" is not a finding.

Severity: violating a rule the repo marks mandatory → `blocking`. Breaking a strong
but undocumented convention → `warning`. A structural improvement with no rule
behind it → `suggestion`.

## Layering and dependency direction

- Code placed in the wrong layer: business logic in a controller, HTTP concerns in a
  domain service, persistence access from a presentation layer.
- Dependencies pointing the wrong way: domain depending on infrastructure, a shared
  library importing an application module, inner layer referencing an outer one.
- A module reaching into another module's internals instead of its public entry point.
- New circular dependency between modules, projects, or packages.
- Concrete infrastructure type injected where the repo consistently injects an
  abstraction — cite the existing abstraction by name.

## Module boundaries

- New file placed outside the structure its siblings follow (feature folders,
  vertical slices, `Domain`/`Application`/`Infrastructure`, `core`/`shared`/`features`).
- Cross-feature imports where the repo keeps features independent.
- Logic duplicated into a new module when an existing shared component already does
  it — name the existing one.
- A cross-cutting concern (auth, logging, caching, validation, error mapping)
  implemented ad hoc when the repo has a pipeline/middleware/interceptor for it.

## Data integrity

Rank these near correctness — corrupted data outlives a bad deploy.

- Missing constraint where the domain requires one: uniqueness, foreign key,
  `NOT NULL`, check constraint.
- Migration that is not backward-compatible with the currently deployed code during
  rollout (drop or rename shipped in the same step as the code change).
- Destructive migration with no backfill, no rollback path, or irreversible data loss.
- Writes that should be atomic performed outside a single transaction.
- Money or quantities stored as float; precision or scale reduced on an existing column.
- Soft-delete convention bypassed by a new query or hard delete.
- Cascade delete added without confirming the blast radius.
- Optimistic concurrency (row version / `ETag`) dropped on an update path that has it
  elsewhere.
- Timestamps stored without time zone where the repo stores UTC.
- Index missing on a new foreign key or a new high-selectivity query predicate that
  will run on a large table.

## API and contract shape

- New endpoint diverging from the repo's route, verb, status-code, pagination, or
  error-envelope conventions.
- Entity or ORM model returned directly where the repo uses DTOs, leaking internal
  fields.
- Naming/casing inconsistent with existing serialized contracts.
- Event or message schema changed in a way existing consumers cannot read.

## Configuration and deployment

- New setting hardcoded instead of read from the repo's configuration mechanism.
- Environment-specific value committed into a shared config file.
- New required config with no default and no documentation — deploy will break.
- Feature added with no flag where the repo gates risky changes behind flags.
