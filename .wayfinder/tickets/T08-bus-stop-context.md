# [wayfinder:grilling] Bus Stop Context data model & source/verification metadata

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none (~~[Core Phase 1 data model schema](T03-core-data-model.md)~~ and ~~[Choose bus-stop imagery source](T02-stop-imagery-source.md)~~ both closed — see resolutions: no imagery source, text-only via OSM)
**Blocks:** [Full Phase 1 API contract](T09-api-contracts.md)

## Question

PROPOSAL.md section 14 requires showing (where available) a stop photo, surrounding
area photo, road side, crossing points, nearby landmarks/buildings, and nearby BTS/MRT
— each tagged with source, last-updated date, and verification status (official vs.
community — though community reports are Phase 2/out of scope here, the schema should
at least reserve a `source` field that could later hold that distinction without a
breaking change).

Given the source(s) resolved in
[Choose bus-stop imagery source](T02-stop-imagery-source.md), define:

- `StopImage`/`StopLandmark` concrete schema — fields, how they relate to `BusStop`,
  and how attribution (if the chosen source requires it) is carried through to the API
  response so the frontend can render required credit text.
- What happens for a `BusStop` with no available imagery/landmark data — Phase 1 must
  degrade gracefully (text-only road-side/crossing info) rather than error, per
  PROPOSAL.md section 25 (Graceful Degradation).
- Whether landmark data is free-text, structured (type: crossing/skywalk/mall-entrance/
  landmark, per section 15's walking-guidance warnings list), or both.

## Resolution

**No `StopImage` table for Phase 1.** Per [T02](T02-stop-imagery-source.md)'s finding
(no imagery source clears the licensing bar), there is zero Phase 1 consumer for a
photo entity — creating one now would be dead schema per CLAUDE.md's "no dead code"
rule. Deferred to CONTEXT.md's fog list; adding it later is a pure addition, no rework
of `BusStop` or anything else.

**`StopLandmark` schema:**
- `Id` (PK), `BusStopId` (FK)
- `LandmarkType` (enum: `Crossing`, `Skywalk`, `MallEntrance`, `Landmark`,
  `TransitStationPointer` — covering PROPOSAL.md section 15's walking-guidance warning
  list) — lets the frontend pick an icon/treatment by type without parsing text.
- `NameTh`, `NameEn` (string)
- `Description` (text, nullable) — free-text fallback for anything that doesn't map
  cleanly to a `LandmarkType` value, so OSM data is never silently dropped for not
  fitting the enum; not used to drive any display logic, only shown as-is.
- `DistanceMeters` (int, approx. distance from the `BusStop`)
- `ExternalOsmId` (string, OSM node/way id — natural key for upsert on re-sync)
- `UpdatedAt` (datetime — surfaces PROPOSAL.md section 14's "date updated"
  requirement)

**Verification status:** not a per-record field for Phase 1 — every `StopLandmark` row
is implicitly "Official" (sourced from OSM, the only source per T02), since
crowdsourced `UserReport` data is Phase 2/out of scope. Revisit adding a
`VerificationStatus` enum only when a second (community) source actually exists.

**OSM ODbL attribution:** a single **app-wide static credit line** ("© OpenStreetMap
contributors", reachable from an About/Data Sources screen) satisfies the license —
not stored per-record. Unlike Mapillary (rejected in T02), OSM's ODbL doesn't require
per-item attribution.

**Sync:** landmark data is fetched via the Overpass API, batched by `BusStop`
coordinates, and upserted by `ExternalOsmId` — on the **same weekly job** as the GTFS
sync (T03), not a separate schedule, to avoid maintaining two sync cadences for
marginal benefit.

**Graceful degradation:** a `BusStop` with zero `StopLandmark` rows simply shows none —
no error, no placeholder text implying data should exist.

Feeds [T09](T09-api-contracts.md): the bus-stop-context endpoint response shape.
