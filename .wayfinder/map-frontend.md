# [wayfinder:map] Frontend Build-out — Real Backend Integration

**STATUS: CHARTED** — destination and full ticket set decided via grilling
(2026-09-24); no ticket resolved yet.

## Destination

The four Angular pages — `trip-planning`, `bus-stop`, `travel-session`, `recovery` —
**working for real** against the live backend, not the throwaway prototypes. Concretely:
the T12-T15 winning UI variants are folded into production (losing variants and the
`?variant=` switcher removed), every page is wired to real HTTP calls (no more mock
data), the four pages are connected by a real cross-page user journey (plan a trip →
create a `TravelSession` → track it → recover from a wrong bus if needed), backed by
device identity and session persistence, with the wrong-bus recovery backend gap
(`MISBOARDED` had no exit) fixed. Reaching the destination means a rider can actually
plan, track, and recover from a trip end-to-end in the running app — this map's
Destination is itself an executable outcome, not another spec document (see Notes).

## Notes

- Domain glossary: [CONTEXT.md](../CONTEXT.md) — read before working any ticket. Just
  updated (2026-09-24) with the RecoveryOption confirmability clarification.
- Parent spec: [Phase 1 Spec — Public Transit Decision & Recovery Assistant](map.md)
  (STATUS: COMPLETE, 15 tickets) — its data model, API contracts, module boundaries,
  and UI-layout choices (T12-T15) are locked inputs here, not up for debate, **except**
  where a ticket below explicitly reopens one (see T04/T06/T09 gap fixed by
  [Recovery confirmation mechanism](tickets/F01-recovery-confirmation-mechanism.md)).
- **Execution override**: unlike the parent map, tickets here are not decision-only.
  Every ticket's answer is already known from the grilling session that charted this
  map (2026-09-24) — resolving a ticket means *doing* the work (folding code, wiring
  API calls, writing the backend change), not deciding what to do. Still resolve
  one ticket per session per the usual rule, and still record the resolution
  (what was actually built/changed) on close.
- Frontend conventions: [frontend/CLAUDE.md](../frontend/CLAUDE.md) (Jest tests, Tailwind-only
  styling, loading-indicator classification rules, RxJS/OnPush rules).
- Backend conventions: [backend/CLAUDE.md](../backend/CLAUDE.md) (XUnit/Moq, explicit
  constructors, `ValidateException` for business-rule rejections).
- Call `/prototype` for [Loading & error UI patterns](tickets/F04-loading-error-ui-patterns.md)
  — the one remaining "what should it look like" question. Everything else was settled
  structurally during grilling, not visually.
- Standing decisions from charting (apply across all tickets unless a ticket says
  otherwise):
  - Navigation: persistent bottom-tab nav, 3 tabs — trip-planning ("ค้นหาเส้นทาง"),
    bus-stop ("ป้ายรถ"), travel-session ("การเดินทางของฉัน"). `recovery` is **not** a
    tab — reached only via a CTA from travel-session's `MISBOARDED` state.
  - Routing: `travel-session`/`recovery` carry a `TravelSession` id as a route param
    (`/travel-session/:id`, `/recovery/:id`); missing id or a backend 404 redirects to
    `/trip-planning`. No ad-hoc/session-less recovery — that case degrades to a normal
    trip-planning search, so it needs no new capability.
  - Session lifecycle: tapping a trip-planning result card never creates a
    `TravelSession` by itself — an explicit "เริ่มเดินทาง" (start trip) button, inline
    on the same list-first card, fires `POST /travel-sessions`. The active session id
    persists in `ActiveSessionService` (localStorage-backed), auto-clearing on
    `COMPLETED`/`ABANDONED` — no separate trip-summary screen (T14's existing
    "ถึงจุดหมายแล้ว" card state already covers that moment).
  - Device identity: `DeviceIdentityService` generates a `crypto.randomUUID()` on
    first run, persists it in localStorage, read by an HTTP interceptor that attaches
    `X-Device-Id` to every request. Separate from `ActiveSessionService` (different
    lifecycle: device id is permanent, session id is per-trip) even though both share
    one localStorage helper.
  - State-transition controls: `travel-session`'s single-status-card (T14 Variant A)
    gets one real action button whose label changes with the current state ("ถึงป้าย
    แล้ว" → "ขึ้นรถแล้ว" → "ลงรถแล้ว"), firing `POST /travel-sessions/{id}/events`.
    Every state-changing action (this button, `ReportedWrongBus`, and the new
    `ConfirmedRecovery`) goes through one shared, generic `ConfirmDialogComponent`
    first — backend transitions are one-way with no undo, so a mis-tap must be
    catchable before it fires.
  - Error handling: keep the existing per-call `catchError` pattern (it knows
    call-site context for a good message) and add it a shared `ErrorNotificationService`
    that every catch block reports to; the error-banner UI (from the prototype ticket)
    subscribes to that one service. No global HTTP-error interceptor — interceptors
    are for context-free cross-cutting concerns like the device-id header, not error
    translation.
  - Recovery confirmation (new backend capability, see
    [F01](tickets/F01-recovery-confirmation-mechanism.md)): confirming a `BusDirection`
    `RecoveryOption` updates the session's `Direction`/`BoardingStopId` (destination
    unchanged) and transitions `MISBOARDED` → `WALKING_TO_STOP`, except when the
    option's `IsCurrentBus` is true, which goes straight to `RIDING` (nothing about the
    route changed). `UnconfirmedRailPointer` options are never confirmable — purely
    informational, matching Phase 1 having no rail routing/schedule data.

## Decisions so far

_(none yet — this map was just charted)_

## Not yet specified

- Whether `bus-stop` should be deep-linkable from a stop mentioned in trip-planning's
  results (e.g. tap a stop name in a `TravelOption` card → jump to that stop's
  `bus-stop` detail with it highlighted). Explicitly deferred during charting — not
  needed for the standalone `bus-stop` tab to work, but a plausible fast-follow once
  the four pages are wired for real and this stops being guesswork.

## Out of scope

- Ad-hoc/session-less recovery (checking "am I on the right bus" without ever having
  planned a trip via `trip-planning`) — ruled out during charting: functionally
  identical to a normal `POST /travel-options` search once you remove the "compare
  against an existing session" framing, so it doesn't need a new capability; it needs
  the user routed to `trip-planning` instead of a `recovery`-shaped answer.
