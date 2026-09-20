# Correctness

Highest-priority concern. A correctness defect is `blocking` when the code will
misbehave for a realistic input or state, not merely when it is theoretically fragile.

## Logic and control flow

- Does the code do what its name, signature, docs, and the PR description claim?
  Divergence between stated intent and behavior is a finding.
- Off-by-one errors, inverted conditions, wrong comparison operators, `&&`/`||` mixups.
- Branches that silently fall through, unreachable code, `switch` missing a case
  that the domain allows.
- Early returns that skip required cleanup, logging, or state updates.
- Loops whose termination depends on a value mutated inside the body.

## Null, empty, and boundary handling

- A value that can be `null`/`undefined`/`None` dereferenced without a check —
  verify by reading the producer, not by guessing from the type name.
- Empty collections treated as guaranteed non-empty (`First()`, `[0]`, `.max()`).
- Numeric boundaries: division by zero, overflow, precision loss when money or
  quantities move through floating point (money should use decimal types).
- String parsing that assumes a format without validating it.
- Date/time handling: missing time zone, DST assumptions, local-vs-UTC mixing.

## Contracts and call sites

- Changing a method signature, return type, nullability, or thrown exceptions
  without updating every call site. Search for callers before concluding it is safe.
- Changing the *meaning* of a value while keeping the type (units, sign convention,
  inclusive/exclusive bounds, sort order) — the compiler will not catch this.
- Interface implementations that violate the interface's documented contract.
- Overrides that break the base class's expectations (Liskov violations).

## Breaking changes

Treat as `blocking` unless handled explicitly:

- Removed or renamed public API, route, event name, queue name, or config key.
- Changed request/response shape or serialized contract without versioning.
- Changed default value that alters behavior for existing callers.
- Database migration that drops or narrows a column, or adds a `NOT NULL` column
  without a default or backfill.
- Removed feature flag whose off-path is still in use.

"Handled" means: versioned, deprecated with a migration path, backfilled, or
coordinated in the same change. Say which is missing.

## Error handling

- Exceptions swallowed with an empty catch, or caught so broadly that real failures
  are hidden.
- Errors logged and then execution continues as if nothing happened.
- Failure paths that leave partial state written.
- Error types or HTTP status codes inconsistent with the repository's convention —
  cite the convention.
- Resource leaks: connections, file handles, streams, or subscriptions not disposed
  on the failure path.

## Concurrency and transactions

- Shared mutable state accessed without synchronization.
- Check-then-act races (`if (!exists) create`) without a uniqueness constraint or lock.
- `async` calls not awaited; fire-and-forget that drops exceptions.
- Blocking on async code (`.Result`, `.Wait()`) where deadlock is possible.
- Work that must be atomic split across multiple transactions or commits.
- A transaction spanning an external HTTP call, or held open across slow work.
- Missing idempotency on a retryable operation (webhooks, queue consumers, payments).

## Verification standard

Before filing a correctness finding, read enough code to state the failing scenario
concretely: which input or state, which line, what goes wrong. If you cannot, it is
at most a `warning` and must say what remains unverified.
