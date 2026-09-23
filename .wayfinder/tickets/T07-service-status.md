# [wayfinder:grilling] Service Status (TransitAlert) data model & status rules

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open (unclaimed)
**Blocked by:** [Core Phase 1 data model schema](T03-core-data-model.md)
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

(pending)
