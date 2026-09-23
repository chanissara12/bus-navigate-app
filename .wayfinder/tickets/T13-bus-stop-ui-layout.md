# [wayfinder:grilling] Bus-stop lookup/context UI layout

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none ([Finalize module & folder boundaries](T10-module-boundaries.md)
closed)
**Blocks:** none — informs the `bus-stop` Angular module's page implementation

## Question

Same gap as [T12](T12-trip-planning-ui-layout.md), for the `bus-stop` module: the map's
Notes are explicit that no UI/wireframe design is in scope for this map, but the
`bus-stop` home page needs a real layout before implementation can proceed past the
current placeholder.

`GET /bus-stops/{id}` (per T09) returns `BusStop` + `StopLandmark[]` (bus stop context
— T08's hybrid `LandmarkType` enum + free-text `Description` fallback, no photos in
Phase 1). `GET /bus-stops/nearby` returns current-stop candidates. What should the
lookup/detail screen look like: how is landmark/context data (text-only, per T08 —
no `StopImage`) presented, how are `RouteStop`s serving this stop shown, and how does
"nearby" search feed into stop selection?

Follow [T12](T12-trip-planning-ui-layout.md)'s process: prototype 2-3 structurally
different layouts on the live `/bus-stop` route via the project's `/prototype` UI
workflow (`?variant=`), pick one, record the resolution here.

## Resolution

**Variant A — list-first accordion — wins.** Nearby stops render as a single stacked
list (`GET /bus-stops/nearby` → `BusStopSummary[]`); tapping a row expands its
`StopLandmark[]` context inline, directly below that row, instead of routing to a
separate detail view or a split panel. Matches the simple, single-purpose nature of
this screen — unlike trip-planning's multi-field comparison, a bus-stop lookup is
"pick a nearby stop, see what's around it," and an accordion keeps that in one
continuous scroll without a second navigation level.

Rejected:
- **B (split list + grouped detail)** — grouping landmarks by `LandmarkType` read
  fine, but the two-pane layout implies more simultaneous information than this
  screen actually carries (at most a handful of landmarks per stop); the desktop
  width split gained little over inline expansion, unlike T12's trip-planning case
  where the detail panel is genuinely denser (a multi-step journey timeline).
- **C (walking-guide focus)** — the ordered walking-guide framing is appealing but
  forces a single "nearest stop" focus, which fights against the actual use case: the
  user is comparing 2-3 nearby stops (e.g. deciding whether to walk further to the one
  with a skywalk crossing), not committed to the closest one yet.

**Open gap, not resolved by this ticket:** the Question asked how `RouteStop`s serving
a stop are shown, but `GET /bus-stops/{id}` (per T09/`BusStopContextResult`) does not
actually return that data — only `BusStop` fields + `StopLandmark[]`. The prototype
therefore doesn't show route-serving info at all, since there's nothing in the locked
API shape to render. Whether that's a real product gap (a rider on this screen likely
wants to know which routes stop here) or intentionally out of Phase 1 scope wasn't
settled — flagging for a future ticket rather than deciding it here.

**Consistent with [T12](T12-trip-planning-ui-layout.md), now also Variant A.** T12's
original split-layout choice (Variant B) was revisited after this ticket closed and
changed to Variant A for consistency — see T12's Resolution for the updated reasoning.

**Not yet folded into production code** — same as T12, the prototype (all three
variants + the shared `?variant=` switcher) still lives on the `test` branch under
`frontend/src/app/modules/bus-stop/pages/bus-stop-home/prototype/`.
