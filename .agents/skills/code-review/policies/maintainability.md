# Maintainability, performance, and style

Lowest priority band. Almost never `blocking` — the exception is a mandatory
repository rule. Most items here are `suggestion`; raise to `warning` only when the
issue will realistically cause a defect, materially slow the system, or leave the
next reader unable to work out the intent.

**Restraint rule:** do not file subjective preferences. If the code is consistent with
its neighbors and a competent reader can follow it, say nothing. A review full of
style nits buries the findings that matter.

## Performance regressions

Report when the change makes something measurably worse, not when a micro-optimization
is theoretically available.

- N+1 queries: a database or HTTP call inside a loop over a result set.
- Loading a whole table or collection into memory to filter, count, or take one item —
  the filter belongs in the query.
- Missing pagination on an endpoint that returns a growing collection.
- Query on a large table with no supporting index for its new predicate.
- Repeated expensive work inside a loop that could be hoisted.
- Accidental quadratic behavior (nested scan over the same collection).
- Blocking I/O on a request or UI thread; synchronous call in an async pipeline.
- Frontend: work in a render path or change-detection cycle, unbounded lists without
  virtualization, subscriptions never unsubscribed (a leak, and usually a `warning`).
- Caching added with no invalidation story, or removed where it was load-bearing.

## Clarity

- Code whose behavior a reader cannot determine without running it — deeply nested
  conditionals, long boolean expressions, clever one-liners.
- A method doing several unrelated things, where the seams are obvious and splitting
  is low-risk.
- Magic numbers or literal strings with domain meaning and no named constant.
- Dead code, commented-out blocks, unreachable branches, unused parameters or imports
  introduced by this change.
- `TODO`/`FIXME` added with no ticket or owner.
- Comments explaining *what* the code does rather than *why*; comments that contradict
  the code (always report — one of them is wrong).
- Debug leftovers: `console.log`, `Console.WriteLine`, `printf`, commented-out asserts.

## Duplication and reuse

- Logic copy-pasted from elsewhere in the repo instead of reused — cite the existing
  implementation by path. Two copies that must change together is the real risk;
  say that.
- A new helper duplicating an existing utility, extension method, or shared component.
- Copy-paste with one branch not updated (a genuine bug — file it under correctness).

Do not push extraction for its own sake. Two similar-looking blocks that answer to
different reasons for change should stay separate.

## Naming and style

- Names that mislead: `GetUser` that also mutates, `isValid` that returns a count,
  `temp`/`data`/`result` where a domain term exists.
- Naming inconsistent with the repo's convention for that kind of thing — cite the
  pattern.
- Formatting deviations that a configured formatter would fix: do not file these
  individually; note once that `dotnet format` / Prettier / `gofmt` was not run.

## Observability

- New failure path with no logging where sibling code logs.
- Log level misuse: expected conditions logged as errors, real failures as info.
- Log message with no correlating identifier, so it cannot be traced in production.
- Sensitive values in logs — that is a security finding, not a style one.
