# [wayfinder:task] Fold bus-stop into production

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** open
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

_(not yet resolved)_
