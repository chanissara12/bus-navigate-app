# [wayfinder:research] Real-time vehicle position data source

**Parent map:** [Phase 2 Spec — Public Transit Decision & Recovery Assistant](../map-phase2.md)

**Status:** closed (resolved by research agent)
**Blocked by:** none
**Blocks:** none yet — resolving this unblocks the (not-yet-ticketed) Dynamic Route
Change / RouteDeviation design and the Proactive Notification (Web Push) design; both
stay fog on [map-phase2.md](../map-phase2.md) until this closes.

## Question

Phase 1's [Choose transit data source](T01-transit-data-source.md) selected the
**Namtang GTFS feed** (OTP/สนข., CC BY 4.0) — schedule-only, no live vehicle position.
Phase 2 needs a **RealtimeVehicle** data source (per [CONTEXT.md](../../CONTEXT.md)) to
power Dynamic Route Change detection and "can I take this bus?" with live ETAs.

Investigate:

1. Does Namtang/OTP publish a GTFS-Realtime feed (VehiclePosition, TripUpdate) as a
   companion to the schedule feed already ingested? Check the same endpoint family used
   by T01 (https://namtang-api.otp.go.th/opendata) and Transitland's listing for
   `f-th~namtang`.
2. If not, what other Bangkok bus real-time sources exist — BMTA's own systems, ViaBus
   or similar third-party apps' APIs, Longdo Traffic, any GTFS-RT feed indexed on
   Transitland or MobilityData's feed registry for Thailand.
3. Apply the **same diligence bar as T01**: confirm legal usability for a commercial
   consumer app (not just public visibility), read the actual license/ToS text, quote
   the specific clause that permits this use, and note any attribution/rate-limit/
   caching constraints.
4. Critically — **does the feed correlate a vehicle report to a specific Trip**
   (GTFS-RT `trip_id`), or does it only give Route+Direction+raw lat/lng with no Trip
   match? This determines whether RealtimeVehicle can be modeled as "attached to a
   Trip" or must be designed to work from raw position alone. Report this explicitly;
   don't assume either answer.
5. If real-time position exists but not real-time ETA/ArrivalPrediction, note that gap
   separately — Phase 2's "basic real-time ETA" ambition depends on which of these the
   feed actually provides.

Do not recommend a source without quoting or linking the specific license/ToS clause
that supports "yes, this use is permitted," matching T01's standard.

## Resolution

No public real-time Bangkok bus source currently clears the ticket's commercial-use and data-contract bar. Keep Namtang as the static/schedule source, but do not model Phase 2 `RealtimeVehicle` as available until OTP or an operator grants access to a real-time feed.

Namtang's open-data license is CC-BY, but no public GTFS-Realtime VehiclePosition/TripUpdate feed was found. Transitland lists `f-th~namtang` as GTFS, not GTFS-RT. ViaBus Terms restrict collecting its location/maps/pictures without written permission. There is therefore no verified public realtime `trip_id` correlation or ETA feed for BusNavigateApp.

Full findings: [realtime-vehicle-data-source.md](../research/realtime-vehicle-data-source.md).
