# [wayfinder:task] Recovery confirmation mechanism (backend)

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** open
**Blocked by:** none
**Blocks:** [Fold recovery into production](F08-fold-recovery.md)

## Question

Discovered while charting: `POST /travel-sessions/{id}/recovery` only computes
`RecoveryOption[]` candidates — it never mutates the `TravelSession`, and
`TravelSessionService`'s transition dictionary has **zero edges out of `MISBOARDED`**
except the 2-hour stall auto-`ABANDONED`. Picking a recovery option today does
nothing. Fix this per the map's Notes:

- Add `TravelSessionEventType.ConfirmedRecovery`.
- Transition table: `MISBOARDED` + `ConfirmedRecovery` → `WALKING_TO_STOP` when the
  confirmed option's `Kind` is `BusDirection` and `IsCurrentBus` is false (update
  `Direction`/`BoardingStopId`, leave `AlightingStopId` unchanged); → `RIDING` directly
  when `IsCurrentBus` is true (nothing about the route changed, no walk needed).
- Add nullable `DirectionId`/`BoardingStopId` to the `RecoveryOption` ViewModel
  (populated only for `Kind = BusDirection`) — it currently has no identifying field
  at all, so the frontend has no way to tell the backend which option was picked.
- `Kind = UnconfirmedRailPointer` options stay unconfirmable — reject
  `ConfirmedRecovery` against one (no rail routing/schedule data exists to hand the
  session off to in Phase 1).
- Follows T09's "one events endpoint, not per-action endpoints" convention — this is a
  new event on the existing `POST /travel-sessions/{id}/events`, not a new endpoint.

## Resolution

_(not yet resolved)_
