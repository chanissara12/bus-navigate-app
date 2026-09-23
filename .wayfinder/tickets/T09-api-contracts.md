# [wayfinder:grilling] Full Phase 1 API contract

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none (~~T04~~, ~~T05~~, ~~T06~~, ~~T07~~, ~~T08~~ all closed)
**Blocks:** [Finalize module & folder boundaries](T10-module-boundaries.md)

## Question

With all Phase 1 entities and algorithms settled by the tickets blocking this one,
assemble the complete `/api/v1/` endpoint list and request/response DTO shapes
(BusNavigate.Domain `ViewModels/<Feature>/`) covering every Phase 1 flow:

- Destination/stop search (restricted to transit-dataset places — see map Notes)
- Trip planning (`TravelOption[]` generation, including "can I take this bus?")
- Bus stop lookup + bus stop context
- TravelSession lifecycle: create/confirm plan, state transitions, progress-polling
  endpoint (get-off assistance)
- Wrong-bus recovery: report + `RecoveryOption[]`
- Service status query (by route/direction)

Also resolve, now that the pieces exist to decide it:

- The concrete mechanism for anonymous device-scoped identity (see map's "Not yet
  specified") — e.g. a client-generated token echoed in a request header, vs. a
  server-issued session id on first call.
- Consistent error-response shape across all endpoints (per root CLAUDE.md's
  shared-`catchError` convention on the frontend side — confirm the backend error body
  shape that convention expects to parse).
- Whether any endpoints need pagination (e.g. stop search results) and the shared
  pagination envelope if so.

## Resolution

### Identity, errors, pagination

- **Anonymous identity:** client generates a UUID v4 on first launch, stored locally,
  sent on every request via an `X-Device-Id` header. Server upserts a `User` row lazily
  on first sight of a new device id — no separate "create session" round-trip needed,
  works offline-first.
- **Error shape** (all endpoints, via a shared exception-handling middleware):
  `{ "message": string, "code"?: string, "details"?: object }` — matches root
  CLAUDE.md's frontend `catchError` convention (`err.error?.message`) directly.
- **Pagination:** none. Search endpoints cap results (top 20) rather than paginate —
  no Phase 1 flow needs a "next page" of search results.
- **TravelSession transitions:** one endpoint, `POST /travel-sessions/{id}/events` with
  body `{ "type": "started_walking" | "arrived_at_stop" | "boarded" | "alighted" |
  "reached_destination" | "reported_wrong_bus" }`, validated against T04's transition
  table server-side (invalid transitions rejected with the standard error shape) —
  avoids duplicating the same state-check logic across many action-specific endpoints.

### Endpoint list (`/api/v1/`, `BusNavigate.Server/Controllers/<Feature>/`)

**Places / stop search** (`trip-planning` feature, per map's module split)
- `GET /places/search?q={text}` → `Place[]` (top 20, restricted to transit-dataset
  names — see map Notes; no external geocoding)

**Trip planning** (`trip-planning`)
- `POST /travel-options` — body `{ currentLocation, destinationPlaceId }` →
  `TravelOption[]` (full search, per initial trip planning)
- `POST /travel-options/compare` — body `{ currentTravelSessionId, candidateRouteId,
  candidateDirectionId }` → `{ accepted: bool, option?: TravelOption, reasons:
  ReasonCode[] }` (the T05 "can I take this bus?" check — 1-to-1, not a fresh search)

**Bus stops** (`bus-stop`)
- `GET /bus-stops/{id}` → `BusStop` + `StopLandmark[]` (bus stop context; empty array
  if none, never an error)
- `GET /bus-stops/nearby?lat={}&lng={}&radius={}` → `BusStop[]` (current-stop
  identification)

**Travel sessions** (`travel-session`)
- `POST /travel-sessions` — body `{ travelOptionId }` → creates a session in `PLANNED`
  state
- `POST /travel-sessions/{id}/events` — state transitions (see above)
- `GET /travel-sessions/{id}/progress` — polling endpoint (remaining-stop count, ETA,
  get-off threshold), valid only while `RIDING`

**Recovery** (`recovery`)
- `POST /travel-sessions/{id}/recovery` — triggered by (or combined with) a
  `reported_wrong_bus` event → `RecoveryOption[]`, each tagged confirmed (bus-based) or
  unconfirmed (BTS/MRT `Place` pointer, per T06)

**Service status** (cross-cutting shared service, not its own feature module)
- `GET /routes/{routeId}/status?directionId={optional}` → `{ transitAlert:
  TransitAlert | null, notOperatingToday: bool }` — the two kept as separate fields per
  T07, never merged

All request/response DTOs live under each feature's
`BusNavigate.Domain/ViewModels/<Feature>/` per backend/CLAUDE.md's existing convention.

This completes the destination's "API contracts" piece. Feeds
[T10](T10-module-boundaries.md) directly — the endpoint list above is what T10 uses to
confirm/adjust the module split.
