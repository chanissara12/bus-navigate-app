# [wayfinder:task] Fold bus-stop into production

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** closed
**Blocked by:** [Shared frontend infrastructure](F02-shared-frontend-infrastructure.md),
[App shell & navigation](F03-app-shell-navigation.md),
[Loading & error UI patterns](F04-loading-error-ui-patterns.md)
**Blocks:** none

## Question

Fold [T13](T13-bus-stop-ui-layout.md)'s winning Variant A (list-first accordion) into
`bus-stop-home.component`; drop Variants B/C and the `?variant=` switcher. Wire it to
the real backend instead of `prototype/prototype-mock-data.ts`:

- Nearby list → `GET /bus-stops/nearby?lat={}&lng={}&radius={}`.
- Row expansion (accordion) → `GET /bus-stops/{id}` for that stop's
  `StopLandmark[]` context.
- Apply the loading-skeleton/error-banner patterns from
  [F04](F04-loading-error-ui-patterns.md).
- Known gap, not fixed by this ticket: `GET /bus-stops/{id}` doesn't return which
  `RouteStop`s serve the stop (flagged in T13, never resolved) — this fold ticket
  can't show that either; don't invent a client-side workaround for it.

## Resolution

F06 is resolved and folded into the production bus-stop page:

- `bus-stop-home.component` now uses T13's winning Variant A (list-first accordion) directly; Variants B/C and the `?variant=` prototype switcher were removed.
- Added `BusStopsService` for the real backend endpoints: nearby stops use `GET /api/v1/bus-stops/nearby?lat={}&lng={}&radius={}`, with a fixed 1 km search radius; expanding a row uses `GET /api/v1/bus-stops/{id}` for `BusStopContextResult` and its `StopLandmark[]`.
- Added frontend models mirroring the backend bus-stop response shapes, including nullable `StopCode`/`Description` fields.
- Added geolocation-driven nearby loading, a dedicated location error/retry state, nearby and expansion loading skeletons, and the F04 contextual error banner pattern.
- Expanded landmark context is fetched on demand; collapsing an already expanded stop does not issue another request.
- The known T13 gap remains unchanged: the context endpoint does not expose which `RouteStop`s serve the stop, so the frontend does not invent or derive that relationship client-side.
- Added service/component coverage for nearby requests, context loading, collapse behavior, and notification on nearby-load failure.

Verified: frontend Jest suite (98/98), TypeScript app/spec checks, and production build all pass.
