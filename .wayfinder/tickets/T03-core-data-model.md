# [wayfinder:grilling] Core Phase 1 data model schema

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none (~~[Choose transit data source](T01-transit-data-source.md)~~ closed — resolved to the Namtang GTFS feed, CC BY 4.0)
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

Source: Namtang GTFS (see [T01](T01-transit-data-source.md)) — standard GTFS files
(`agency.txt`, `routes.txt`, `trips.txt`, `stops.txt`, `stop_times.txt`, `calendar.txt`,
`calendar_dates.txt`). GTFS has no native `Direction` entity (it's a `direction_id`
flag + `trip_headsign` on trips) and no `RoadSide` field at all — both required
derivation/decisions below.

### Entities (`BusNavigate.Domain`)

**BusRoute**
- `Id` (int, internal PK)
- `ExternalRouteId` (string, GTFS `route_id`, unique-indexed — natural key for upsert)
- `ShortName`, `LongName` (string)
- `AgencyName` (string, from `agency.txt`)
- `DataSource` (string constant, e.g. `"NamtangGTFS"`), `ImportedAt` (datetime) — for the
  CC BY 4.0 attribution obligation and staleness tracking.

**Direction** — kept **coarse**: one row per `(route_id, direction_id)`, not one per
stop-pattern variant. A short-turn/express trip is represented as a `Trip` with fewer
`TripStopTime` rows, not a separate Direction — matches CONTEXT.md's framing of
Direction as "one of the (usually two) ways a route runs," which is how riders think
about it, not GTFS pattern variants.
- `Id` (PK), `BusRouteId` (FK)
- `ExternalDirectionKey` (string, `{route_id}-{direction_id}`, unique-indexed)
- `DirectionIndex` (int, GTFS `direction_id`, 0/1)
- `Headsign` (string, from `trip_headsign` — most common value among the group's trips)

**RouteStop** — the canonical, superset ordered stop list for a Direction (the union of
all stops any trip in that Direction visits, in sequence order); individual Trips
reference a subset via `TripStopTime`.
- `Id` (PK), `DirectionId` (FK), `BusStopId` (FK)
- `SequenceNumber` (int)

**BusStop**
- `Id` (PK)
- `ExternalStopId` (string, GTFS `stop_id`, unique-indexed)
- `NameTh`, `NameEn` (string — Namtang provides both), `StopCode` (string, nullable)
- `Latitude`, `Longitude` (decimal)
- `RoadSide` (nullable enum, default `Unknown`) — **no Phase 1 population mechanism**;
  GTFS has no such field and Phase 1 has no curation tooling. This does not compromise
  boarding-direction correctness: which stop to board at for a given destination is
  already fully determined by **Direction membership** (which Direction's `RouteStop`
  list contains this `BusStop`), never by `RoadSide`. `RoadSide` is purely a descriptive/
  orientation aid; ship it honestly as `Unknown` rather than guess via a bearing
  heuristic. Mitigate the "how do I recognize the physical stop" need instead via exact
  GPS pin + OSM-sourced landmark text (T08), which are more reliable orientation aids
  than a compass-side label anyway.

**Trip** — pure immutable schedule identity.
- `Id` (PK), `DirectionId` (FK), `ServiceCalendarId` (FK)
- `ExternalTripId` (string, GTFS `trip_id`, unique-indexed)

**TripStopTime** — join entity carrying actual per-trip times; separate from
`RouteStop` (which only holds canonical order, not times).
- `Id` (PK), `TripId` (FK), `RouteStopId` (FK)
- `ArrivalTime`, `DepartureTime` (**`TimeSpan`, not `TimeOnly`**) — GTFS times can exceed
  `24:00:00` for trips continuing past midnight; `TimeOnly` wraps at 24h and would
  silently corrupt such trips. Decided on GTFS-spec-conformance grounds (this is a
  general GTFS convention, not Namtang-specific) rather than by inspecting the current
  feed contents — low-cost to support correctly regardless of whether today's snapshot
  happens to contain any such trips.

**ServiceCalendar**
- `Id` (PK), `ExternalServiceId` (string, GTFS `service_id`, unique-indexed)
- `Monday`..`Sunday` (bool each), `StartDate`, `EndDate` (date)

**ServiceException**
- `Id` (PK), `ServiceCalendarId` (FK)
- `ExceptionDate` (date), `ExceptionType` (enum: `Added`, `Removed` — GTFS
  `calendar_dates.exception_type` 1/2)

`TransitAlert` and `DataConfidence` are **not** part of this schema — `TransitAlert` is
[T07](T07-service-status.md)'s concern (Namtang's static GTFS export has no alert/status
feed; T07 must identify a separate source or define this as always-`Unknown` for
Phase 1). `DataConfidence` is a shared response-shaping value, not a stored table.

### Import/sync strategy

A **scheduled recurring background job** (matching T01's weekly re-fetch
recommendation), not a one-time seed or manual admin trigger — manual re-import tends to
quietly stop happening after launch, letting schedule data go stale. The job **upserts**
by each entity's `External*Id` (natural GTFS key) so internal PKs and foreign keys stay
stable across re-imports rather than churning on every run.

### Open follow-on (not blocking this ticket, flagged for later)

If Namtang's stop names turn out to encode directional/cross-street hints in
`stop_name` text, that could opportunistically improve `RoadSide` display later —
not a Phase 1 mechanism, no heuristic built now.
