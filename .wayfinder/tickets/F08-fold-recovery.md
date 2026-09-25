# [wayfinder:task] Fold recovery into production

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** closed
**Blocked by:** [Recovery confirmation mechanism](F01-recovery-confirmation-mechanism.md),
[Shared frontend infrastructure](F02-shared-frontend-infrastructure.md),
[App shell & navigation](F03-app-shell-navigation.md),
[Loading & error UI patterns](F04-loading-error-ui-patterns.md)
**Blocks:** none

## Question

Fold [T15](T15-recovery-ui-layout.md)'s winning Variant C (tiered urgency stack) into
`recovery-home.component`; drop Variants A/B and the `?variant=` switcher. Wire it to
the real backend instead of `prototype/prototype-mock-data.ts`:

- Read the `TravelSession` id from the route (`/recovery/:id`, per
  [F03](F03-app-shell-navigation.md)).
- Options → `POST /travel-sessions/{id}/recovery`.
- Each confirmable option (`Kind = BusDirection`) gets a "เลือกอันนี้" action, through
  `ConfirmDialogComponent`, firing the new `ConfirmedRecovery` event from
  [F01](F01-recovery-confirmation-mechanism.md) (carrying the option's `DirectionId`/
  `BoardingStopId`), then navigating to `/travel-session/:id`.
- `Kind = UnconfirmedRailPointer` options get no confirm action at all — purely
  informational, per T15's original design (already matches the prototype).
- Apply the loading-skeleton/error-banner patterns from
  [F04](F04-loading-error-ui-patterns.md).

## Resolution

Implemented and integrated the recovery flow into production:

- Folded Variant C (tiered urgency stack) into the production recovery screen and removed Variants A/B plus the prototype mock-data flow.
- Wired recovery to the real backend using `POST /travel-sessions/{id}/recovery`.
- Confirmable `BusDirection` options use `ConfirmDialogComponent` and emit `ConfirmedRecovery`, carrying direction, boarding stop, and alighting stop information before navigating to the travel session.
- `UnconfirmedRailPointer` remains informational and has no confirm action.
- Added loading skeleton and error-banner handling.
- Fixed recovery state application so the returned `TravelSession` reloads its boarding/alighting stop navigations.
- Fixed recovery to update the alighting stop together with the new direction and boarding stop, preventing stop/direction mismatch.
- Added in-trip route-number display and hid the remaining-stop count when it reaches zero.
- Added regression/component coverage for the recovery flow and related travel-session behavior.
- Validation completed successfully: backend tests 103/103 passed, backend build succeeded, and frontend tests/build succeeded.

Commits:
- `6341599 feat: complete travel recovery flow`
- `e48a9e0 chore: track Serena project configuration`
