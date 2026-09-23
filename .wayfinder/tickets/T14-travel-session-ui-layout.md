# [wayfinder:grilling] Active-trip tracking UI layout

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
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

**Variant A — single status card — wins.** One persistent card shell for the whole
session; only its content (icon, label, instruction text) swaps per
`TravelSessionState`, rather than routing to a different screen per state or
rendering the full state machine as a timeline. `RIDING` adds a progress bar and, when
`IsApproachingDestination` is true, an inline "🔔 ใกล้ถึงจุดลงแล้ว" (get-off-soon)
banner within the same card — the alert is a visual variant of the card's content, not
a separate overlay/modal. `MISBOARDED` reuses the same card shell but re-skins it
(red background, warning icon) and adds a single CTA button ("ดูทางเลือกแก้ปัญหา") —
this is the T14→T15 handoff: the button is a plain navigation trigger into the
`recovery` module, no shared state or embedded recovery UI on this screen.

Rejected:
- **B (step timeline)** — showing the whole journey as a stepper reads well for
  `RIDING`/`ALIGHTED` progression, but wastes screen real estate for the earlier
  `PLANNED`/`WALKING_TO_STOP`/`WAITING` states where there's only one thing to say,
  and needed awkward special-casing for `MISBOARDED` (a branch off the normal-flow
  timeline, not a step on it) and `COMPLETED` (replaces the timeline outright) — the
  single-card shell handles every state uniformly instead.
- **C (full-screen takeover)** — visually the most dramatic get-off alert and the
  clearest `MISBOARDED` moment, but a full-bleed color change on every transition is a
  bigger visual disruption than this screen's actual information density justifies;
  reserved as a pattern worth revisiting specifically for the get-off-soon alert alone
  if user testing later shows the inline banner in Variant A isn't noticeable enough.

**No map/live-position rendering, by design** — same "route-map visualization
deferred" constraint T12 confirmed, doubly true here since there's no push/streaming
infra (map.md standing decision) to drive a live position marker even if a map
existed.

**Not yet folded into production code.** The prototype (all three variants + the
`?variant=` switcher + the demo-only state selector) currently lives on the `test`
branch at
`frontend/src/app/modules/travel-session/pages/travel-session-home/prototype/`. Per
the project's prototype workflow, the next step is: fold variant A's markup into
`travel-session-home.component`, drop variants B/C and both prototype-only controls
(the variant switcher and the state selector) from the mainline, and move the full
prototype set to a throwaway branch as the primary source. That follow-up hasn't been
done yet — this ticket only captures the layout decision.

## Not yet specified

- Whether the get-off-soon banner needs a stronger attention mechanism (sound,
  vibration, or a system notification) beyond the inline visual banner — out of scope
  for a UI-layout prototype, would need its own ticket once Phase 1's polling-based
  progress endpoint is actually wired to a real device.
