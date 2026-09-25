# Research: Route-map visualization for T16

Ticket: [T16-route-map-visualization.md](../tickets/T16-route-map-visualization.md)
Date: 2026-09-25

## Scope

Research only. No application code or `RouteShape` entity was added in this step.

The research answers the T16 questions using the current Namtang GTFS source, current
project stack, and current map/routing provider terms. The repo's pre-rewrite
React+Vite history was not consulted.

---

## 1. Namtang GTFS: does `shapes.txt` exist?

**Yes. Confirmed.**

The current Namtang GTFS is available from OTP at:

- https://namtang-api.otp.go.th/download/namtang-gtfs.zip

Transitland's current feed record identifies the same producer URL and lists the
feed as GTFS with CC BY 4.0 licensing and the required attribution:
"Office of Transport and Traffic Policy and Planning, Thailand."

A recent feed version contains:

- `routes.txt`: 2,077 rows
- `trips.txt`: 4,689 rows
- `stops.txt`: 17,084 rows
- `stop_times.txt`: 161,326 rows
- `shapes.txt`: 3,903,089 rows / about 155 MB
- `shapes.txt` columns: `shape_id`, `shape_pt_lat`, `shape_pt_lon`,
  `shape_pt_sequence`

The GTFS `trips.txt` records include `shape_id`, so the geometry is associated
with trips rather than directly with `BusRoute` or `Direction`.

Sources:

- Transitland feed: https://www.transit.land/feeds/f-th~namtang
- Transitland recent feed version:
  https://www.transit.land/feeds/f-th~namtang/versions/b9fd6bb0497d7cce8860206f6ea5f5cfb56b5d3c
- Mobility Database official feed record:
  https://mobilitydatabase.org/feeds/gtfs/mdb-1831

Mobility Database also currently reports that the official feed has Shapes as a
supported feature and covers roughly 2,069 routes.

### Finding

The original T16 fallback of "stops-only map" is **not required for bus route
geometry**. The feed already provides explicit shape geometry.

However, this does not prove that every shape is equally good or that every
route/direction has a single clean shape. The feed is large and shape selection
still needs to be normalized when importing into BusNavigate's domain.

---

## 2. Shape quality, density, and gaps

The available feed metadata proves substantial geometry coverage, but it does
**not** provide a reliable per-route quality score or a report of geometric
gaps.

The most recent feed snapshot found contains approximately 3.9 million shape
points for 4,689 trips. This is enough density to conclude that the source is
not merely a sparse "connect the stops with straight lines" dataset.

A third-party validation snapshot of Namtang published July 2026 reported:

- 0 GTFS specification errors
- 9,500 warnings
- warnings included "fast travel between consecutive stops" and "fast travel
  between far stops"

Those warnings are schedule/stop plausibility warnings, not direct proof that
the shape geometry is broken. Therefore they should **not** be treated as a
geometry-quality failure.

### Important implementation implication

Do not send the raw `shapes.txt` geometry to the browser.

The source is roughly 155 MB in one recent snapshot. The backend should resolve
the appropriate shape for the selected direction/trip and return only the
geometry needed by the map, preferably simplified/generalized for the current
zoom.

The exact relationship should be verified during design/import:

`Trip -> shape_id -> Shape points`

rather than assuming:

`BusRoute -> one shape`

or:

`Direction -> one shape`

because GTFS itself associates `shape_id` with `trip_id`.

Source:

- https://busmaps.com/en/thailand/Traffic-Policy-Planning/namtang

This third-party source is used only as evidence of the reported validation
warnings; the official/Transitland feed remains the source of record.

---

## 3. Map library: Leaflet vs MapLibre GL JS

### Leaflet

Leaflet is an open-source JavaScript mapping library focused on mobile-friendly
interactive maps. Its API directly supports the primitives T16 needs:
markers, polylines, popups and map interaction.

Relevant characteristics:

- simple DOM-based integration
- straightforward polyline rendering
- works with raster tile providers
- small client footprint
- does not force a particular tile provider
- BSD-2-Clause license

Sources:

- https://leafletjs.com/
- https://leafletjs.com/reference
- https://leafletjs.com/examples/quick-start/
- https://github.com/Leaflet/Leaflet

### MapLibre GL JS

MapLibre GL JS is an open-source TypeScript/WebGL map renderer designed around
vector tiles and style documents.

Relevant characteristics:

- WebGL rendering
- vector-tile-first architecture
- richer styling/layer capabilities
- useful when the app needs large dynamic vector datasets or sophisticated
  map styling
- 3-Clause BSD license

Sources:

- https://maplibre.org/maplibre-gl-js/docs/
- https://github.com/maplibre/maplibre-gl-js

### Fit with the current frontend

The current frontend is Angular + Tailwind with Angular Router/HttpClient and
no additional state-management library. T16 only needs a basemap, route
polylines, stop markers, walking segments, and current-position display.

**Research conclusion:** Leaflet has the smaller integration surface for the
Phase 1 requirement. MapLibre is technically viable, but its WebGL/vector-tile
model adds complexity that is not currently required by the feature.

This is a design recommendation from this research, not an implementation
decision yet.

---

## 4. Basemap/tile provider research

### OpenStreetMap standard tiles

The standard `tile.openstreetmap.org` service is not a production commercial
tile service for BusNavigate.

OSMF requires visible attribution, correct tile URL, identification, caching,
and prohibits bulk downloading/prefetch/offline use. OSMF also states that the
standard tile service is best-effort and may block inappropriate usage.

The OSM Foundation FAQ explicitly distinguishes free OSM data from the
organization's map tiles and says the map tiles are not intended as a
commercial tile service.

Sources:

- https://operations.osmfoundation.org/policies/tiles/
- https://osmfoundation.org/wiki/Licence_and_Legal_FAQ

**Conclusion:** Do not make the public OSM standard tile server the production
dependency for this app.

### MapTiler

Current Cloud pricing lists:

- Free: $0, suitable for testing/personal/non-commercial use
- Free limits: 5k sessions/month and 100k API requests/month
- Flex: $30/month, with 25k sessions/month and 500k API requests/month included
- extra usage is billed

Source:

- https://www.maptiler.com/cloud/pricing/

**Conclusion:** technically suitable, but the free tier is explicitly
non-commercial. Production commercial use would need a paid plan or another
provider.

### Mapbox

Current Mapbox pricing for Mapbox GL JS uses map loads. The current public
pricing page lists:

- up to 50,000 web map loads/month: free
- above that: metered pricing
- map interaction after initialization does not create another map load within
  the session

Mapbox GL JS v2+ is also governed by Mapbox's product terms rather than the
old BSD-only licensing model.

Sources:

- https://www.mapbox.com/pricing
- https://docs.mapbox.com/mapbox-gl-js/guides/pricing/
- https://github.com/mapbox/mapbox-gl-js

**Conclusion:** viable, but creates a stronger vendor/account dependency than
an open-source renderer plus an interchangeable OSM-derived basemap.

### OpenFreeMap

OpenFreeMap currently offers a public OSM-derived vector-tile instance:

- no API key
- no stated request/map-view limit
- commercial use explicitly allowed
- self-hosting is supported
- attribution is required
- no SLA/personalized support is currently offered

Source:

- https://openfreemap.org/

**Conclusion:** attractive for Phase 1 cost and licensing, especially with
MapLibre. The lack of SLA means the app should keep the basemap provider
configurable and avoid coupling domain logic to this provider.

### CARTO

CARTO's current Basemaps terms (updated 23 September 2026) allow commercial
free usage up to 1 million tile requests/month, with visible
OpenStreetMap + CARTO attribution. Above that, the current commercial
basemap plan is $500/month for up to 10 million tile requests/month.

Sources:

- https://www.carto.com/basemaps/
- https://www.carto.com/legal/basemap-terms/

**Conclusion:** technically strong and provides both Leaflet raster tiles and
MapLibre vector styles, but the current commercial pricing above 1M requests
is materially more expensive than the Phase 1 budget is likely to require.

---

## 5. Walking-path rendering / road snapping

A straight line from the user's location to a stop is visually simple but does
not represent the path a person actually walks. If the product requirement is
"show me how I walk to the boarding stop", road-based routing is preferable.

However, the routing provider must be treated as a separate dependency from
the bus route shape data.

### OpenRouteService

The public API currently has a standard free plan with daily/minute limits,
including:

- Directions: 2,000/day, 40/minute
- Snap: 2,000/day, 100/minute

It also supports foot routing and a Snap endpoint. Higher limits require
self-hosting or another plan arrangement.

Sources:

- https://openrouteservice.org/restrictions/
- https://staging.openrouteservice.org/plans/

### GraphHopper

Current pricing lists a free plan, but its free plan is for non-commercial use.
Commercial plans currently start at €69/month for 5,000 credits/day. Its APIs
include Routing and Map Matching.

Source:

- https://www.graphhopper.com/pricing/

**Conclusion:** GraphHopper's free tier should not be assumed for a commercial
production app.

### OSRM public/demo servers

OSRM is open source and can be self-hosted. Its public/demo infrastructure is
not an appropriate production dependency for an end-user commercial app:
the demo service is best-effort, subject to usage restrictions, and access can
be withdrawn.

Sources:

- https://github.com/Project-OSRM/osrm-backend
- https://github-wiki-see.page/m/Project-OSRM/osrm-backend/wiki/Api-usage-policy

### Walking-path research conclusion

For Phase 1, the safest architecture is to make walking geometry an
**optional routing result**, not part of the GTFS `RouteShape` model.

If no routing provider has been selected/budgeted yet:

1. show the transit route shape from GTFS;
2. show walking endpoints/markers;
3. use a simple dashed straight connector as a clearly approximate fallback;
4. do not present the straight connector as an actual walking route.

A later routing ticket can replace that connector with road-following geometry
without changing the bus route-shape model.

---

## 6. Preliminary design implications

The research supports an additive geometry model, but the exact entity shape
should be decided in the design phase.

Recommended conceptual separation:

- **Transit route geometry:** sourced from Namtang GTFS `shapes.txt`
- **Walking geometry:** produced by a routing service or approximate fallback
- **Basemap:** independently configurable provider
- **Map renderer:** independently configurable frontend library

For the transit geometry, avoid assuming one permanent geometry per
`BusRoute`. GTFS uses `shape_id` at trip level. The import/design should
identify which shapes are shared by trips and how they map onto the existing
`Direction`/service model.

A likely low-cost domain approach is still an additive `RouteShape` /
`RouteShapePoint` representation, but this should be finalized after checking
the current BusNavigate import model and determining whether shape selection
belongs to `Direction`, `Trip`, or a normalized shape reference.

---

## 7. Research decision summary

| Question | Finding |
|---|---|
| Does Namtang publish `shapes.txt`? | **Yes** |
| Is geometry detailed enough to avoid stop-to-stop straight lines? | **Yes, source contains millions of shape points** |
| Is geometry quality proven perfect? | **No; no per-route quality report was found** |
| Should Phase 1 fall back to stops-only for bus routes? | **No, not by default** |
| Should raw shape data be sent to browser? | **No; resolve + simplify server-side** |
| Leaflet vs MapLibre | **Leaflet fits current Phase 1 needs more directly** |
| OSM standard tile server for production | **No** |
| MapTiler free tier | **Not for commercial production** |
| Mapbox | **Viable, metered and vendor-dependent** |
| OpenFreeMap | **Potential low-cost option; no SLA** |
| CARTO | **Viable; current commercial limits/pricing need consideration** |
| Walking path | **Separate routing concern; don't conflate with RouteShape** |
| Straight walking line | **Acceptable only as explicitly approximate fallback** |
| Routing service required for first map ticket? | **Not required to prove transit route geometry; decide separately for walking UX** |

## Next step

T16 should now move to the **design decision** phase rather than implementation.

The design pass should inspect the current BusNavigate GTFS import/domain model
and answer:

1. how `shape_id` should be normalized;
2. whether `RouteShape` belongs to Direction, Trip, or is independently
   referenced;
3. the minimal API contract for returning simplified map geometry;
4. exactly which of trip-planning, travel-session, and recovery need a map in
   Phase 1;
5. whether Phase 1 will use Leaflet + a configurable OSM-derived basemap;
6. whether walking paths are straight approximate connectors for Phase 1 or
   require a separately budgeted routing service.

No production implementation should start until those design choices are
recorded in T16.
