# [wayfinder:grilling] Finalize frontend/backend module & folder boundaries

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none (~~T09~~ closed)
**Blocks:** none — last ticket on the map; resolving this completes the destination.

## Question

Using the initial four-module split from charting (map Notes: `trip-planning`,
`bus-stop`, `travel-session`, `recovery`, with `TransitAlert`/service-status as a
shared cross-cutting service) and the full API surface from
[Full Phase 1 API contract](T09-api-contracts.md), finalize:

- Exact Angular `modules/<feature>/` boundaries — confirm the four-module split holds
  once the real API surface is known, or whether any endpoint naturally forces a
  split/merge (e.g. does "bus stop context" belong inside `bus-stop` or does its own
  data-source/attribution complexity earn it a fifth module?).
- Exact backend `<Feature>/` folder names under `Interfaces/`, `ViewModels/`,
  `Implements/` in `BusNavigate.Domain`/`BusNavigate.Service`/`BusNavigate.Server`,
  matching the frontend split 1:1 where sensible.
- Where the shared `TransitAlert`/service-status logic physically lives on both sides
  (e.g. `shared/services/` on Angular per root CLAUDE.md's shared/ convention; which
  project layer owns it on the backend).
- Confirm no feature module ends up reaching into another feature module's internals
  (per root CLAUDE.md's architecture rule) — flag any endpoint from T09 that would
  violate this and resolve the boundary before closing this ticket.

Resolving this ticket completes the map's destination — the Phase 1 spec is then
locked and ready to hand to implementation.

## Resolution

**Cross-module-reach fix (required before closing):** `recovery` needs the exact same
comparison algorithm as `trip-planning` (per T06). Rather than `recovery` reaching into
`trip-planning`'s internals (violates root CLAUDE.md's architecture rule), the
comparison algorithm is extracted into its own shared service,
`TravelOptionEvaluation`, that both `trip-planning` and `recovery` depend on — neither
owns the other.

**Bus Stop Context stays inside `bus-stop`** — no 5th module. T08 resolved to a single
plain `StopLandmark` list with no photos and no complex logic; `GET /bus-stops/{id}`
already returns it as part of the stop-detail response per T09, so it doesn't carry
enough independent complexity to justify its own module.

### Frontend (`frontend/src/app/modules/`)

- `trip-planning/` — destination/stop search, `TravelOption[]` generation, "can I take
  this bus?" UI
- `bus-stop/` — stop lookup, RouteStop display, bus stop context (`StopLandmark`)
- `travel-session/` — active-trip tracking, progress polling, get-off alerts
- `recovery/` — wrong-bus reporting, `RecoveryOption[]` display
- `shared/services/` — `transit-alert.service.ts` (service-status, cross-cutting, per
  map Notes); nothing algorithmic lives here on the frontend since all comparison
  logic runs server-side — frontend modules only call their own HTTP endpoints, so no
  frontend-side module ever needs another's internals.

### Backend (`BusNavigate.Domain` / `BusNavigate.Service` / `BusNavigate.Server`)

- Core EF Core entities (`BusRoute`, `Direction`, `Trip`, `TripStopTime`, `RouteStop`,
  `BusStop`, `StopLandmark`, `ServiceCalendar`, `ServiceException`, `TransitAlert`,
  `User`, `TravelSession`) live at `BusNavigate.Domain`'s top level (DbContext-adjacent,
  per the existing repo convention), **not** nested under any single feature's
  `<Feature>/` subfolder, since they're shared across every feature.
  `TravelOption`/`RecoveryOption` are **not** persisted entities — they're computed
  results, represented only as `ViewModels/<Feature>/` DTOs.
- Feature folders (`Interfaces/`, `ViewModels/`, `Implements/` in `Domain`/`Service`,
  `Controllers/` in `Server`): `TripPlanning/`, `BusStop/`, `TravelSession/`,
  `Recovery/` — 1:1 with the frontend split.
- Shared, cross-feature folders (same three-layer pattern, but not tied to one
  feature): `ServiceStatus/` (TransitAlert query logic) and `TravelOptionEvaluation/`
  (the comparison algorithm shared by `TripPlanning` and `Recovery`, per the fix
  above).
- `BusNavigate.Server/Middlewares/`: the shared error-response middleware (T09) and a
  device-identity middleware that resolves/lazily-upserts `User` from the
  `X-Device-Id` header once, injecting it into request context — avoids repeating
  that logic in every controller.

**This completes the map's destination.** Data model ([T03](T03-core-data-model.md)),
API contracts ([T09](T09-api-contracts.md)), and module boundaries (this ticket) are
all locked. The Phase 1 spec is ready to hand to implementation.
