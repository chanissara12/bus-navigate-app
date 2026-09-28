# [wayfinder:grilling] Accessibility Preference (UserPreference) design

**Parent map:** [Phase 2 Spec — Public Transit Decision & Recovery Assistant](../map-phase2.md)

**Status:** closed
**Blocked by:** none
**Blocks:** none

## Question

Per [CONTEXT.md](../../CONTEXT.md), `UserPreference` is a standing set of routing
constraints for a User that **re-ranks** `TravelOption`/`RecoveryOption` ordering —
never a hard filter (that principle was settled during charting; see
[map-phase2.md](../map-phase2.md) Notes). Design it concretely:

- What's the concrete set of Phase 2 preferences (PROPOSAL.md section 16 lists: minimize
  walking, minimize transfers, no stairs, need ramp, avoid crossing streets, prefer
  simpler routes) — which of these are booleans, which are weighted/ordinal, and which
  (if any) turn out to need a hard constraint after all despite the soft-weight default
  (e.g. is "no stairs" really just a ranking nudge, or does a rider who can't use stairs
  actually need those options excluded)? If any preference genuinely needs a hard
  exclusion, that's a deliberate, named exception to the soft-weight default — call it
  out explicitely, don't let it slip in silently.
- `UserPreference` storage: one record per anonymous/device-scoped `User` (per T09's
  `X-Device-Id` identity) — schema and how it's set/updated (new endpoint? part of
  device registration?).
- How preference re-ranking composes with the existing `Reason` factor-code system from
  [T05](T05-can-i-take-this-bus.md)/[T06](T06-wrong-bus-recovery.md): does a
  preference add its own factor codes to `Reason`, or does it operate purely as a
  post-hoc sort over options whose `Reason` is unaffected by preference?
- Whether preference affects `RecoveryOption` generation the same way as `TravelOption`,
  or only the latter (recovery is urgency-driven per
  [T15](T15-recovery-ui-layout.md)'s tiered-urgency design — a "minimize walking"
  preference might matter less when the user just needs *a* way back on track).

## Resolution

**Preference set (revised down from PROPOSAL.md section 16's full list, during
resolution):** only three preferences, all **weighted/ordinal** — none are a hard
exclusion, none removes an option from the list (per the charting-time standing
decision). "No stairs," "need ramp," and "prefer simpler routes" were dropped from
Phase 2 scope entirely, not deferred — they don't appear in the data model or in any
fog entry going forward.

1. `MINIMIZE_WALKING` — weight toward lower total walking distance (already computed
   per [T05](T05-can-i-take-this-bus.md)'s haversine × 1.3 estimate).
2. `MINIMIZE_TRANSFERS` — weight toward lower `TransferCount`.
3. `AVOID_STREET_CROSSING` — weight toward options whose boarding/alighting `BusStop`s
   have a nearby `Skywalk`-type `StopLandmark` over a `Crossing`-type one (see below).

**`AVOID_STREET_CROSSING` is a best-effort heuristic, not a routing answer.** Phase 1
has no turn-by-turn `WalkingRoute` (per [T05](T05-can-i-take-this-bus.md)/CONTEXT.md),
so the system cannot know whether a specific walk leg actually crosses a street. It
reuses [T08](T08-bus-stop-context.md)'s existing `StopLandmark.LandmarkType` data
(`Crossing`, `Skywalk`) near the relevant `BusStop`(s) as a proxy signal: a nearby
`Skywalk` landmark scores better than a nearby `Crossing` landmark; a `BusStop` with
neither nearby `StopLandmark` type scores **neutral** (never penalized for missing
data) — same "approximate, don't block on precision" spirit as T05's own walking-
distance estimate. No new data-model ticket needed; this consumes T08's schema as-is.

**Storage:** one `UserPreference` record per `User` (1:1, `X-Device-Id`-scoped per
[T09](T09-api-contracts.md)). Set/updated via `PUT /users/me/preferences` — a full
upsert of the preference set, no separate create step, matching T09's lazy-upsert
identity pattern. No preference record means all three weights default to off/neutral
(graceful degradation, same principle as T08's zero-`StopLandmark` case).

**Composes with `Reason`:** preference-driven reordering **adds** a factor code to
`Reason`, it doesn't silently re-sort behind the scenes — matches PROPOSAL.md section
19's explainability requirement. New parameterized factor code:
`PREFERENCE_MATCH` (+ which of the three preference codes above it matched),
extendable the same way T05's `Reason` codes already are.

**`RecoveryOption`:** preference reordering applies **only within a single
[T15](T15-recovery-ui-layout.md) urgency tier** (`RecommendedOptions` /
`LastResortOptions` / `UnconfirmedRailPointers`) — it never moves an option across
tiers. Urgency always outranks preference in a recovery situation.
