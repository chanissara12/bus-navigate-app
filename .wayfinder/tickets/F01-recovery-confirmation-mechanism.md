# [wayfinder:task] Recovery confirmation mechanism (backend)

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** closed
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

Built per spec, plus one field the ticket assumed already existed:

- `TravelSessionEventType.ConfirmedRecovery` added.
- `TravelSessionService.ApplyConfirmedRecovery` handles it separately from the fixed
  `(State, Event) -> State` `Transitions` table, since its target state depends on the
  confirmed option's data, not just the current state: `MISBOARDED` only; `IsCurrentBus`
  true → `RIDING` untouched; otherwise requires `DirectionId`/`BoardingStopId` → updates
  them and moves to `WALKING_TO_STOP` (`AlightingStopId` untouched either way).
- `RecoveryOption` gained `DirectionId`/`BoardingStopId` **and** `IsCurrentBus` — the
  ticket's transition rule reads like `IsCurrentBus` already existed on the ViewModel,
  but it didn't exist anywhere in the codebase before this change (only an implicit
  `DistanceMeters == 0` signal did). Without a real field there's no way to implement
  the described branch, so it was added alongside the two the ticket named explicitly.
  All three are populated only for `Kind = BusDirection` in `RecoveryService`;
  `BoardingStopId` is null for the current-bus candidate itself (supplied directly, not
  discovered via the nearby-stop search).
- `UnconfirmedRailPointer` rejection is implicit, not a `Kind` check: that kind of
  option has no `DirectionId`/`BoardingStopId` to send in the first place, so it always
  fails the same "missing DirectionId/BoardingStopId" validation as a malformed
  request. The exception message calls this out explicitly so it doesn't read as a
  generic validation failure.
- Wire shape: `ConfirmedRecoverySelection` (`DirectionId`, `BoardingStopId`,
  `IsCurrentBus`) added as an optional field on the existing
  `TravelSessionEventRequest` — still one events endpoint, no new route, per T09's
  convention.

Verified: `dotnet build`, `dotnet test` (100/100, 8 new), `dotnet format
--verify-no-changes` all clean. Reviewed via `/code-review` (Standards + Spec) — no
hard violations; one judgement call (the rejection-by-omission above) addressed by
clarifying the exception message.
