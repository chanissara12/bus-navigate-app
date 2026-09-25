# [wayfinder:grilling] Route-map visualization

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open
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

_(not yet resolved)_
