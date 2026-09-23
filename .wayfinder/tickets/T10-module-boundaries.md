# [wayfinder:grilling] Finalize frontend/backend module & folder boundaries

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open (unclaimed)
**Blocked by:** [Full Phase 1 API contract](T09-api-contracts.md)
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

(pending)
