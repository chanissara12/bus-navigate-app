# [wayfinder:map] Phase 1 Spec — Public Transit Decision & Recovery Assistant

**STATUS: COMPLETE** — all 15 tickets closed, including the four UI-layout tickets
(T12-T15) opened after frontend scaffolding started. None of the four winning
layouts have been folded into the mainline frontend code yet — see each ticket's
Resolution for that follow-up. The two "Not yet specified" items below are a separate
thing: deliberately out of this destination's scope entirely (deferred to a future
effort), not unfinished parts of this one.

**Amendment (post-implementation):** [T11](tickets/T11-initial-trip-planning-search.md)
was added after T09/T05 turned out to reference an "initial TravelOption generation"
algorithm that no ticket had actually designed — T05's resolution assumed it was
"already covered" elsewhere, and T09 assembled its endpoint list from
PROPOSAL.md/CONTEXT.md directly without verifying that assumption. Caught during
implementation of T09's controllers, not before. The map was briefly inaccurate
("COMPLETE" while a load-bearing piece was missing) between T09 closing and T11
closing; no other ticket's decisions changed as a result.

**Amendment 2 (post-implementation):**
[T12](tickets/T12-trip-planning-ui-layout.md) is a narrow, deliberate exception to
this map's own "no UI/wireframe design in scope" rule (see Destination below) — once
frontend scaffolding actually needed a `trip-planning` page and T11's `TravelOption[]`
shape had nowhere to render, the layout question became a real blocker, not a
future-phase nicety. Resolved via the project's UI-prototype workflow (three
structural variants prototyped live, one chosen); the "no route-map visualization in
Phase 1" deferral itself was not reopened — T12 confirms it, an earlier prototype
draft that added a map placeholder was rejected specifically for violating it. As of
this amendment, the winning variant has **not** yet been folded into the mainline
frontend code — see T12's resolution for the follow-up cleanup still owed.

**Amendment 3 (post-implementation):** [T13](tickets/T13-bus-stop-ui-layout.md),
[T14](tickets/T14-travel-session-ui-layout.md), and
[T15](tickets/T15-recovery-ui-layout.md) were opened to track the same UI-layout gap
as T12 for the three remaining feature modules (`bus-stop`, `travel-session`,
`recovery`) — opened together so the gap is visible up front instead of being
rediscovered module-by-module the way T11 and T12 each were.

**Amendment 4 (post-implementation):** [T13](tickets/T13-bus-stop-ui-layout.md)
closed with Variant A (list-first accordion) for `bus-stop` — a single stacked list
with inline expansion, chosen over T12's original split-panel pick because a bus-stop
lookup carries far less simultaneous detail than a trip-planning comparison. T12 was
then **revised** from its original Variant B pick to Variant A as well, specifically
to keep `trip-planning` and `bus-stop` — two screens a rider moves between in one
continuous flow — on the same layout family, rather than each module optimizing
independently. See T12's Resolution for the full before/after. T13 also surfaced an
unresolved gap: the Question asked how a stop's serving `RouteStop`s are shown, but
`GET /bus-stops/{id}` doesn't return that data at all — flagged in T13, not resolved
by it.

**Amendment 5 (post-implementation):** [T14](tickets/T14-travel-session-ui-layout.md)
closed with Variant A (single status card) — one persistent card shell whose content
swaps per `TravelSessionState`, rather than a full journey timeline or a full-screen
takeover per state; the `MISBOARDED` state re-skins the same card and adds a CTA that
hands off into `recovery`, no embedded recovery UI on this screen.
[T15](tickets/T15-recovery-ui-layout.md) closed with Variant C (tiered urgency stack)
— the "continue on current bus" candidate stays inside `RecommendedOptions` per T06's
"not special-cased" rule but is visually demoted (muted styling, no "แนะนำ" badge) so
it never reads as a normal, equally-good choice; `LastResortOptions` collapse behind
an expander and `UnconfirmedRailPointers` get a distinct dashed/reduced-opacity
treatment. Unlike T12→T13's convergence on one shared layout family, T14 and T15 did
**not** converge on the same variant letter — each module's actual content density and
urgency drove an independent pick, and forcing consistency here would have meant
picking the wrong layout for one of the two screens.

## Destination

A locked spec — data model, API contracts, and frontend/backend module boundaries —
for the **Phase 1 MVP** of the Public Transit Decision & Recovery Assistant
(PROPOSAL.md section 24: destination search, bus stop search, route/direction,
boarding/alighting stop, next stop, basic ETA, current location, wrong-bus recovery,
alternative route, "can I take this bus?", service status, bus stop context,
explainable recommendation). Ready to hand to implementation — no UI/wireframe design
included; components are expected to emerge during implementation.

## Notes

- Domain glossary: [CONTEXT.md](../CONTEXT.md) — read before working any ticket.
- Repo architecture is already fixed, not up for debate: `frontend/` (Angular,
  `modules/<feature>/{components,models,pages,services}`) and `backend/` (.NET Core Web
  API + EF Core, layered `BusNavigate.Domain` → `BusNavigate.Service` →
  `BusNavigate.Server`, feature code under `<Feature>/` subfolders). See
  `frontend/CLAUDE.md` and `backend/CLAUDE.md`.
- Decisions are recorded directly in ticket bodies/resolutions and gisted here — no
  separate ADR docs for this effort.
- No UI/wireframe design in scope for this map — data/API/module boundaries only.
- Standing decisions from charting (apply across all tickets unless a ticket says
  otherwise):
  - API: plain REST resources under `/api/v1/`.
  - Active-trip progress ("get off assistance") is computed server-side via a polling
    endpoint (e.g. `GET /travel-sessions/{id}/progress`), not client-only — coarse
    polling interval (15–30s), no push/streaming infra in Phase 1.
  - `User` is anonymous/device-scoped for Phase 1 — no login/signup flow.
  - Destination/place search is restricted to the transit dataset's own named
    stops/places — no external geocoding provider in Phase 1.
  - `Reason` on `TravelOption`/`RecoveryOption` is a structured list of factor
    codes+values (e.g. `{code: "FASTER_BY", minutes: 6}`), not free text — frontend
    owns localization/rendering.
  - Frontend/backend feature module boundaries (initial split, may be refined by
    [Finalize module boundaries](../.wayfinder/tickets/T10-module-boundaries.md)):
    `trip-planning` (search + TravelOption generation, incl. "can I take this bus?"),
    `bus-stop` (lookup, RouteStop, stop context), `travel-session` (active-trip
    tracking, get-off alerts), `recovery` (wrong-bus/wrong-stop handling).
    `TransitAlert`/service-status is cross-cutting, consumed by all four via a shared
    service — not its own feature module.

## Decisions so far

- [Wrong-bus recovery UI layout](tickets/T15-recovery-ui-layout.md): Tiered urgency
  stack wins — `RecommendedOptions` render as prominent tagged cards, except the
  "continue on current bus" candidate, which per T06 stays in the same list but is
  deliberately styled muted with no "แนะนำ" badge, so it never reads as a normal
  choice even though it's technically eligible. `LastResortOptions` collapse behind a
  closed-by-default expander; `UnconfirmedRailPointers` get a dashed-border, reduced-
  opacity treatment distinct from confirmed options in every tier. Chosen over a
  list-first sectioned layout (too easy to mistake the current-bus card for a genuine
  recommendation) and a split list + reasons-on-selection panel (adds a click of
  friction this urgent, single-glance screen shouldn't have). Not yet folded into the
  mainline frontend code.
- [Active-trip tracking UI layout](tickets/T14-travel-session-ui-layout.md): Single
  status card wins — one persistent card shell across the whole `TravelSessionState`
  machine; only its content swaps per state. `RIDING` adds a progress bar plus an
  inline get-off-soon banner when `IsApproachingDestination`; `MISBOARDED` re-skins
  the same card (red, warning icon) with a CTA that hands off into `recovery` by plain
  navigation, no embedded recovery UI. Chosen over a full journey-timeline stepper
  (wastes space on early single-instruction states, awkward for `MISBOARDED`/
  `COMPLETED` which don't sit on the normal-flow timeline) and a full-screen
  per-state takeover (more visual disruption than this screen's information density
  justifies). No map/live-position rendering — same deferral as T12/T13, doubly so
  since Phase 1 has no push/streaming infra for a live position marker. Not yet
  folded into the mainline frontend code.
- [Bus-stop lookup/context UI layout](tickets/T13-bus-stop-ui-layout.md): List-first
  accordion wins — nearby stops (`GET /bus-stops/nearby`) as a single stacked list,
  tapping a row expands its `StopLandmark[]` context inline below it. Chosen over a
  split list+detail panel (too much layout for how little a stop carries at once) and
  a single-stop "walking guide" focus (fights the real use case of comparing 2-3
  nearby stops before committing to one). Surfaced an unresolved gap: `GET
  /bus-stops/{id}` doesn't return which `RouteStop`s serve the stop, so the prototype
  can't show that even though the ticket's Question asked for it. Not yet folded into
  the mainline frontend code.
- [Trip-planning search/results UI layout](tickets/T12-trip-planning-ui-layout.md):
  **Revised to list-first** (full-width stacked cards, single-column scroll) —
  originally a split list + journey-detail layout, changed after T13 landed on
  list-first for `bus-stop` so the two screens a rider moves between share one layout
  family instead of diverging. Every `TravelOption` still shown, per the map's "never
  collapse to one answer" rule. No map component — an earlier draft with a map
  placeholder was rejected for reopening the "route-map visualization deferred"
  decision below. Not yet folded into the mainline frontend code.
- [Initial trip planning search (TravelOption generation) & destination/stop search](tickets/T11-initial-trip-planning-search.md):
  Closes the gap T09/T05 assumed was already covered elsewhere. Destination/stop search
  is a case-insensitive substring match across `BusStop`/`Place` names, capped at 20,
  no fuzzy matching. `POST /travel-options` is **direct-connections only** — no
  transfer search, since `TravelSession`/`TravelOptionEvaluation` have no multi-leg
  modeling; a Direction must have a boarding `RouteStop` within the walk budget of
  `currentLocation` *and* a later-sequenced alighting `RouteStop` within the walk
  budget of the destination (the sequence-order check is new — T05/T06 never needed
  it, since they always check a single already-directionally-consistent pair).
  `EstimatedDuration`/`WaitingTime` deferred (need live Trip-schedule matching, a
  separate feature). The walk-budget reachability check is extracted out of
  `TravelOptionEvaluationService` into a shared helper so this ticket's search and
  T05's comparison don't duplicate the same haversine-plus-budget logic a third time.
- [Finalize module & folder boundaries](tickets/T10-module-boundaries.md): Extracted a
  shared `TravelOptionEvaluation` service (not owned by either) so `recovery` doesn't
  reach into `trip-planning`'s internals. Confirmed the four-module split holds — no
  5th module for bus stop context. Core entities live at `BusNavigate.Domain`'s top
  level, not nested in any one feature folder, since they're shared across all of
  them. **This closes the map.**
- [Full Phase 1 API contract](tickets/T09-api-contracts.md): Anonymous identity via
  client-generated `X-Device-Id` header (lazy `User` upsert, no session round-trip).
  Error shape `{message, code?, details?}` matching CLAUDE.md's frontend `catchError`
  convention. No pagination — capped search results (top 20). TravelSession
  transitions via one `POST /travel-sessions/{id}/events` endpoint, not per-action
  endpoints. Full endpoint list assembled across all Phase 1 flows.
- [Bus Stop Context data model](tickets/T08-bus-stop-context.md): No `StopImage`
  table for Phase 1 (no imagery source, no consumer — would be dead schema).
  `StopLandmark` uses a hybrid `LandmarkType` enum + free-text `Description` fallback,
  sourced from OSM via the same weekly sync job as GTFS. Attribution is one app-wide
  static credit line, not per-record. No `VerificationStatus` field yet (only one
  source exists).
- [Service Status data model & rules](tickets/T07-service-status.md): No automatic
  status feed exists (verified — Namtang is static-schedule-only). `TransitAlert` is a
  manual, human-curated table only — no GTFS-diff auto-detection (rejected: risks
  confidently-wrong "Cancelled" claims on mere data blips). Default with no record:
  `Normal` + `DataConfidence: Scheduled`, safe even if never curated. "Not Operating
  Today" (from ServiceCalendar/ServiceException) is kept strictly separate from
  "Cancelled" (a TransitAlert record) at the API level.
- [Wrong-bus recovery algorithm & Recovery Point search](tickets/T06-wrong-bus-recovery.md):
  Reuses T05's algorithm exactly (same thresholds, no relaxation) from the new
  CurrentLocation; "continue on current bus" isn't special-cased, just another
  candidate. BTS/MRT modeled as unconfirmed `Place` pointers (`DataConfidence: Unknown`)
  since Namtang GTFS has no rail data — full rail routing deferred (see Not yet
  specified). Search radius = same 800m walk budget as T05.
- ["Can I take this bus?" comparison algorithm](tickets/T05-can-i-take-this-bus.md):
  1-to-1 check of one named candidate vs. the current plan (not a fresh search). Hard
  reject if it can't reach the destination/transfer point, needs >1 extra transfer, or
  >800m extra walking. Walking distance = haversine × 1.3, at 5 km/h. Structured
  `Reason` factor codes defined (extendable later).
- [TravelSession state machine](tickets/T04-travel-session-state-machine.md): States
  `PLANNED → WALKING_TO_STOP → WAITING → RIDING → ALIGHTED → COMPLETED`, plus
  `MISBOARDED` (distinct state, entry point for wrong-bus recovery) and `ABANDONED`
  (auto after 2h no activity). All main transitions are explicit user actions, not
  GPS-inferred. Get-off assistance is a computed threshold within `RIDING`, not its
  own state.
- [Core Phase 1 data model schema](tickets/T03-core-data-model.md): EF Core entities
  for BusRoute/Direction/RouteStop/BusStop/Trip/TripStopTime/ServiceCalendar/
  ServiceException, mapped from Namtang GTFS. Direction stays coarse (one per
  route+direction_id, not per stop-pattern variant); Trips reference a subset of
  RouteStops via TripStopTime. RoadSide ships as `Unknown` in Phase 1 (no curation
  tooling) — boarding-direction correctness never depends on it, only on Direction
  membership. Import is a scheduled weekly upsert job keyed by GTFS natural IDs.
  TripStopTime uses `TimeSpan` (not `TimeOnly`) for times, since GTFS times can exceed
  24:00:00. TransitAlert/DataConfidence deferred to T07 (not stored here).
- [Choose transit data source](tickets/T01-transit-data-source.md): Ingest the
  **Namtang GTFS feed** (Thailand's Office of Transport and Traffic Policy and
  Planning, OTP/สนข.) under **CC BY 4.0** — commercial use permitted with attribution
  only, no share-alike/partnership required. Covers Bangkok bus routes, both
  directions, ordered stops, and schedules, matching the domain model directly.
  Attribution must be surfaced by the API contract ticket.
- [Choose bus-stop imagery & landmark source](tickets/T02-stop-imagery-source.md): No
  imagery source (Google Street View Static API, Mapillary, KartaView, official Thai
  gov/BMTA data) clears the licensing/coverage bar for Phase 1 — `StopImage` (photos)
  deferred. Bus Stop Context degrades to structured text-only data sourced from
  OpenStreetMap POI/landmark tags (ODbL, Produced Work exception — attribution only,
  no share-alike burden).

## Not yet specified

- Whether to add route-map visualization (drawing the bus route / walking path on a
  map) to this Phase 1 destination, or hold it as a fast-follow after Phase 1 ships.
  Deliberately not ticketed now — the current destination excludes UI/wireframe design,
  and adding map rendering now would also require pulling in GTFS `shapes.txt` (route
  geometry), which no ticket currently ingests. Retrofitting later is low-cost (an
  additive `RouteShape` entity + an extra response field — no rework of `BusRoute`/
  `Direction`/`RouteStop`/`Trip` or any decision algorithm in T05/T06), so this is
  intentionally deferred rather than resolved. Note: the pre-rewrite `main` branch had
  a fully-built map feature (route drawing, walking-path road-snapping, footbridges,
  map background layer) — worth revisiting as a reference if/when this graduates to a
  ticket.
- Whether to add full BTS/MRT route/schedule data (not just station location) to
  recovery/trip-planning. Bigger than the map-visualization fog item above: this would
  require its own T01-equivalent research effort (BTSC/BEM licensing — separate from
  and likely harder than the Namtang bus feed), would likely require *renaming/
  widening* T03's already-closed `BusRoute`/`BusStop` entities to a mode-aware shape
  rather than purely adding to them, and would add a fare/ticketing-system dimension
  (Rabbit/MRT card vs. bus fare) that T05/T06's comparison logic doesn't currently
  account for. Deliberately not ticketed — PROPOSAL.md's own framing is bus-focused
  ("โดยเฉพาะรถเมล์"); BTS/MRT stations are handled today only as unconfirmed
  `Place`-level pointers (see T06's resolution). Revisit as its own phase/effort, not a
  fast-follow addition to this one.
- Whether the chosen transit data source (or stop-imagery source) requires signup,
  registration, or an API key — and if so, a Task ticket to provision access. Can't be
  ticketed until [Choose transit data source](tickets/T01-transit-data-source.md) and
  [Choose bus-stop imagery source](tickets/T02-stop-imagery-source.md) resolve.
- Specific mechanism for anonymous device-scoped identity (generated token in
  localStorage vs cookie vs header) — likely folds into
  [Full Phase 1 API contract](tickets/T09-api-contracts.md) once that ticket is worked.

## Out of scope

- Phase 2/3 features per PROPOSAL.md section 24: real-time vehicle tracking, OCR/photo
  bus-stop-sign recognition, dynamic route-change detection, proactive notifications,
  crowdsourced reports (`UserReport`), accessibility preferences (`UserPreference`),
  conversational AI assistant, predictive arrival. These return only if a future map
  redraws the destination to include them.
