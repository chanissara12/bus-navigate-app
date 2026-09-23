# [wayfinder:map] Phase 1 Spec — Public Transit Decision & Recovery Assistant

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
