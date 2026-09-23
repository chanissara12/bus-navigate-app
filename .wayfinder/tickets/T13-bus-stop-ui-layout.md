# [wayfinder:grilling] Bus-stop lookup/context UI layout

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open
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

Not yet resolved — no prototype has been run for this page.
