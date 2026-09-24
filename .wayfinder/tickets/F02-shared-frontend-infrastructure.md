# [wayfinder:task] Shared frontend infrastructure (identity, session, confirm, errors)

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** closed
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

Built all 5 pieces as specified, each with unit tests:

- `local-storage.helper.ts` (`shared/helpers/`) — the shared read/write/remove wrapper
  item 3 anticipated, used by both services below.
- `DeviceIdentityService` + `deviceIdInterceptor` (functional `HttpInterceptorFn`,
  registered via `provideHttpClient(withInterceptors([deviceIdInterceptor]))` in
  `app.config.ts`).
- `ActiveSessionService` — persists/clears the active session id under its own storage
  key. Clearing on `COMPLETED`/`ABANDONED` is exposed as `updateFromState(state)` rather
  than the service performing its own HTTP read: `GET .../progress`
  (`TravelSessionProgress` ViewModel) carries no `State` field, only
  `POST .../events`'s response (`TravelSessionResponse`) does, so the terminal-state
  check is a plain function a fold ticket calls with whatever state value the response
  it's already handling contains. Backend enum mirrored 1:1 in
  `shared/models/travel-session-state.model.ts` (numeric values — `System.Text.Json`
  serializes the enum as a number).
- `ConfirmDialogComponent` (`shared/components/confirm-dialog/`) — standalone,
  Tailwind-only, title/message/confirm/cancel inputs+outputs, no variants. Also
  dismisses on Escape and backdrop click (frontend/CLAUDE.md's design-system rules
  require keyboard navigation support on interactive UI).
- `ErrorNotificationService` — `.notify(message)` over a `Subject<string>` exposed as
  `errors$`; no interceptor involved, matching the map's note that per-call `catchError`
  stays as the error-detection point.

Verified: `npm run test` (44/44 passing), `tsc --noEmit`, and `ng build --configuration
production` all clean. Wiring these into the four pages is F05-F08's job, not this
ticket's — nothing here touches a page component.
