# [wayfinder:research] Choose bus-stop imagery & landmark source

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed (resolved by research agent)
**Blocked by:** none
**Blocks:** [Bus Stop Context data model](T08-bus-stop-context.md)

## Question

PROPOSAL.md section 14 ("Bus Stop Context") and section 24's Phase 1 list require
showing verified/official stop photos, surrounding-area photos, road-side info,
crossings, and nearby landmarks — see `StopLandmark`/`StopImage` in
[CONTEXT.md](../../CONTEXT.md), scoped to Phase 1 as officially-sourced/verified content
only (user-submitted photos are Phase 2's `UserReport`, out of scope here).

What source(s) should supply this imagery/landmark data for Phase 1— e.g. Official
Transit Data (if the source chosen in
[Choose transit data source](T01-transit-data-source.md) includes it), OpenStreetMap
(street-level imagery/POI tags), Google Street View Static API, Mapillary, or another
provider?

**Same diligence bar as T01:**

1. Confirm the imagery/data license permits display inside a commercial-facing consumer
   app (not just "viewable in a browser").
2. Quote or link the specific license/ToS clause supporting the intended use
   (e.g. OSM's ODbL share-alike implications for derived data vs. raw display; Google
   Street View Static API's ToS restrictions on caching/storage; Mapillary's CC-BY-SA
   terms).
3. Note any attribution requirements — these need to surface in the UI/data contract
   (feeds into [Bus Stop Context data model](T08-bus-stop-context.md)).
4. If no source can be found that's both usable and affordable/free for Phase 1,
   report that explicitly rather than picking a source that doesn't clearly clear the
   bar — "Bus Stop Context" can degrade gracefully to text-only (road side, crossing
   description) without photos if no compliant image source exists.

## Resolution

**Recommendation:** No imagery source clears the bar for Phase 1. Bus Stop Context should
degrade to **structured text-only data** for Phase 1 — road side, crossing/pedestrian-bridge
description, and named nearby landmarks/BTS-MRT proximity — with `StopImage` (photos)
deferred to a later phase. Use **OpenStreetMap POI/landmark tags** (ODbL, with the
"Produced Work" exception covering display in the app without forcing the app itself
open-source) as the source for the landmark/crossing text, each carrying `source`,
`updated date`, and `verification status` per CONTEXT.md's `StopLandmark` model.

**Rationale:** Every street-level-imagery candidate fails at least one hard requirement
for a commercial consumer product: Google Street View Static API's ToS forbids caching
or storing imagery beyond a panorama/place ID (incompatible with a durable "verified
stop photo" record); Mapillary's commercial use is gated by a Meta-controlled
commercial-terms carve-out plus re-identification/privacy safeguard obligations that are
disproportionate for an MVP; KartaView has a clean CC-BY-SA license but essentially no
Bangkok bus-stop coverage; and no official Thai government or BMTA-published stop
photography/landmark dataset exists on data.go.th or the MOT data catalog. OSM's POI
data, by contrast, is free, has decent central-Bangkok coverage, and (via ODbL's
Produced Work exception) can be displayed with attribution alone, without any
share-alike obligation on the app's own code or proprietary BusStop data.

**Full research:** [.wayfinder/research/stop-imagery-source.md](../research/stop-imagery-source.md)
