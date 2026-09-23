# [wayfinder:grilling] Full Phase 1 API contract

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open (unclaimed) — unblocked
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

(pending)
