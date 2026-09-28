# [wayfinder:fold] T16 route-map visualization implementation

**Parent:** [T16-route-map-visualization](T16-route-map-visualization.md)

**Status:** closed
**Blocks:** none

## Scope

Implement the closed T16 design without changing the existing trip-planning, recovery,
or travel-session API response contracts.

## Resolution

Implemented the shared route-map flow across all three Phase 1 pages:

- Added RouteShapePoint storage keyed by DirectionId + Sequence, with latitude/longitude columns and an EF migration.
- Added RouteShapeImportService as a separate GTFS shape-import service. It runs as the third step of WeeklyDataSyncBackgroundService, isolated in its own try/catch.
- Reused IGtfsFeedFetcher for a cheap HTTP feed-version check and a single trip + shape download when the feed version changes. The selected shape_id is the most-common value among trips in each Direction.
- Added fixed-tolerance Douglas-Peucker simplification at import time.
- Added GET /api/v1/directions/{id}/shape through a new DirectionsController and RouteShapeService.
- Added a shared Angular RouteMapCardComponent using Leaflet with OpenFreeMap's configurable style URL. The Leaflet instance is reused while the selected direction changes.
- Added live GPS updates through GeolocationService.watchPosition(); the existing one-shot getCurrentPosition() flow remains unchanged.
- Trip-planning and recovery use one persistent map card above their result lists. Tapping a result card changes the map selection independently of the existing confirmation/start buttons.
- Travel-session shows its map immediately after the session loads, with the route and live user-position marker.
- Walking connectors are dashed straight-line approximations only; no routing provider was added.
- Added backend tests for shape selection, simplification, and feed-version gating, plus frontend geolocation watch tests.

The exact visual card styling remains intentionally minimal and should be refined through the project's prototype workflow if a separate visual-design pass is needed.

## Verification

- Backend tests: 105 passed, 0 failed.
- Backend server build: passed.
- Frontend tests: 112 passed, 0 failed.
- Frontend production build: passed.
- git diff --check: passed; Git reported existing line-ending normalization warnings for edited files.

No git commit was created.
