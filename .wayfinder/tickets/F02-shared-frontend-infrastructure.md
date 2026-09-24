# [wayfinder:task] Shared frontend infrastructure (identity, session, confirm, errors)

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** open
**Blocked by:** none
**Blocks:** [Fold trip-planning](F05-fold-trip-planning.md),
[Fold bus-stop](F06-fold-bus-stop.md), [Fold travel-session](F07-fold-travel-session.md),
[Fold recovery](F08-fold-recovery.md)

## Question

Build the small, shared pieces every page-fold ticket depends on — all fully specified
during charting, nothing left to decide:

1. `DeviceIdentityService` (`shared/services/`) — generates a `crypto.randomUUID()` on
   first run, persists it in `localStorage`, exposes the current device id.
2. An HTTP interceptor that attaches `X-Device-Id` to every outgoing request, reading
   from `DeviceIdentityService`. Registered via `provideHttpClient(withInterceptors(...))`
   in `app.config.ts`.
3. `ActiveSessionService` (`shared/services/`) — persists the current `TravelSession`
   id in `localStorage` (separate key/lifecycle from the device id, even though both
   can share one small localStorage read/write helper), exposes it, and clears it
   automatically when a `travel-session` progress read or event response reports
   `COMPLETED`/`ABANDONED`.
4. `ConfirmDialogComponent` (`shared/components/`) — a generic dialog (title + message
   + confirm/cancel), Tailwind-styled, no variants. Used before every state-changing
   action (start-trip, every `travel-session` event, `ConfirmedRecovery`) since none of
   these transitions can be undone once fired.
5. `ErrorNotificationService` (`shared/services/`) — a `.notify(message)`-style service
   that catch blocks report to; the error-banner UI (built in
   [F04](F04-loading-error-ui-patterns.md)) subscribes to it. Existing per-call
   `catchError` pattern (see `TransitAlertService`) stays as-is and reports into this
   service rather than being replaced by a global interceptor.

## Resolution

_(not yet resolved)_
