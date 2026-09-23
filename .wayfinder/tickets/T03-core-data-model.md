# [wayfinder:grilling] Core Phase 1 data model schema

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open (unclaimed)
**Blocked by:** [Choose transit data source](T01-transit-data-source.md)
**Blocks:** ["Can I take this bus?" comparison algorithm](T05-can-i-take-this-bus.md), [Wrong-bus recovery algorithm](T06-wrong-bus-recovery.md), [Service Status data model](T07-service-status.md), [Bus Stop Context data model](T08-bus-stop-context.md)

## Question

Given the transit data source chosen in
[Choose transit data source](T01-transit-data-source.md), define the concrete Phase 1
data model (EF Core entities, fields, relationships, keys) for: `BusRoute`,
`Direction`, `Trip`, `RouteStop`, `BusStop` (with its own `roadSide`), `ServiceCalendar`,
`ServiceException`, and the `DataConfidence` shared value (Realtime/Estimated/
Scheduled/Unknown) — per the definitions already locked in
[CONTEXT.md](../../CONTEXT.md).

Specifically resolve:

- How the source data's native schema (GTFS or whatever T01 picked) maps onto these
  entities — field-by-field, noting any gaps the source doesn't cover.
- Primary/foreign key strategy consistent with `BusNavigate.Domain`'s EF Core
  `DbContext` conventions.
- How `ServiceCalendar`/`ServiceException` represent recurring vs. one-off schedule
  variation, matching whatever the source data actually provides.
- Whether seeding/import of source data into the DB is a one-time load, a scheduled
  sync job, or on-demand — note this constrains but doesn't decide
  [Full Phase 1 API contract](T09-api-contracts.md).

## Resolution

(pending)
