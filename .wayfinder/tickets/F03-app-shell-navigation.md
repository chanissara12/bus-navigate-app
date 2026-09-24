# [wayfinder:task] App shell & navigation

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** closed
**Blocked by:** none
**Blocks:** [Fold trip-planning](F05-fold-trip-planning.md),
[Fold bus-stop](F06-fold-bus-stop.md), [Fold travel-session](F07-fold-travel-session.md),
[Fold recovery](F08-fold-recovery.md)

## Question

Build the real navigation shell replacing `app.component.html`'s bare
`<router-outlet>`, per the map's Notes — fully specified during charting:

- Persistent bottom-tab nav, 3 tabs: trip-planning ("ค้นหาเส้นทาง"), bus-stop
  ("ป้ายรถ"), travel-session ("การเดินทางของฉัน"). `recovery` is not a tab.
- Update `app.routes.ts`: `travel-session` and `recovery` routes take a `:id` param
  (`/travel-session/:id`, `/recovery/:id`). A guard or resolver redirects to
  `/trip-planning` when the id is missing, malformed, or the backend 404s the session.
- The travel-session tab's own click behavior: read `ActiveSessionService` (from
  [F02](F02-shared-frontend-infrastructure.md)) for a persisted session id — if
  present, navigate to `/travel-session/:id` with that id; if absent, navigate to
  `/trip-planning` (same redirect target as the missing-id case above, so there's one
  redirect rule, not two).

## Resolution

Built as specified, with one narrowing on the "backend 404s the session" clause:

- `shared/components/bottom-nav/` — persistent bottom-tab nav rendered in
  `app.component.html` next to `<router-outlet>`. trip-planning/bus-stop are plain
  `[routerLink]`s; the travel-session tab has no static link — its click handler reads
  `ActiveSessionService.getActiveSessionId()` and navigates to `/travel-session/:id`
  when present, `/trip-planning` otherwise (one redirect rule, per the ticket). Active
  tab is driven by `router.events` (`NavigationEnd`) mapped to a tab name, via the
  `async` pipe.
- `app.routes.ts` — `travel-session`/`recovery` now take `:id`; a bare path with no id
  redirects straight to `/trip-planning`. Both `:id` routes carry `sessionIdGuard`.
- `shared/guards/session-id.guard.ts` — redirects to `/trip-planning` when `:id` is
  missing or not a positive integer. The "or the backend 404s the session" half of the
  ticket is **not** implemented here: there is no backend endpoint that can confirm a
  `TravelSession` id exists without a side effect. `GET .../progress` 400s (not 404s)
  for a non-`RIDING` session even when the id is valid — using it as an existence check
  would wrongly reject a session in `Planned`/`WalkingToStop`/etc — and `POST
  .../recovery` isn't a safe read either. Redirecting on a genuine backend rejection is
  left to F07/F08's own page-level data fetch, which needs that error handling anyway
  once it calls a real endpoint with the id.

Verified: `npm run test` (58/58 passing), `tsc --noEmit`, `ng build --configuration
production`, and manually in-browser — bottom nav renders and highlights the active
tab, the travel-session tab falls back to `/trip-planning` with no active session, and
`/travel-session/abc` (malformed id) redirects to `/trip-planning` while
`/travel-session/42` (valid id) loads.
