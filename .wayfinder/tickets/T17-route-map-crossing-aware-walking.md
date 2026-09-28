# [wayfinder:fold] T17 route-map crossing-aware walking connector

**Parent:** [T16-route-map-visualization](T16-route-map-visualization.md)

**Status:** closed
**Blocks:** none

## Scope

Implement the late T16 amendment that makes the approximate walking connector prefer a
known road-crossing or footbridge/skywalk point near the boarding stop when that point
does not create a large detour.

The existing T16 route-map implementation is already present in this repository. This
ticket only adds the missing crossing/footbridge waypoint behavior and the minimum
landmark-coordinate plumbing needed to use the existing StopLandmark data.

## Resolution

- Persist Overpass landmark latitude/longitude on StopLandmark and expose them through
  BusStopContextResult.
- Keep using the existing StopLandmark data source; no new provider or routing service.
- Treat LandmarkType.Crossing and LandmarkType.Skywalk as crossing candidates.
- When drawing the user-to-boarding-stop dashed connector, choose a candidate that lies
  plausibly along the direct segment and keeps the total two-segment distance within a
  fixed detour ratio.
- Render user -> crossing -> boarding stop when a candidate qualifies; otherwise keep
  the direct dashed connector.
- Keep the connector explicitly approximate; this is not road-snapped routing.

## Implementation completed

- Added `Latitude` / `Longitude` to `StopLandmark` so the existing Overpass landmark data can be used as map waypoints.
- Updated `StopLandmarkSyncService` to persist landmark coordinates during synchronization.
- Exposed landmark coordinates through `StopLandmarkInfo` and `BusStopContextService` / `BusStopContextResult` for frontend map use.
- Updated the frontend stop-landmark model to carry landmark coordinates.
- Updated `RouteMapCardComponent` to evaluate nearby `Crossing` / `Skywalk` landmarks when drawing the user-to-boarding-stop walking connector.
- Added plausibility checks using projection onto the user-to-stop segment and a fixed detour-ratio threshold, so a crossing is only used when it provides a reasonable waypoint.
- Added the two-segment dashed connector (`user -> crossing -> boarding stop`) with fallback to the direct connector when no suitable crossing exists.
- Added live GPS position/accuracy handling used by the map while testing the crossing-aware walking flow, including position smoothing and protection against implausible GPS jumps.
- Applied the database migration for landmark coordinates: `20260925104234_AddStopLandmarkCoordinatesV2`.
- Confirmed the crossing-aware map rendering after the landmark-coordinate migration resolved the earlier missing blue route-segment issue.
- Manual verification against real synced landmark data (BusStopId 14765, "เทอร์มินอล 21 พระราม 3") showed the connector did bend correctly, but the chosen crossing candidate sat only ~13m from the stop — a valid low-detour choice, but visually indistinguishable from a straight line. Changed `findPlausibleCrossing()`'s selection from lowest detour ratio to largest perpendicular offset from the direct line (still capped by the existing detour-ratio filter), so the connector visibly bends toward the crossing instead of picking whichever candidate happens to add the least distance.

## Verification

- Backend service build: passed.
- Frontend production build: completed successfully.
- Existing backend test suite currently has one unrelated pre-existing failure in
  RouteShapeImportServiceTests.ImportAsync_SameFeedVersion_SkipsExpensiveShapeDownload
  (CsvTable.SplitLines NullReferenceException); this ticket does not change that test.

## Commit

- `25d7097` fix(route-map-card): select crossing waypoint by perpendicular distance
- `2802001` feat(bus-stop): persist and expose stop landmark coordinates
