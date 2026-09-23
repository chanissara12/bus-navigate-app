# [wayfinder:grilling] Active-trip tracking UI layout

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open
**Blocked by:** none ([Finalize module & folder boundaries](T10-module-boundaries.md)
closed)
**Blocks:** none — informs the `travel-session` Angular module's page implementation

## Question

Same gap as [T12](T12-trip-planning-ui-layout.md), for the `travel-session` module:
no UI/wireframe design is in scope for the map, but this page needs a real layout
before implementation can proceed past the current placeholder.

The `travel-session` state machine ([T04](T04-travel-session-state-machine.md)) has
states `PLANNED → WALKING_TO_STOP → WAITING → RIDING → ALIGHTED → COMPLETED`, plus
`MISBOARDED`/`ABANDONED`. `GET /travel-sessions/{id}/progress` polls (15-30s, per the
map's standing decision — no push/streaming infra) for remaining-stop count and
get-off-assistance threshold data. `POST /travel-sessions/{id}/events` drives all
state transitions, which are explicit user actions, not GPS-inferred.

What should this screen look like across the different states — does it need
per-state layouts or one shell that swaps content, how is the "get off soon" alert
surfaced, and how does a `MISBOARDED` state hand off into the `recovery` module's UI
(T15)?

Follow [T12](T12-trip-planning-ui-layout.md)'s process: prototype 2-3 structurally
different layouts (likely per-state or as a single adaptive shell) on the live
`/travel-session` route via the project's `/prototype` UI workflow (`?variant=`), pick
one, record the resolution here. No map/live-position rendering — same "route-map
visualization deferred" constraint as T12 applies here too, doubly so since there's
no push/streaming infra to drive a live position marker in Phase 1.

## Resolution

Not yet resolved — no prototype has been run for this page.
