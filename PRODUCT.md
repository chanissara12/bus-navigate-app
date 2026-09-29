# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: the developer/owner themselves, as a Bangkok bus rider — a single-user personal tool, not a multi-tenant public product. The situational trigger is real-world transit not matching the plan: boarded the wrong bus, got off at the wrong stop, the intended bus never came. The user needs to know what they can do *right now*, not just a static route.

## Product Purpose

Helps a public-transit rider (Bangkok buses, Phase 1) decide what to do next given their current real-world situation — trip planning, stop identification, "can I take this bus instead?", wrong-bus/wrong-stop recovery, and service status — built on scheduled (not live-vehicle) data. See [PROPOSAL.md](PROPOSAL.md) and [CONTEXT.md](CONTEXT.md) for full requirements and domain language.

## Positioning

Not "an app that tells you the route from A to B," but an assistant that understands the situation the user is in right now and helps find what to do next: Understand → Decide → Act → Recover, rather than Search → Route → Navigate. Distinguishing mechanism: every recommendation is explainable (states *why* this option, or why not), and time-sensitive facts always carry a Data Confidence label (Realtime / Estimated / Scheduled / Unknown) rather than presenting an estimate as verified fact.

## Operating Context

Used standing at a real bus stop or mid-trip on a phone, often while deciding quickly (a bus is arriving, or the user needs to act before missing a stop) — so at decision-critical moments the UI must surface only what matters, per PROPOSAL.md §17. No login; user identity is anonymous/device-scoped only (Phase 1), used solely to own a TravelSession.

## Capabilities and Constraints

- Phase 1 is scheduled-data only (no real-time vehicle position); real-time vehicle tracking, dynamic route-change detection, and proactive notifications are Phase 2.
- Backend already imports real GTFS transit data (see `BusNavigate/BusNavigate.Service/Implements/GtfsImport/`) — some real data is in place, not solely mock/sample data.
- Domain terminology (BusRoute, Direction, Trip, RouteStop, BusStop, TravelOption, RecoveryOption, RecoveryPoint, Data Confidence, TransitAlert, etc.) is authoritative in [CONTEXT.md](CONTEXT.md) — use those terms, not synonyms it flags as avoid.
- TransitAlert (service status) is human-curated only, never auto-derived from live vehicle data.
- UserPreference re-ranks TravelOption/RecoveryOption ordering only; it never removes an option except for walk-budget reachability (a hard physical constraint).
- Stack: Angular 18 + Tailwind + Leaflet/MapLibre frontend (mobile-first, bottom-nav pattern), .NET backend — existing codebase, not a greenfield stack decision.

## Evidence on Hand

Real GTFS transit data is partially integrated (import pipeline exists in `BusNavigate/BusNavigate.Service/Implements/GtfsImport/`). Some routes/stops still rely on data still being backfilled — do not assume full national/citywide coverage without checking. No user testimonials, case studies, or press (not applicable — single-user personal tool).

## Product Principles

- Explain, don't just answer: every TravelOption/RecoveryOption states its Reason; the system never scores routes as simply "best."
- Never present uncertain data as fact: attach Data Confidence to any time-sensitive claim (ETA, stop identification, service status).
- Recovery never forces backtracking to the original starting point — find the nearest workable Recovery Point instead.
- Safety over urgency: never recommend an action that pressures the user to rush across a street or walk somewhere unsafe.
- Graceful degradation: if real-time data is unavailable, fall back to scheduled data and say so, rather than guessing.

## Brand Commitments

None yet — no app name, logo, or voice/tone has been fixed as binding. The domain content mixes Thai and English (Thai for user-facing prose/terms, English for code-level domain names) per [CONTEXT.md](CONTEXT.md).
