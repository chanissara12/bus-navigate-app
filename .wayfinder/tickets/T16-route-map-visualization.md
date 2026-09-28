# [wayfinder:grilling] Route-map visualization

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none
**Blocks:** none (a future fold/implementation ticket, once this resolves)

## Question

Graduating map.md's "Not yet specified" item: should Phase 1 draw the bus route /
walking path on an actual map (trip-planning results, travel-session tracking,
recovery options), and if so, how?

**Explicitly do not consult or reference this repo's pre-rewrite history** (the old
React+Vite MVP's map feature, e.g. commits around `1ff345f`/`d1d4022`/`776f614`) — build
this decision from current requirements and current data only, not as a port of that
implementation.

Needs both research and design decisions:

- **Research (do this first — capture findings under `.wayfinder/research/`, same
  pattern as [T01](T01-transit-data-source.md)/[T02](T02-stop-imagery-source.md)):**
  - Does the Namtang GTFS feed ([T01](T01-transit-data-source.md)'s chosen source)
    actually publish `shapes.txt` (route geometry)? Confirm against the live feed, not
    assumption — T01's research file doesn't mention it.
  - If yes: what's actually in it (per-trip or per-route shapes, point density, any
    gaps/known-bad geometry for Bangkok routes)?
  - If no: what's the fallback — no route-line rendering (stops-only map), or deriving
    an approximate line from ordered `RouteStop` coordinates (straight segments, not
    road-following)?
  - Map rendering choice: what's actually usable for a public Bangkok-focused app —
    tile provider licensing/cost (OSM tile usage policy, Mapbox/MapTiler free-tier
    limits at expected traffic), and a library choice for Angular (e.g. Leaflet vs.
    MapLibre GL) that fits `frontend/CLAUDE.md`'s stack (no new state-management
    library, Tailwind-first UI).
  - Walking-path rendering (trip-planning's walk-to-stop / recovery's walk segments):
    confirm whether this needs road-snapping (as the old MVP had) or can be a straight
    line — depends on whether a routing/snapping service is in budget/scope at all.
- **Design decisions, once research answers the above:**
  - Data model: an additive `RouteShape` entity (or equivalent) — confirm it doesn't
    require touching `BusRoute`/`Direction`/`RouteStop`/`Trip` per map.md's existing
    assessment that this is low-cost to retrofit.
  - Which of the three fold pages (trip-planning, travel-session, recovery) actually
    need it for Phase 1's destination, vs. deferring some to a later ticket.
  - UI placement — inline vs. full-screen, per this project's existing `/prototype`
    workflow if a real layout decision is needed (same process as T12-T15).

## Resolution

Research findings: [.wayfinder/research/route-map-visualization.md](../research/route-map-visualization.md)
(Namtang GTFS does publish `shapes.txt` — 3.9M points across 4,689 trips, keyed by
`shape_id` at the `trip_id` level; Leaflet recommended over MapLibre GL for Phase 1's
simpler needs; OpenFreeMap recommended as the default basemap; walking-routing
providers all carry real cost/licensing constraints). Design decisions below were
reached via grilling on top of that research, per this repo's usual process.

**Scope:** all three fold pages need it, not just one — `trip-planning`,
`travel-session`, and `recovery`. Each gets a map card showing the relevant route(s);
this widens the destination beyond the single-page pattern F05-F08 each used, but the
three pages share one map component/API surface, so it's one implementation effort,
not three.

**Data model:** shape geometry attaches to `Direction`, not `Trip` — despite GTFS
associating `shape_id` with `trip_id`, both `TravelOption` and `RecoveryOption` already
key off `DirectionId`, and `Direction` already has a "pick the most-common value among
its trips" dedup pattern for `Headsign` (`UpsertDirectionsAsync`); the same pattern
applies to `shape_id`. Stored as a plain `RouteShapePoint`-style entity (ordered
`DirectionId`/`Sequence`/`Latitude`/`Longitude` rows) — no PostGIS/NetTopologySuite;
nothing else in the schema uses a spatial type, and nothing in this requirement (render
a line on a map) needs one. Points are simplified once at import time (fixed-tolerance
Douglas-Peucker, ~10-20m) rather than per-request/per-zoom — matches Phase 1's existing
bias toward fixed, non-adaptive behavior over live vehicle tracking or ETA computation.

**GTFS shapes import is its own service, not folded into `GtfsImportService`, and is
triggered automatically, not manually.** `shapes.txt` is ~155MB / 3.9M rows against a
feed where every other file is under 165K rows — importing it inline would put a large,
untested load on `GtfsImportService.ImportAsync`, which has already broken production
once (a duplicate-agency-key crash, fixed separately). Instead: a new service (e.g.
`IRouteShapeImportService`) runs as a third step in
`WeeklyDataSyncBackgroundService.RunSyncAsync`, in its own `try/catch` exactly like the
existing GTFS-import → landmark-sync sequence (same pattern T08 already established:
reuse the one weekly job, don't add a new schedule). That third step first does a cheap
version/hash check against the feed (Transitland already exposes a versioned feed URL
per the research) and only runs the actual 3.9M-row import when the version actually
changed — so it's both automatic (no one has to remember to trigger it) and cheap on
every run where nothing changed.

**API contract:** a new `GET /api/v1/directions/{id}/shape` endpoint (no
`DirectionsController` exists yet) returning the simplified point list — a separate
resource, not embedded in `TravelOption`/`RecoveryOption`/`TravelSessionResponse`,
fetched lazily only when a map is actually shown, keeping those list responses from
growing for users who never open a map.

**Basemap/library:** Leaflet, with the tile/style provider URL configuration-driven
(same pattern as `StopLandmarkSync:OverpassUrl`) defaulting to OpenFreeMap (no API key,
commercial use allowed, no SLA — acceptable for Phase 1, swappable to CARTO or
self-hosted later via config alone if OpenFreeMap's lack of SLA becomes a problem).

**Walking path:** rendered as a clearly-labeled approximate dashed connector, not a
real routed/road-snapped path — every routing provider researched (OpenRouteService,
GraphHopper, OSRM) has either a non-commercial free tier or a real metered/self-hosted
cost, which is a budget decision out of this ticket's scope. A future ticket can
replace the connector with real routing without touching the `RouteShapePoint` model.

**Amendment:** the dashed connector should bias through a known road-crossing point
when one exists, using data already in the database — no new provider/cost involved.
`StopLandmark` (F06/T08) already stores `LandmarkType.Crossing` and `Footbridge`
points near each stop, sourced from Overpass. When drawing the connector between the
user's position and a boarding stop, check that stop's already-fetched landmark list
for a `Crossing`/`Footbridge` point that plausibly lies between the two ends (i.e.
routing through it isn't a large detour); if one exists, render a 2-segment dashed
line (user → landmark → stop) instead of a single straight segment; otherwise fall
back to the direct line. Still labeled as approximate either way — this is a waypoint
bias using existing point data, not real road-snapped routing, and doesn't change the
"no routing provider in this ticket" decision above. The exact detour-ratio threshold
for "plausibly between" is an implementation detail, not decided here.

**Live user position:** all three pages show a live-updating "you are here" marker via
a new `GeolocationService.watchPosition()` method (the existing `getCurrentPosition()`
stays as-is for flows that only need a one-shot read, e.g. the initial recovery-options
request) — consistent UX across all three maps, purely client-side, not related to
(and not blocked by) the explicitly out-of-scope Phase 2/3 "real-time vehicle
tracking."

**Per-page UI shape (decided at the design level; exact layout still goes through this
project's `/prototype` workflow before implementation, same as T12-T15):**
- **trip-planning & recovery:** one persistent map card pinned above the results list,
  not a per-card collapsible/accordion. Tapping a result card (a new interaction,
  separate from trip-planning's existing "เริ่มเดินทาง" button / recovery's existing
  "เลือกอันนี้" confirm action) reloads the map's route line in place — one Leaflet
  instance reused via `setLatLngs()`/`fitBounds()`, not destroyed and recreated per
  selection. Defaults to the first recommended option shown immediately on load, no
  empty state.
- **travel-session:** shown immediately, no expand/collapse interaction needed — it's
  the only card on the page, so there's no multi-instance cost to avoid. Shows only the
  session's route + the live user-position marker; no additional passed-stop
  highlighting in this ticket (deferred — `RemainingStopCount` from the existing
  progress endpoint could feed that later without any new backend work).

**Explicitly out of scope / deferred, not decided here:**
- Real road-following walking routes (needs a budgeted routing provider).
- Passed/remaining-stop highlighting on the travel-session map.
- The exact visual layout of each map card (goes through `/prototype`, not decided by
  grilling).

**Not yet done:** no code written. A future fold/implementation ticket picks this up —
covers the `RouteShapePoint` entity + migration, `IRouteShapeImportService` +
`WeeklyDataSyncBackgroundService` wiring, `DirectionsController`, the shared Leaflet map
component, and the three pages' integration.
