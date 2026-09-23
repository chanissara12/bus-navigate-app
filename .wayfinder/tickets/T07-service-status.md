# [wayfinder:grilling] Service Status (TransitAlert) data model & status rules

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none (~~[Core Phase 1 data model schema](T03-core-data-model.md)~~ closed — note: T03's resolution flags that Namtang's static GTFS export has no alert/status feed, so this ticket must identify a separate source or default to always-`Unknown`)
**Blocks:** [Full Phase 1 API contract](T09-api-contracts.md)

## Question

PROPOSAL.md section 11 requires clearly distinguishing service states: Normal, Delayed,
Temporarily Suspended, Not Operating Today, Route Changed, Cancelled, Unknown — and
explicitly requires distinguishing "no service today" from "route cancelled
permanently" since they drive different user decisions.

Given whatever the data source from
[Choose transit data source](T01-transit-data-source.md) actually publishes for service
status, define:

- `TransitAlert`'s concrete schema (which `BusRoute`/`Direction` it attaches to, status
  enum matching the table above, effective date range, free-text description if the
  source provides one).
- How "Not Operating Today" (a `ServiceException`/`ServiceCalendar` fact — no scheduled
  `Trip` today) is distinguished at the API/data layer from "Cancelled" (a `TransitAlert`
  status) — these come from different entities per
  [CONTEXT.md](../../CONTEXT.md) and must not collapse into one field the frontend can't
  tell apart.
- What happens when the data source simply doesn't publish live status at all for a
  route (`Unknown` case) — confirm this degrades to `DataConfidence: Unknown`, not a
  guess.
- Whether this is a scheduled poll/sync of the source's status feed, or computed
  on-demand per request — constrains but doesn't decide
  [Full Phase 1 API contract](T09-api-contracts.md).

## Resolution

**No automatic status feed exists.** Verified directly against Transitland's feed
record for Namtang (`f-th~namtang`): it lists only a static GTFS download URL, no
GTFS-Realtime (service alerts/trip updates/vehicle positions) endpoint. `TransitAlert`
is therefore a **manual, human-curated table** — someone enters a record when they
learn of a disruption (e.g. from BMTA's public Facebook/announcements, DLT notices,
news), not something ingested automatically. Considered and **rejected**: auto-
generating draft alerts by diffing successive weekly GTFS syncs (e.g. flagging a route
that disappeared as "possibly cancelled") — rejected because a route can vanish from a
sync for reasons other than real cancellation (the DGA-style open-data license already
flags that government feeds can be suspended/changed without notice per T01's
research), and confidently asserting "Cancelled" on a data blip is a worse outcome than
having no status at all, violating the proposal's own safety principle (section 25:
never guess, disclose uncertainty instead). A route disappearing from the feed is
already handled safely by the base data model with no extra mechanism: it simply stops
appearing in trip-planning results — a silent gap, not a false claim.

**Default when no `TransitAlert` record exists for a Route/Direction:** `Normal` with
`DataConfidence: Scheduled` — the schedule data itself comes from a credible source
(OTP), so "no known issue reported" reasonably reads as "scheduled, not verified live,"
not "unknown." This default holds even if the manual table is never populated at all —
the feature is safe to ship under-curated or uncurated; it simply provides no extra
signal beyond the schedule in that case, never a wrong one.

**"Not Operating Today" vs. "Cancelled" — separated at the schema/API level, not
collapsed into one status field:**
- "Not Operating Today" is **not** a `TransitAlert` — it's a computed fact from
  `ServiceCalendar`/`ServiceException` (closed in [T03](T03-core-data-model.md)): no
  `Trip` scheduled for today.
- "Cancelled" (permanent) is an actual `TransitAlert` record, manually entered.
- The API must expose these as distinct fields so the frontend never conflates "no
  service today" with "route gone for good."

**`TransitAlert` schema:**
- `Id` (PK)
- `BusRouteId` (FK, nullable — set when the alert applies to the whole route)
- `DirectionId` (FK, nullable — set when the alert applies to only one direction, e.g.
  a one-way diversion)
- `Status` (enum: `Delayed`, `TemporarilySuspended`, `RouteChanged`, `Cancelled`)
- `Description` (text, nullable)
- `EffectiveFrom` (datetime), `EffectiveTo` (datetime, nullable if end date unknown)
- `CreatedAt`, `UpdatedAt` (datetime, for basic audit trail of manual entries)

Feeds [T09](T09-api-contracts.md): the service-status query endpoint, and the
API-contract decision to return `NotOperatingToday` and `TransitAlert`-derived status
as separate response fields, never merged.
