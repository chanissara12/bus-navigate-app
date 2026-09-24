# [wayfinder:task] App shell & navigation

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** open
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

_(not yet resolved)_
