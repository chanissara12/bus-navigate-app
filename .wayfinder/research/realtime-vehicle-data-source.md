# [wayfinder:research] Real-time vehicle position data source

**Parent map:** [Phase 2 Spec - Public Transit Decision & Recovery Assistant](../map-phase2.md)

**Status:** closed (resolved by research agent)
**Blocked by:** none
**Blocks:** none

## Resolution

**Verdict:** No public real-time Bangkok bus source currently clears the ticket's commercial-use and data-contract bar. Keep Namtang as the static/schedule source, but do not model Phase 2 `RealtimeVehicle` as available until OTP or an operator grants access to a real-time feed.

### Namtang / OTP

Namtang's current open-data page says its maintained datasets are released as Open Data under **Creative Commons CC-BY** and lists parking, transit stops/stations, and transit-operation data. It does not list a GTFS-Realtime VehiclePosition or TripUpdate feed.

Namtang's about page says the application internally links public-bus vehicle-position data under the Department of Land Transport and supports BMTA, Thai Smile Bus and other bus systems. That describes Namtang's data connections, not a public real-time API/feed.

Sources:
- https://namtang-api.otp.go.th/opendata
- https://namtang-api.otp.go.th/about

Transitland currently identifies `f-th~namtang` as a **GTFS** source for Bangkok operators, including BMA and BMTA; it does not identify a GTFS-RT companion feed. No Bangkok/Namtang GTFS-RT feed was found in the investigated MobilityData/Transitland registry results.

Therefore the CC-BY license is sufficient for the static Namtang data already used by Phase 1, but it does **not** establish permission to consume an unpublished/private real-time endpoint.

### Third-party alternatives

**ViaBus: not cleared.** Its Terms state that application data, including location and maps/pictures, are protected IP owned by ViaBus and prohibit users from attempting to collect ViaBus-created location, maps or pictures "for any whatsoever purpose unless permitted in writing from ViaBus."

Source: https://www.viabus.co/terms/

**Transitland/MobilityData: not a new realtime source.** Transitland's Bangkok records point to `f-th~namtang` as GTFS. A catalog/mirror does not create a commercial license for a separate live feed, and the investigated record does not expose Bangkok VehiclePosition/TripUpdate data.

### Trip correlation

No public Bangkok/Namtang GTFS-RT feed was found, so there is **no verified `VehiclePosition.trip.trip_id` correlation** to report. Namtang's statement that it connects to vehicle-position data is not enough to infer that an external consumer receives `trip_id`, `route_id`, `direction_id`, or raw coordinates.

Do not design Phase 2 around an assumed trip attachment. Keep realtime vehicle linkage optional until an actual feed contract is obtained.

### ETA / arrival prediction

Because no public GTFS-RT feed was verified, neither real-time VehiclePosition nor GTFS-RT TripUpdate/stop ETA should be assumed available. Phase 2 basic real-time ETA remains blocked by data access.

### Follow-up

If Phase 2 needs live positions, pursue an **official access request/partnership with OTP, DLT, BMTA, or the relevant operator** asking for VehiclePosition, TripUpdate/ETA, update frequency, route/direction identifiers, trip_id semantics, historical/caching rights, rate limits, attribution, and explicit commercial-use permission.

Full research: [realtime-vehicle-data-source.md](../research/realtime-vehicle-data-source.md)
