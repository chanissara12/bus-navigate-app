# [wayfinder:research] Choose transit data source (routes/stops/schedule)

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed (resolved by research agent)
**Blocked by:** none
**Blocks:** [Core Phase 1 data model schema](T03-core-data-model.md), ["Can I take this bus?" comparison algorithm](T05-can-i-take-this-bus.md), [Wrong-bus recovery algorithm](T06-wrong-bus-recovery.md), [Service Status data model](T07-service-status.md)

## Question

What transit data source should BusNavigateApp's backend ingest for Bangkok bus
routes, directions, stops, and schedules (GTFS-style: `BusRoute`, `Direction`, `Trip`,
`RouteStop`, `BusStop`, `ServiceCalendar`, `ServiceException` per
[CONTEXT.md](../../CONTEXT.md))?

Candidates to investigate (not exhaustive): Thailand government open data
(data.go.th), ขสมก./BMTA open data or API, a GTFS feed if one exists for Bangkok,
ViaBus or other third-party transit apps' APIs, OpenStreetMap-derived route data.

**This decision requires high diligence, not just technical fit — verify:**

1. The data is legally usable for this product (a consumer-facing app, potentially
   commercial) — not just "publicly visible."
2. If it's an "open data" license, read the actual license text and confirm it permits
   this use case (attribution requirements, share-alike, non-commercial clauses,
   redistribution limits).
3. If it's a third-party API (ViaBus etc.), read their Terms of Service in full —
   confirm scraping/API use for a competing or overlapping product is not prohibited,
   check rate limits, and check whether the ToS requires a formal agreement/registration
   before commercial use.
4. Note any attribution, rate-limit, or caching requirements that will constrain the
   backend design (feeds into [Full Phase 1 API contract](T09-api-contracts.md)).

Do not recommend a source without quoting or linking the specific license/ToS clause
that supports "yes, this use is permitted."

## Resolution

**Recommended source:** Ingest the **Namtang GTFS feed**, published by
Thailand's Office of Transport and Traffic Policy and Planning (OTP/สนข.),
licensed under **CC BY 4.0** — pulled directly from OTP's open-data endpoint
(https://namtang-api.otp.go.th/opendata) or mirrored via Transitland
(Onestop ID `f-th~namtang`).

It is the only candidate that clears the ticket's diligence bar cleanly:
it's published by a government transport-planning agency (not scraped or
reverse-engineered from a third party), it's under a primary-source-verified
open license that explicitly permits commercial use with only an attribution
requirement (no share-alike, no non-commercial clause, no partnership
needed), it's actively maintained, and its stated coverage — every Bangkok
bus/van/suburban route, both directions, ordered stops, coordinates, and
service hours — maps directly onto the `BusRoute`/`Direction`/`RouteStop`/
`BusStop`/`Trip` domain model, including schedule data that OpenStreetMap
cannot provide and that BMTA/ViaBus do not offer without a formal
partnership neither exists today. The mandatory attribution ("Office of
Transport and Traffic Policy and Planning, Thailand") must be surfaced by
the downstream API contract ticket; OSM can serve as a secondary
stop-geometry cross-check but carries an ODbL share-alike obligation if
incorporated as a Derivative Database rather than used only for map display.

Full findings, quoted license/ToS clauses, and per-candidate verdicts:
[../research/transit-data-source.md](../research/transit-data-source.md)
