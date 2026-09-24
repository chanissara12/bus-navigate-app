# [wayfinder:task] Fold trip-planning into production

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** open
**Blocked by:** [Shared frontend infrastructure](F02-shared-frontend-infrastructure.md),
[App shell & navigation](F03-app-shell-navigation.md),
[Loading & error UI patterns](F04-loading-error-ui-patterns.md)
**Blocks:** none

## Question

Fold [T12](T12-trip-planning-ui-layout.md)'s winning Variant A (list-first) into
`trip-planning-home.component`; drop Variants B/C and the `?variant=` switcher from
this module. Wire it to the real backend instead of
`prototype/prototype-mock-data.ts`:

- Destination search → `GET /places/search?q={text}` (per
  [T11](T11-initial-trip-planning-search.md)).
- Results → `POST /travel-options`.
- Each result card gets an inline "เริ่มเดินทาง" (start trip) button (per the map's
  Notes) that opens `ConfirmDialogComponent` ([F02](F02-shared-frontend-infrastructure.md)),
  then on confirm fires `POST /travel-sessions` and navigates to
  `/travel-session/:id` using the routing shape from
  [F03](F03-app-shell-navigation.md).
- Apply the loading-skeleton/error-banner patterns from
  [F04](F04-loading-error-ui-patterns.md).

## Resolution

_(not yet resolved)_
