# [wayfinder:prototype] Loading & error UI patterns

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** open
**Blocked by:** none
**Blocks:** [Fold trip-planning](F05-fold-trip-planning.md),
[Fold bus-stop](F06-fold-bus-stop.md), [Fold travel-session](F07-fold-travel-session.md),
[Fold recovery](F08-fold-recovery.md)

## Question

The one remaining "what should it look like" question from charting — everything else
was settled structurally, not visually. Needs an actual `/prototype` pass (per the
map's Notes), not just conversation:

- Skeleton-loading treatment for each of the 4 pages' fetched-data views (list results,
  stop detail, session card, recovery options) — per `frontend/CLAUDE.md`'s
  loading-indicator rules, fetched data gets a skeleton, not a spinner.
- Error-banner UI subscribing to `ErrorNotificationService`
  ([F02](F02-shared-frontend-infrastructure.md)) — where it renders (global banner in
  the app shell vs. page-local), how it dismisses, how multiple errors queue/stack.

Prototype 2-3 variants on a couple of the real pages (reuse the existing `?variant=`
pattern), pick one, record the resolution here — same process T12-T15 used.

## Resolution

_(not yet resolved)_
