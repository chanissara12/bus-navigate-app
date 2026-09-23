# [wayfinder:grilling] Initial trip planning search (TravelOption generation) & destination/stop search

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none (~~[Core Phase 1 data model schema](T03-core-data-model.md)~~,
~~["Can I take this bus?" comparison algorithm](T05-can-i-take-this-bus.md)~~ both
closed)
**Blocks:** [Full Phase 1 API contract](T09-api-contracts.md)

## Question

[Full Phase 1 API contract](T09-api-contracts.md) specifies two endpoints —
`GET /places/search?q={text}` and `POST /travel-options` (full search, not the T05
1-to-1 comparison) — that no prior ticket actually designed. T05's own resolution
assumes this algorithm is "already covered by initial TravelOption generation," but no
ticket by that name exists; T09 assembled the endpoint list straight from
PROPOSAL.md/CONTEXT.md without verifying the dependency was ever charted. This ticket
retroactively closes that gap.

Define:

- How destination/stop search actually matches text against the transit dataset (exact
  match, prefix, substring, on which name fields), given the map Notes' standing
  decision that this is restricted to transit-dataset names with no external
  geocoding.
- How `POST /travel-options` actually finds candidate routes from an arbitrary
  `currentLocation` to an arbitrary destination — given TravelSession and
  TravelOptionEvaluation (T04/T05) have no multi-leg/transfer modeling, does this
  search cover transfers, or is it explicitly direct-connections-only for Phase 1?
- Whether this reuses T05's `ITravelOptionEvaluationService`, or needs its own
  reachability check, given `EvaluateAsync` is signature-bound to an existing
  `TravelSession` (which doesn't exist yet at search time — the user hasn't confirmed
  a plan).

## Resolution

**Destination/stop search:** case-insensitive substring match against `BusStop.NameTh`,
`BusStop.NameEn`, `BusStop.StopCode`, and `Place.Name` (rail stations) — no fuzzy
matching, no ranking beyond "starts-with beats contains" (starts-with matches sorted
first). Results from both tables are merged into one list, capped at 20 total (map
Notes' existing decision), each result tagged with its source kind
(`BusStop` or `Place`) and id so the caller can round-trip it as `destinationPlaceId` +
`destinationType` into `POST /travel-options`. No external geocoding, per the map's
already-locked decision — a query that matches nothing returns an empty list, not an
error.

**`POST /travel-options` — direct-connections only, transfers explicitly deferred:**
Phase 1's `TravelSession`/`TravelOptionEvaluation` have no multi-leg modeling (see T04's
`ALIGHTED`->`COMPLETED` comment and T05's transfer-count-fixed-at-0 comment) — building
a multi-transfer graph search now would be new architecture with no consumer yet
(`TravelSession` couldn't represent the resulting itinerary). Scope is therefore:

1. Find every `Direction` with a `RouteStop` within the 800m walk budget
   (`TravelOptionEvaluationConstants.WalkBudgetMeters`, reused as-is — same constant
   T05/T06 already share) of `currentLocation` — this is the boarding-candidate set.
2. For each such `Direction`, find the nearest `RouteStop` to the destination that is
   also within the walk budget.
3. **Order check (new — not needed by T05/T06, which only ever check a single
   direction against a fixed origin/destination pair already known to be
   directionally consistent):** the candidate alighting `RouteStop.SequenceNumber`
   must be greater than the boarding `RouteStop.SequenceNumber` within that Direction.
   A Direction serving both points but in the wrong order (destination comes before
   the boarding point along that Direction) is not a valid option — reject it rather
   than silently suggesting a rider board a bus going the wrong way.
4. Each Direction passing both checks becomes one `TravelOption`: `Route`, `Direction`,
   boarding/alighting `RouteStop`, `TransferStops: []` (always empty — no transfers),
   `TransferCount: 0`, `WalkingDistance` (sum of both walk legs, each × the 1.3 detour
   factor), `DataConfidence: Scheduled`, `ServiceStatus` (call
   `IServiceStatusService.GetStatusAsync` for the candidate Direction so a
   `Cancelled`/`NotOperatingToday` route can still surface but visibly flagged, per
   T07's "never silently drop, disclose instead" principle), and `Reason` (a
   `ReachesDestination` + `WithinWalkBudget` pair, matching T05's `EvaluationReason`
   shape for UI consistency).
5. `EstimatedDuration` and `WaitingTime` are **not computed in this initial version** —
   both need "which specific Trip is arriving next," i.e. matching against the current
   wall-clock time and today's active `ServiceCalendar`, which is a materially separate
   feature (live schedule lookup) from "which Directions connect these two points."
   Deferred for the same reason T05 deferred `FASTER_BY`/`SLOWER_BY` — flagged, not
   silently guessed.
6. No ranking/scoring beyond the accept gate — every passing Direction is returned,
   left to the frontend to lay out side by side (matches the map's standing "never
   collapse to one answer" decision, same as T05).

**Shared reachability logic — extract, don't duplicate:** T05's
`TravelOptionEvaluationService.EvaluateAsync` is signature-bound to an existing
`TravelSessionId` (it reads the session's own `AlightingStop` as the destination), so
this ticket's search — which runs *before* any `TravelSession` exists — cannot call it
directly. The "nearest `RouteStop` to a point within the walk budget, using the 1.3
detour factor" check must be extracted out of `TravelOptionEvaluationService` into a
small shared helper (e.g. a method the trip-planning search and
`TravelOptionEvaluationService` both call) rather than reimplementing the same
haversine-plus-budget logic a third time (it already exists once in
`TravelOptionEvaluationService` and, in a related but not identical form, in
`RecoveryService`'s bounding-box stop search). This is an implementation-time
refactor, not a new decision — no behavior change to T05/T06's existing accept/reject
rules.

**Endpoint/DTO shapes** (feeds [T09](T09-api-contracts.md) directly, no changes to
T09's already-locked shapes):
- `GET /places/search?q={text}` → `PlaceSearchResult[]` — `{ id, type: "BusStop" |
  "Place", nameTh, nameEn, latitude, longitude }`.
- `POST /travel-options` — body `{ currentLatitude, currentLongitude,
  destinationPlaceId, destinationType: "BusStop" | "Place" }` → `TravelOption[]` per
  the shape above.

## Not yet specified

- Multi-transfer search (2+ legs) — deliberately out of scope here, same as the map's
  own "route-map visualization" and "full BTS/MRT routing" fog items: would require
  `TravelSession`/`TravelOptionEvaluation` to model transfers first, which is a bigger
  change than this ticket's job of closing T09's endpoint gap.
- Ranking/sorting `TravelOption[]` by anything beyond pass/fail (once
  `EstimatedDuration` exists, "soonest arrival" sorting becomes possible — not before).
