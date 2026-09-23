# [wayfinder:grilling] Bus Stop Context data model & source/verification metadata

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open (unclaimed) — unblocked
**Blocked by:** none (~~[Core Phase 1 data model schema](T03-core-data-model.md)~~ and ~~[Choose bus-stop imagery source](T02-stop-imagery-source.md)~~ both closed — see resolutions: no imagery source, text-only via OSM)
**Blocks:** [Full Phase 1 API contract](T09-api-contracts.md)

## Question

PROPOSAL.md section 14 requires showing (where available) a stop photo, surrounding
area photo, road side, crossing points, nearby landmarks/buildings, and nearby BTS/MRT
— each tagged with source, last-updated date, and verification status (official vs.
community — though community reports are Phase 2/out of scope here, the schema should
at least reserve a `source` field that could later hold that distinction without a
breaking change).

Given the source(s) resolved in
[Choose bus-stop imagery source](T02-stop-imagery-source.md), define:

- `StopImage`/`StopLandmark` concrete schema — fields, how they relate to `BusStop`,
  and how attribution (if the chosen source requires it) is carried through to the API
  response so the frontend can render required credit text.
- What happens for a `BusStop` with no available imagery/landmark data — Phase 1 must
  degrade gracefully (text-only road-side/crossing info) rather than error, per
  PROPOSAL.md section 25 (Graceful Degradation).
- Whether landmark data is free-text, structured (type: crossing/skywalk/mall-entrance/
  landmark, per section 15's walking-guidance warnings list), or both.

## Resolution

(pending)
