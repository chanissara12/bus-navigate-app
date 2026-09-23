# [wayfinder:grilling] Trip-planning search/results UI layout

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none ([Finalize module & folder boundaries](T10-module-boundaries.md),
[Initial trip planning search](T11-initial-trip-planning-search.md) both closed)
**Blocks:** none — informs the `trip-planning` Angular module's page implementation

## Question

The map's own Notes are explicit that **no UI/wireframe design is in scope for this
map** — data/API/module boundaries only (see map.md "Destination" and "Not yet
specified"). That left a real gap once frontend scaffolding started: the
`trip-planning` module's home page had a `TravelOption[]` result shape from T11 and
nowhere to put it. This ticket retroactively closes that gap the same way T11 closed
T09's — a decision made during implementation, not before it.

Using T11's `TravelOption[]` shape (route, direction, boarding/alighting stop, walking
distance, `ServiceStatus`) and the map's standing decisions — "never collapse to one
answer" (multiple `TravelOption`s always shown side by side, no ranking) and
route-map visualization deliberately deferred out of Phase 1 (map.md "Not yet
specified") — what should the trip-planning search/results screen actually look like?

Three structurally different layouts were prototyped on the live `/trip-planning`
route (`?variant=A|B|C`, via the project's `/prototype` UI-prototype workflow):

- **A — List-first:** search fields on top, results as full-width stacked cards below,
  single-column scroll.
- **B — Split list + journey detail:** compact result rows in a left rail; selecting
  one expands a step-by-step journey timeline (walk → board → ride → alight) in a
  detail panel on the right.
- **C — Comparison carousel:** compact search bar, results laid out as a
  horizontally-scrolling row of comparison cards (route/stops/walk/status as a
  mini-table per card) for side-by-side numeric comparison.

An earlier draft of variant B included a placeholder map panel — rejected during
review as out-of-scope: route-map visualization needs GTFS `shapes.txt`, which no
ticket ingests, and the map explicitly defers it (see map.md "Not yet specified").
Variant B was reworked to drop the map area in favor of the journey-timeline panel
before this ticket closed.

## Resolution

**Revised: Variant A — list-first — wins** (superseded the original choice below once
[T13](T13-bus-stop-ui-layout.md)'s bus-stop prototype landed on A for a related
reason — single stacked-list scroll over a split desktop-oriented panel — and the two
sibling `trip-planning`/`bus-stop` screens were brought in line for consistency across
the app rather than each module picking independently). Search fields on top, results
as full-width stacked cards below, single-column scroll — every `TravelOption` shown,
matching the map's "never collapse to one answer" decision the same way B did.

<details>
<summary>Original resolution (superseded) — Variant B, split list + journey detail</summary>

**Variant B — split list + journey detail — wins.** Left rail: compact rows (route
badge, direction, walk distance, a small status dot), matching the map's "never
collapse to one answer" decision by keeping every `TravelOption` visible and tappable,
not just the best one. Right panel: selecting a row expands a step-by-step timeline
(🚶 walk to stop → 🚌 board → 🏁 alight) using the same `TravelOption` fields T11
already returns — no new backend field needed.

Rejected:
- **A (list-first)** — full-width stacked cards read fine on mobile but waste the
  desktop/tablet width the split layout uses productively, and stacking every option's
  full detail up front (vs. progressive disclosure on selection) gets noisy past 3-4
  results.
- **C (comparison carousel)** — good for quick side-by-side scanning but the
  mini-table-per-card format compresses `directionName`/stop names awkwardly at
  narrow card widths, and horizontal scroll discovery is a weaker default than a
  vertical list for a "top 20 capped, no ranking" result set (map Notes).

</details>

Rejected on revision:
- **B (split list + journey detail)** — the original pick; superseded, not because it
  was wrong on its own merits (still true: desktop/tablet width used productively,
  progressive disclosure keeps the list scannable), but because keeping it would leave
  `trip-planning` and `bus-stop` on two different layout families for what a rider
  experiences as one connected flow (find a stop → plan a trip).
- **C (comparison carousel)** — reasoning unchanged from the original resolution
  above.

**No map component, by design** — confirms rather than reopens the map's existing
"Not yet specified" deferral of route-map visualization; this ticket doesn't change
that decision, it just makes sure the winning trip-planning layout doesn't
accidentally imply a map exists.

**Not yet folded into production code.** The prototype (all three variants + the
`?variant=` switcher) currently lives on the `test` branch at
`frontend/src/app/modules/trip-planning/pages/trip-planning-home/prototype/` and
`frontend/src/app/shared/components/prototype-switcher/`. Per the project's prototype
workflow, the next step is: fold variant A's markup into
`trip-planning-home.component`, drop variants B/C and the switcher from the mainline,
and move the full prototype set to a throwaway branch as the primary source. That
follow-up hasn't been done yet — this ticket only captures the layout decision.

## Not yet specified

- Full-screen/responsive behavior below the split layout's usable width (the
  prototype's `md:` breakpoint falls back to a single column but wasn't evaluated
  against real device widths).
- Loading/skeleton state for the result list and detail panel once `POST
  /travel-options` is wired to the real API instead of mock data — per
  `frontend/CLAUDE.md`'s loading-indicator rules, fetched data needs a skeleton, not
  a spinner, but the concrete skeleton layout wasn't prototyped.
