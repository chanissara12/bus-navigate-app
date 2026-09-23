# [wayfinder:grilling] Wrong-bus recovery UI layout

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open
**Blocked by:** none ([Finalize module & folder boundaries](T10-module-boundaries.md)
closed); should be designed after
[Active-trip tracking UI layout](T14-travel-session-ui-layout.md) since recovery is
entered from a `MISBOARDED` `travel-session` state
**Blocks:** none — informs the `recovery` Angular module's page implementation

## Question

Same gap as [T12](T12-trip-planning-ui-layout.md), for the `recovery` module: no
UI/wireframe design is in scope for the map, but this page needs a real layout before
implementation can proceed past the current placeholder.

`POST /travel-sessions/{id}/recovery` (per T09) triggers wrong-bus recovery, reusing
T05's comparison algorithm exactly via the shared `TravelOptionEvaluation` service
(per [T06](T06-wrong-bus-recovery.md) / [T10](T10-module-boundaries.md)) from the
session's `CurrentLocation`. Results are `RecoveryOption[]` — "continue on current
bus" isn't special-cased, just another candidate. BTS/MRT stations appear only as
unconfirmed `Place` pointers (`DataConfidence: Unknown`, no rail routing in Phase 1).

What should the recovery screen look like: how does it present "continue as-is" next
to genuine alternatives without making the current (wrong) bus look like a normal
option, and how is `DataConfidence: Unknown` (unconfirmed BTS/MRT pointer) visually
distinguished from a confirmed bus `RecoveryOption`?

Follow [T12](T12-trip-planning-ui-layout.md)'s process: prototype 2-3 structurally
different layouts on the live `/recovery` route via the project's `/prototype` UI
workflow (`?variant=`), pick one, record the resolution here.

## Resolution

Not yet resolved — no prototype has been run for this page.
