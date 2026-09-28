# Accessibility Preference (UserPreference)

Status: ready-for-agent

Source: [Wayfinder Phase 2 map](../../.wayfinder/map-phase2.md), resolved in
[P03](../../.wayfinder/tickets/P03-accessibility-preference.md). This spec turns that
resolved design into an implementation-ready plan against the actual codebase.

## Problem Statement

Riders have different situational needs when getting from a boarding stop to a
destination — some care most about minimizing how far they walk, some want the fewest
bus changes, some want to avoid crossing a street at street level wherever possible.
Today, BusNavigateApp shows `TravelOption` and `RecoveryOption` lists in whatever order
the backend happens to compute them, with no way for a rider to say which of these
matters most to them. A rider with a strong walking preference has to manually scan
every option, every single time, to find the one that suits them — the system has no
memory of what they care about.

## Solution

Add a `UserPreference` the rider sets once, tied to their existing anonymous
device-scoped identity (no login/signup) — three independent toggles: minimize
walking, minimize transfers, avoid street crossing. Whenever the backend already
produces a `TravelOption` or `RecoveryOption` list (trip-planning search results, and
wrong-bus recovery's tiered lists), it re-ranks that list according to whichever
toggles are on — it never removes an option the rider could otherwise see. When a
preference changes an option's position, the option's existing `Reason` gains a new,
visible factor code naming which preference it matched, so the reordering is always
explainable, never a silent shuffle.

## User Stories

1. As a rider, I want to turn on "minimize walking," so that options requiring less
   total walking distance are shown higher in my trip-planning results.
2. As a rider, I want to turn on "minimize transfers," so that options with fewer bus
   changes are shown higher in my trip-planning results.
3. As a rider, I want to turn on "avoid street crossing," so that options whose
   boarding/alighting stops have pedestrian-bridge access are favored over ones that
   only have an at-grade crossing nearby.
4. As a rider, I want to enable more than one preference at once, so that my results
   reflect all the things I care about together, not just one.
5. As a rider who hasn't set any preference, I want to see the exact same option
   ordering the app would otherwise produce, so that this feature never surprises
   someone who never opted in.
6. As a rider, I want every option that was valid before I set a preference to still
   be shown after I set it, so that a preference never hides a route that's actually
   usable — only its position in the list changes.
7. As a rider, I want to see why an option moved up (e.g. a visible "matches: avoid
   street crossing" tag), so that the reordering doesn't feel arbitrary.
8. As a rider, I want my preference to persist across app sessions on the same device,
   so that I don't have to re-enter it every time I open the app.
9. As a rider using a different device, I want a fresh, unset preference (none carried
   over), so that I understand preferences are per-device like the rest of my
   anonymous identity, not a login-linked account setting.
10. As a rider, I want to change my preference at any time and see it apply to the very
    next search or recovery I run, so that adjusting my mind doesn't require
    restarting the app.
11. As a rider, I want to turn a preference back off, so that I can return to the
    default ordering without losing my other settings.
12. As a rider recovering from a wrong bus, I want my "minimize walking" preference to
    help order the `RecommendedOptions` I'm shown, so that the least-effort recovery
    path is easier to spot in an already-stressful moment.
13. As a rider recovering from a wrong bus, I want my preference to never promote a
    `LastResortOptions` candidate above a `RecommendedOptions` one, so that urgency
    always outranks my personal convenience preference when something's gone wrong.
14. As a rider recovering from a wrong bus, I want my preference to also apply within
    `LastResortOptions` and within `UnconfirmedRailPointers` independently, so that even
    the less-ideal tiers are ordered sensibly for me.
15. As a rider whose nearby stops have no recorded crossing/skywalk information, I want
    "avoid street crossing" to treat those options neutrally (neither favored nor
    penalized), so that missing data never silently disadvantages an otherwise-good
    option.
16. As a developer, I want the preference-reranking logic implemented once and reused
    everywhere a list of `TravelOption`/`RecoveryOption` is produced, so that the three
    preferences behave identically in trip-planning and in recovery rather than drifting
    apart over time.
17. As a rider, I want to be able to view my current preference settings, so that I can
    check what's currently active before deciding whether to change it.
18. As a rider, I want setting my preferences to feel like a simple settings screen (not
    a multi-step flow), so that turning a toggle on/off is quick.
19. As a developer, I want the "avoid street crossing" signal derived from data the
    system already collects (`StopLandmark` types near a stop), so that this feature
    doesn't require a new external data source or a new sync job.
20. As a product owner, I want this feature scoped strictly to reordering existing
    results, so that it can't be mistaken for a promise of turn-by-turn crossing
    guidance or accessibility routing more broadly (that's explicitly out of scope).

## Implementation Decisions

- **New backend entity `UserPreference`**: one row per `User`, following the existing
  anonymous/device-scoped identity pattern (`X-Device-Id` → `User` lookup already used
  by the rest of the API). Fields: three independent boolean toggles — minimize
  walking, minimize transfers, avoid street crossing — plus an updated-at timestamp.
  No separate creation flow: absence of a row means all three toggles are off
  (graceful default), matching how the rest of the domain already treats "no record"
  as a safe default rather than an error.

- **New API surface**: a `GET` to read the current rider's preference (defaulting to
  all-off when no row exists) and a `PUT` to fully replace it (single upsert, no
  partial-patch semantics), under the existing `/api/v1/` REST convention and the
  existing device-identity resolution middleware — no new identity mechanism.

- **New shared ranking component**, not duplicated per call site: takes a list of
  already-generated `TravelOption`s or `RecoveryOption`s plus the rider's
  `UserPreference`, and returns the same list reordered. It is the single place all
  preference logic lives — every caller that produces one of these lists calls into it
  rather than re-implementing scoring. Internally it derives, per candidate: existing
  walking-distance and transfer-count figures (already computed by the existing
  comparison/evaluation logic — no new distance calculation), and an "avoid crossing"
  score derived by looking up `StopLandmark` records near the candidate's
  boarding/alighting stop (a pedestrian-bridge-type landmark scores better than an
  at-grade-crossing-type one; no nearby landmark of either type scores neutral, never
  penalized). When more than one toggle is on, their effects combine as an unweighted
  combined rank — no per-preference importance weighting in this spec.

- **Two call sites, one component**: the initial trip-planning search result list gets
  reordered as a whole before being returned. The wrong-bus recovery flow's tiered
  result (recommended / last-resort / unconfirmed-rail, per the existing tiered-urgency
  design) gets the same reordering applied independently *within* each tier — the
  ranking component never moves a candidate across tiers; tier boundaries are decided
  before ranking runs, not by it.

- **`Reason` extension**: the existing structured, extendable factor-code system gains
  one new parameterized code identifying which preference a candidate matched, added
  by the ranking component when it moves something up for that reason — never added
  silently, and never replacing the option's existing reasons, only appended.

- **Frontend**: a new preferences area, following the same module shape already used
  by the app's other feature areas (a routed module, a service that calls the new
  `GET`/`PUT` endpoints, a model matching the three toggles, and a simple settings
  page). This is genuinely new — no existing preferences/settings module exists today.

## Testing Decisions

- Good tests here assert **observable ordering and reason codes**, not the internal
  scoring formula — e.g. "given these three candidates with these walking distances and
  this preference, the result comes back in this order, and the moved candidate carries
  the new preference-match reason" rather than asserting on an internal numeric score.
- **Backend**: same pattern already established for the existing comparison/recovery
  logic — seed real entities into an in-memory database rather than mocking the data
  layer, then assert on the returned list's order and reason codes. The new ranking
  component gets its own dedicated test file covering: no-preference passthrough
  (order unchanged), each of the three toggles individually, multiple toggles combined,
  the neutral-when-no-landmark-data case, and — specifically for recovery — that a
  last-resort candidate never outranks a recommended one regardless of preference.
- **Frontend**: a service spec for the new preferences service (mirrors the existing
  per-module service spec pattern already used elsewhere in the app) and a component
  spec for the settings page's toggle behavior, using the project's existing Angular
  test setup.
- Prior art: the existing test suite already covers the single-candidate comparison
  algorithm and the recovery tier-building logic with the in-memory-database,
  real-entity-seeding pattern this feature's tests should follow.

## Out of Scope

- The other seven Phase 2 items considered and ruled out during Wayfinder charting
  (Real-time Vehicle, Dynamic Route Change, Proactive Notification, Bus Stop Photos,
  OCR Bus Stop Sign, Landmark Recognition, Crowdsourced Reports) — see
  [map-phase2.md](../../.wayfinder/map-phase2.md)'s Out of scope section for why each.
- "No stairs" / "need ramp" and "prefer simpler routes" preferences from the original
  proposal — dropped during design resolution, not deferred; no accessibility-relevant
  data model exists to support them and none is being added here.
- Any per-preference importance weighting when multiple toggles are on (e.g. letting a
  rider say "walking matters more than transfers to me") — all enabled preferences
  combine equally.
- Any change to how `TravelOption`/`RecoveryOption` candidates are generated or
  validated in the first place (walk-budget rule, transfer-count rule, destination
  reachability, etc.) — this feature only reorders an already-valid list, it never
  changes what counts as valid.
- Real turn-by-turn crossing detection or routing — "avoid street crossing" stays a
  best-effort proxy based on existing landmark data near a stop, not a geometric
  answer about any specific walking path.
- A hard-exclusion mode for any preference (e.g. filtering out options that require a
  street crossing entirely) — every preference in this spec is re-ranking only.

## Further Notes

- The three-preference set, the reasoning for dropping the other three from the
  original proposal list, and the reasoning for the reordering-only (never
  hard-filtering) principle were settled during Wayfinder charting/resolution — see
  [P03](../../.wayfinder/tickets/P03-accessibility-preference.md) for the full
  discussion if a design question resurfaces during implementation.
- `CONTEXT.md` already documents `UserPreference` in the project's domain glossary;
  keep that definition in sync if implementation surfaces a refinement.
