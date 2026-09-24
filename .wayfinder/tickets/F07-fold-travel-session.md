# [wayfinder:task] Fold travel-session into production

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** closed
**Blocked by:** [Shared frontend infrastructure](F02-shared-frontend-infrastructure.md),
[App shell & navigation](F03-app-shell-navigation.md),
[Loading & error UI patterns](F04-loading-error-ui-patterns.md)
**Blocks:** none

## Question

Fold [T14](T14-travel-session-ui-layout.md)'s winning Variant A (single status card)
into `travel-session-home.component`; drop Variants B/C, the `?variant=` switcher, and
the demo-only `PrototypeStateSelectorComponent` (that was for previewing states in the
prototype — not a real control). Wire it to the real backend instead of
`prototype/prototype-mock-data.ts`:

- Read the `TravelSession` id from the route (`/travel-session/:id`, per
  [F03](F03-app-shell-navigation.md)); persist it via `ActiveSessionService`
  ([F02](F02-shared-frontend-infrastructure.md)) once loaded.
- Poll `GET /travel-sessions/{id}/progress` (15-30s per the parent map's standing
  decision) while in `RIDING`, for `RemainingStopCount`/`IsApproachingDestination`.
- Replace the demo state-selector with one real action button whose label follows the
  current state (per the map's Notes: "ถึงป้ายแล้ว" → "ขึ้นรถแล้ว" → "ลงรถแล้ว"), routed
  through `ConfirmDialogComponent` before firing `POST /travel-sessions/{id}/events`.
- Add the "แจ้งขึ้นผิดคัน" (report wrong bus) action — also through
  `ConfirmDialogComponent`, firing `ReportedWrongBus` — and the `MISBOARDED`-state CTA
  navigating to `/recovery/:id`.
- On a progress/event response reporting `COMPLETED`/`ABANDONED`, clear
  `ActiveSessionService`'s pointer.
- Apply the loading-skeleton/error-banner patterns from
  [F04](F04-loading-error-ui-patterns.md).

## Resolution

Implemented and verified the production travel-session flow. The prototype variants/state selector were removed; the real travel-session backend is wired through the route session id and `ActiveSessionService`; session progress/event handling, wrong-bus recovery, loading/error UI, destination persistence, and walking-distance display are integrated. Walking distance is displayed as an integer using Angular's `number` pipe. Backend and frontend tests pass.
