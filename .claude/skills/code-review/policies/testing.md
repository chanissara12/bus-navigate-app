# Testing

Demand tests only when repository policy or genuine risk justifies it. A missing-test
finding must name the specific behavior that is untested and why it matters — not
"add tests".

## When tests are required

Require tests (usually `blocking` if the repo mandates them, otherwise `warning`) for:

- business calculations — pricing, tax, discounts, interest, proration
- validation rules and their rejection paths
- authorization and access-control decisions
- financial or accounting logic
- state transitions and workflow rules
- data transformations, mappers, parsers, serializers
- bug fixes — a regression test pinning the reported behavior
- complex branching, non-obvious algorithms
- public API behavior and contracts
- concurrency, retry, and idempotency logic

## When tests are not required

Do not ask for tests for:

- formatting, renames, comments, whitespace
- static markup or styling with no logic
- pure configuration changes
- trivial passthrough wiring already covered by the type system
- generated code

…unless a repository rule explicitly requires coverage for them. If the repo states a
coverage threshold or a "tests required for all changes" rule, follow it and cite it.

## Reviewing the tests that are present

New or modified tests are code — review them too.

- **Does the test actually fail without the change?** Assertions that pass
  regardless (asserting a mock was called, asserting on the value just constructed,
  no assertion at all) are worse than no test — they create false confidence.
- Only the happy path covered when the change's risk lives in error and edge paths.
- Over-mocking: every collaborator stubbed so the test verifies wiring rather than
  behavior. Compare against how the repo's existing tests are written.
- Assertions too loose (`NotNull` on a value whose exact shape matters) or too tight
  (asserting an entire serialized blob when one field is the point).
- Shared mutable fixtures or ordering dependence between tests.
- Non-determinism: real clock, real network, real filesystem, random data, `sleep`
  as synchronization.
- Tests disabled, skipped, or deleted as part of the change — always a finding;
  ask why, and whether the covered behavior still exists.
- Snapshot updated wholesale without evidence the new snapshot is correct.
- Test naming and structure inconsistent with the repo's convention.

## Framework and placement

Use the repo's existing framework, helpers, builders, and fixtures — xUnit/NUnit/
MSTest, Jest/Vitest/Jasmine+Karma, Go's `testing`, whatever is present. Never
recommend a framework the repo does not use. Place new tests where sibling tests
live and follow their naming pattern.

## Test-level judgment

Ask for the cheapest test that would have caught the defect. Prefer a unit test on
the logic; escalate to integration only when the risk is in the seam (SQL, mapping,
middleware, transaction boundary). Do not ask for an end-to-end test where a unit
test suffices.
