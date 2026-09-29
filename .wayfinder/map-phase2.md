# [wayfinder:map] Phase 2 Spec — Public Transit Decision & Recovery Assistant

**STATUS: COMPLETE** — of the original eight PROPOSAL.md section 24 items, seven were
ruled out of scope after investigation (see Out of scope below for why each); only
**Accessibility Preference** was actually specified, and it's closed.

## Destination

A locked spec — data model, API contracts, and frontend/backend module boundaries —
for the **Phase 2** items chosen from PROPOSAL.md section 24. Same shape as
[Phase 1's destination](map.md) — ready to hand to implementation, no UI/wireframe
design included.

## Notes

- Domain glossary: [CONTEXT.md](../CONTEXT.md) — read before working any ticket.
  Phase 2 terms sharpened during charting: `RealtimeVehicle`, `RouteDeviation`,
  `UserPreference`.
- Parent spec: [Phase 1 Spec](map.md) (STATUS: COMPLETE, 15 tickets) — its data model,
  API contracts, module boundaries, and standing decisions are locked inputs here, not
  up for debate, except where a ticket below explicitly reopens one.
- Frontend build-out: [Frontend Build-out — Real Backend Integration](map-frontend.md)
  (STATUS: COMPLETE) — its [T16](tickets/T16-route-map-implementation.md)/
  [T17](tickets/T17-route-map-crossing-aware-walking.md) already implemented route-map
  and crossing-aware-walking visualization. That work happened outside this formal
  Phase 2 charting effort (chartered under the frontend map instead); acknowledged
  here, not re-ticketed.
- No separate ADR docs for this effort — decisions recorded directly in ticket
  bodies/resolutions and gisted here, same convention as map.md.
- Standing decisions from charting (apply across all tickets unless a ticket says
  otherwise):
  - `UserPreference` always **re-ranks**, never hard-filters, `TravelOption`/
    `RecoveryOption` — preserves Phase 1's "never collapse to one answer" rule across
    every ticket. The one existing hard exclusion (walk-budget reachability) is a
    physical constraint, not a preference, and stays as-is.
  - `RouteDeviation` (the Dynamic-Route-Change signal) never auto-writes `TransitAlert`
    — `TransitAlert` stays human-curated only, preserving
    [T07](tickets/T07-service-status.md)'s rejection of GTFS-diff auto-detection.
    `RouteDeviation` is delivered only as a Proactive Notification to the riders
    currently on/waiting for that specific vehicle.
  - Proactive Notification is scoped to **Web Push only** — this architecture has no
    native app (`ClientApp/` is Angular web only per `BusNavigate/BusNavigate.WebApi/ClientApp/CLAUDE.md`).

## Decisions so far

- [Real-time vehicle position data source](tickets/P01-realtime-vehicle-data-source.md):
  No public Bangkok/Namtang real-time feed clears the commercial-use bar — Namtang's
  open-data page lists no GTFS-RT VehiclePosition/TripUpdate companion feed,
  Transitland lists `f-th~namtang` as GTFS only, and ViaBus's Terms prohibit collecting
  its location/maps/pictures without written permission. No verified `trip_id`
  correlation or ETA feed exists to design against. Recommended follow-up: an official
  access request/partnership with OTP, DLT, BMTA, or the relevant operator.
- [Revisit bus-stop imagery/OCR source](tickets/P02-revisit-imagery-ocr-source.md):
  **A (stored imagery):** Mapillary now documents all images under CC-BY-SA (permits
  commercial use with attribution/ShareAlike) — a material change from T02 — but API/
  commercial-terms and comprehensive Bangkok bus-stop coverage are still unverified, so
  `StopImage` stays optional, not a Phase 2 prerequisite; text-only fallback stands.
  **B (on-the-fly OCR/vision):** Google Cloud Vision supports Thai OCR and a separate
  Landmark Detection API; Tesseract (Apache-2.0, Thai trained data) is the self-hosted
  fallback; Azure Vision also supports Thai OCR; AWS Textract is not suitable for Thai.
  Recommended start: Google Cloud Vision OCR, benchmarked against real Bangkok
  bus-stop photos, with Tesseract as fallback.
- [Accessibility Preference (UserPreference) design](tickets/P03-accessibility-preference.md):
  Scoped down to three weighted/ordinal preferences only — `MINIMIZE_WALKING`,
  `MINIMIZE_TRANSFERS`, `AVOID_STREET_CROSSING` — none are a hard exclusion; "no
  stairs," "need ramp," and "prefer simpler routes" dropped from scope entirely.
  `AVOID_STREET_CROSSING` is a best-effort heuristic reusing T08's existing
  `StopLandmark` `Crossing`/`Skywalk` types near the boarding/alighting stop (no new
  data-model ticket needed). One `UserPreference` record per `User`, set via
  `PUT /users/me/preferences`. Preference matches add a `PREFERENCE_MATCH` factor code
  to `Reason` (visible, not a silent sort). For `RecoveryOption`, reordering stays
  within a single T15 urgency tier, never crosses tiers.

- [Mapillary API/commercial terms & Bangkok bus-stop coverage](tickets/P04-mapillary-api-coverage.md):
  **Corrected after initial resolution** — the Terms of Use page is public (no login
  needed); direct read of section 12 confirms commercial use is permitted for
  "development of ... applications" (plausibly covers BusNavigateApp), with a real
  operational obligation (anti-reidentification safeguards + incident notification to
  Meta). Attribution: CC-BY-SA image credit + visible Mapillary link. Rate limit:
  ~50,000 tile requests/day per app ID. **But Section 5 separately bans using
  Mapillary "with any products, systems, or applications for or in connection with
  real-time navigation or route guidance"** — which is this app's entire Destination.
  Whether showing one static reference photo inside a navigation-purposed app falls
  inside that ban is genuinely ambiguous and not something research can resolve; it
  needs an actual legal judgment call. Bangkok bus-stop-level coverage also remains
  unconfirmed (only general Bangkok/Thailand coverage is documented).

## Out of scope

- **Bus Stop Photos (`StopImage`)** — Mapillary, the only source with a workable
  license (Street View forbids the caching a stored corpus needs; KartaView has
  essentially no Bangkok bus-stop coverage per T02), carries a Terms of Use clause
  (Section 5) banning use "with any ... application ... for or in connection with
  real-time navigation or route guidance" — a real risk for an app whose entire
  Destination is exactly that, not a fact further research resolves. Ruled out of
  scope rather than left pending a legal opinion this map isn't positioned to obtain;
  T02's text-only `StopLandmark` fallback (already shipped in Phase 1) stands as-is.

- **Dynamic Route Change (RouteDeviation detection/design) and Proactive Notification
  (Web Push subscription + trigger wiring)** — [P01](tickets/P01-realtime-vehicle-data-source.md)
  found no public real-time vehicle-position feed clears the commercial-use bar; the
  recommended follow-up (an official access request/partnership with OTP, DLT, BMTA, or
  the relevant operator) was **declined** rather than pursued. Both items ruled out of
  this Phase 2 map's scope, not left as fog — they return only if a future map is
  chartered after real-time access is actually obtained.
- **OCR Bus Stop Sign** — [P02](tickets/P02-revisit-imagery-ocr-source.md) found a
  clear technical path (Google Cloud Vision Thai OCR, Tesseract fallback), but ruled
  out of scope by explicit choice rather than pursued as a design ticket.
- **Crowdsourced Reports (`UserReport`)** — held alongside the imagery-dependent items
  by charting-time choice, then ruled out of scope directly rather than resolved.
- **Landmark Recognition** — Google Cloud Vision's Landmark Detection API matches
  against Google's own global-landmark database, not a custom corpus, so it can't
  recognize an ordinary bus stop. A custom image-matching pipeline was considered as an
  alternative, but every external photo source hits a wall: Google Street View
  Static's ToS forbids the caching/storage a matching corpus requires, KartaView has
  essentially no Bangkok bus-stop coverage (per [T02](tickets/T02-stop-imagery-source.md)),
  and Mapillary's commercial terms/coverage remain unverified (per
  [P04](tickets/P04-mapillary-api-coverage.md)) — leaving only crowdsourced (cold-start
  problem, and `UserReport` itself is out of scope) or manual photo collection (an
  operational undertaking, not a design decision) as sources. Ruled out of scope.
- Phase 3 features per PROPOSAL.md section 24: Conversational AI Assistant, Advanced
  Computer Vision, Predictive Arrival, Personalized Travel Preference (beyond Phase 2's
  Accessibility Preference), Multi-modal Transit Recovery, Automatic Situation
  Detection. Carried over unchanged from [map.md](map.md)'s Out of scope.
- Full BTS/MRT route/schedule data — carried over from map.md's "Not yet specified":
  still deliberately un-ticketed, still its own future phase/effort, not folded into
  this Phase 2 map.
