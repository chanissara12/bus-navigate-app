# [wayfinder:research] Choose bus-stop imagery & landmark source

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** claimed (research agent, branch `research/stop-imagery-source`)
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

(pending)
