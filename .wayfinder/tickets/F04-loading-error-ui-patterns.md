# [wayfinder:prototype] Loading & error UI patterns

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** closed
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

Four variants prototyped on the live `/trip-planning` and `/travel-session/:id`
routes (`?loadingVariant=A|B|C|D`, separate param from each page's own layout
`?variant=` so the two prototypes don't collide):

- **A — Minimal inline:** plain gray-bar skeletons; single-message page-local banner,
  manual dismiss.
- **B — Shimmer cards + top banner stack:** skeleton shapes matched the real card's
  dimensions (circle badge + lines); banner fixed to the very top of the viewport,
  stacked, auto-dismissed after 4s.
- **C — Generic blocks + bottom-right toasts:** plain rounded-rect skeletons; banner as
  a bottom-right floating toast queue, auto-dismissed after 4s.
- **D — Shimmer cards + contextual banner:** same skeleton as B; banner appears
  full-width right where the triggering action happened (not pinned to a screen edge),
  single message (replaces the previous one), manual dismiss only, with a brief
  slide-down entrance.

**Skeleton — Variant B's style wins:** shapes matched to the real card (circle badge +
line widths) read better than generic bars/blocks once judged against real card
density, per the prototype process's own preference for judging shapes against real
data.

**Error banner — Variant D wins**, after B and C were both tried and rejected as easy
to miss: B's top-of-viewport placement and C's bottom-right corner toast both sit
outside where a user's attention naturally is on this app (density is mobile-first,
attention sits low near the bottom nav / the control just interacted with). A hybrid
of B's placement + A's single-message-manual-dismiss behavior was considered and also
rejected for the same visibility reason. Landing on D: the banner appears full-width
right below/near whatever action just triggered it, not anchored to a screen edge —
the user's eyes are already there. Adding a second, always-on top banner (B) as a
backup for actions with no clear anchor point was considered and rejected: it would
duplicate the same message in two places at once, which reads as cluttered/confusing
rather than safer. Where no specific action can be anchored to (a background/passive
fetch), the banner instead defaults to the top of the page's main content block — one
banner mechanism with a context-dependent anchor point, not two parallel ones.

Final decision: **skeleton shape from Variant B + error banner behavior/placement from
Variant D**, for all four pages' fetched-data views (list results, stop detail,
session card, recovery options) and their error handling.

Prototype code (all 4 loading-error variants, plus the T12/T14 layout-variant
switchers they sit alongside) stays in place for now, per this map's established
prototype convention (see T12's resolution) — F05/F06/F07/F08 fold the winning
combination into each real page and drop the losing variants and both switchers from
main at that point, not before.
