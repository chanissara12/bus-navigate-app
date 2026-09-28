# Handoff: T17 Route Map Crossing-Aware Walking

## Ticket

- Ticket: `T17-route-map-crossing-aware-walking`
- Parent: `T16-route-map-visualization`
- Status: **closed**
- Commits:
  - `25d7097` fix(route-map-card): select crossing waypoint by perpendicular distance
  - `2802001` feat(bus-stop): persist and expose stop landmark coordinates
  - `bc05a24` docs: close T17 crossing-aware walking connector

## Objective

Complete the late T16 amendment for the approximate walking connector from the user's current GPS position to the boarding stop.

The connector should prefer a known road crossing or footbridge/skywalk near the boarding stop when that waypoint is plausibly on the user's path and does not create a large detour. If no suitable landmark exists, keep the direct dashed connector.

This remains an **approximate map visualization**, not road-snapped pedestrian routing.

## Implementation completed

### Backend

- Added `Latitude` / `Longitude` to `StopLandmark`.
- Updated `StopLandmarkSyncService` to persist coordinates from the existing Overpass landmark data.
- Exposed landmark coordinates through:
  - `StopLandmarkInfo`
  - `BusStopContextService`
  - `BusStopContextResult`
- No new landmark provider or routing service was introduced.
- Crossing candidates are based on the existing landmark types:
  - `LandmarkType.Crossing`
  - `LandmarkType.Skywalk`
- Applied migration:
  - `20260925104234_AddStopLandmarkCoordinatesV2`

### Frontend

- Updated the stop-landmark model to include latitude/longitude.
- Updated `RouteMapCardComponent` to:
  - inspect nearby Crossing/Skywalk landmarks;
  - project candidates against the direct user-to-boarding-stop segment;
  - reject implausible candidates;
  - apply a fixed detour-ratio threshold;
  - draw `user -> crossing -> boarding stop` when a suitable crossing exists;
  - fall back to the direct dashed connector otherwise.
- The connector remains explicitly approximate and is not road-snapped.
- GPS handling used during map testing was also improved:
  - high-accuracy geolocation options;
  - displayed GPS accuracy/status;
  - first GPS fix is retained even when accuracy is initially poor;
  - poor later fixes can be ignored;
  - implausible GPS jumps are filtered;
  - recent positions are smoothed using accuracy-weighted averaging.

## Important files

- `frontend/src/app/shared/components/route-map-card/route-map-card.component.ts`
- `frontend/src/app/shared/services/geolocation.service.ts`
- `backend/BusNavigate.Domain/Entities/StopLandmark.cs`
- `backend/BusNavigate.Domain/ViewModels/BusStop/StopLandmarkInfo.cs`
- `backend/BusNavigate.Service/Implements/BusStop/StopLandmarkSyncService.cs`
- `backend/BusNavigate.Service/Implements/BusStop/BusStopContextService.cs`
- `.wayfinder/tickets/T17-route-map-crossing-aware-walking.md`
- `backend/BusNavigate.Domain/Database/Migrations/20260925104234_AddStopLandmarkCoordinatesV2.cs`

## Verification

- Backend service build: **passed**.
- Frontend production build: **passed**.
- Existing backend test suite still has one unrelated pre-existing failure:
  - `RouteShapeImportServiceTests.ImportAsync_SameFeedVersion_SkipsExpensiveShapeDownload`
  - failure is a `CsvTable.SplitLines` NullReferenceException.
- The landmark-coordinate migration was applied successfully.
- After the migration, the earlier missing blue route-segment issue was resolved and the crossing-aware map rendering was confirmed.
- Mobile testing through the development tunnel produced GPS accuracy around ±29 m and the displayed position was on the correct side of the road. Actual walking movement testing has not yet been performed.

## Current state

T17 is complete and closed. Manual verification against real synced landmark data
(BusStopId 14765, "เทอร์มินอล 21 พระราม 3") found that the connector bent correctly but
the chosen crossing candidate sat only ~13m from the stop, making the bend visually
indistinguishable from a straight line. `findPlausibleCrossing()`'s candidate selection
was changed from lowest detour ratio to largest perpendicular offset from the direct
line (still capped by the existing detour-ratio filter), so the connector now visibly
bends toward the crossing. All three commits above are in the repo.

## Suggested next step

None outstanding for T17. Movement/on-foot GPS testing mentioned in Verification above
was still not performed as of closing — pick that up separately if it becomes relevant.
