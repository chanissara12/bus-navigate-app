# Public Transit Decision & Recovery Assistant

Helps a public-transit rider (initially Bangkok buses) decide what to do next given their current real-world situation, not just where to go. Phase 1 scope: trip planning, stop identification, "can I take this bus instead?", wrong-bus/wrong-stop recovery, and service status — built on scheduled (not live-vehicle) data.

## Language

### Route structure

**BusRoute**:
A numbered bus line (e.g. "45"), the parent of all its Directions. Never carries stop-order or schedule data itself — those belong to Direction/Trip.
_Avoid_: Line, สาย (use BusRoute in code; "สาย" is the user-facing Thai term for it)

**Direction**:
One of the (usually two) ordered sequences of stops a BusRoute runs, identified by its destination-facing name (e.g. "→ Siam"). Owns the ordered `RouteStop` list for that direction. Road side is not guaranteed 1:1 with Direction (see RoadSide).
_Avoid_: ทิศทาง as a synonym for RoadSide — they are different concepts here

**Trip**:
One scheduled run of a Direction on a given service day, tied to a ServiceCalendar day-type. Pure immutable schedule data (departure times per RouteStop) — carries no live position and no delay/deviation data in Phase 1. All deviation and status information belongs to ServiceException / TransitAlert instead.
_Avoid_: Run, Service (Service is reserved for ServiceCalendar/ServiceStatus)

**RouteStop**:
The association of one BusStop to one Direction at a specific sequence position (stop #N along that Direction). This is where "which stops does this Direction serve, in what order" lives — not on BusStop itself.

### Places

**BusStop**:
A physical, official stop location (GPS position, name, stop code). Does not itself declare which Direction(s) it serves — that's derived from which Directions' RouteStop lists include it. A BusStop's RoadSide is a descriptive fact for display, not a hard 1:1 partition of Direction (loop/one-way routes can board both Directions from the same physical stop).
_Avoid_: Stop, ป้าย (ป้าย is the user-facing Thai term)

**RoadSide**:
Which side of the street a BusStop physically sits on. Correlated with Direction in the common case (opposite sides serve opposite directions) but not a hard rule — always check RouteStop membership, never infer Direction from RoadSide alone.

**Place**:
A generic named location (destination search result, landmark, POI) not itself a BusStop — e.g. "Siam", "Victory Monument". A Destination is a Place the user has selected as their trip's end point.

**StopLandmark / StopImage**:
Officially-sourced supporting context for a BusStop (nearby landmark, crossing point, official photo) shown to help the user physically recognize the stop. Phase 1 includes only officially-sourced landmarks/images; user-submitted photos are UserReport territory (Phase 2, out of scope for now).

### Travel state

**TravelSession**:
The live state of one in-progress trip attempt, starting the moment the user confirms a TravelOption (not when they board) and ending at arrival or abandonment. Spans walk-to-stop → wait → board → ride → alight, since wrong-bus recovery and get-off alerts must reason about all of those phases.
_Avoid_: Trip (Trip is scheduled-run data; TravelSession is the user's live journey)

**CurrentLocation**:
The system's best estimate of where the user physically is right now, which may be uncertain (see Data Confidence) — expressed as "between BusStop A and B" rather than a false-precision point when GPS/context is ambiguous.

**CurrentRoute**:
The BusRoute (and Direction/Trip if known) the user is currently believed to be riding, used as recovery input when they report being on the wrong bus.

### Recommendations

**TravelOption**:
One candidate way to get from CurrentLocation/BusStop to Destination: Route, Direction, Boarding Stop, Alighting Stop, Transfer Stops, Estimated Duration, Walking Distance, Waiting Time, Transfer Count, Service Status, Data Confidence, and Reason. Always presented as one of several options, never a single "best" answer.

**RecoveryOption**:
A TravelOption-shaped candidate generated specifically in response to a wrong-bus/wrong-stop/no-show situation, anchored at a RecoveryPoint rather than the user's original boarding stop.

**RecoveryPoint**:
A place the user can rejoin a workable route from their current situation — e.g. next stop, a transfer point, a nearby BTS/MRT station. Never assumed to be back at the original stop where things went wrong.

**Data Confidence**:
A shared provenance label (`Realtime` / `Estimated` / `Scheduled` / `Unknown`) attached to any time-sensitive fact (ETA, stop identification, service status) so the UI never presents an estimate as verified fact.

### Service status

**ServiceCalendar**:
The recurring weekly/day-type pattern a Trip runs under (e.g. weekday vs. weekend schedule).

**ServiceException**:
A dated override to ServiceCalendar for a specific Trip or Direction (e.g. no service on a public holiday).

**TransitAlert**:
A human-facing status flag for a BusRoute/Direction — one of Normal, Delayed, Temporarily Suspended, Not Operating Today, Route Changed, Cancelled, Unknown (see Section 11 of PROPOSAL.md). Phase 1 covers only scheduled/announced status, not live in-trip deviation detection (that's Dynamic Route Change, Phase 2).

## Out of scope for Phase 1 (fog, not modeled yet)

- **Vehicle / RealtimeVehicle** — live vehicle position; Phase 1 "Can I take this bus?" reasons from Trip schedule data only, no live tracking.
- **UserPreference** — accessibility/routing constraints; Phase 2.
- **UserReport** — crowdsourced corrections; Phase 2.
- Turn-by-turn **WalkingRoute** geometry — Phase 1 only needs a walking distance/time estimate on TravelOption, not turn-by-turn directions.
- OCR/photo-based stop or route recognition — Phase 2/3.
