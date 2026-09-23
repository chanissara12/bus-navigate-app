# [wayfinder:grilling] Wrong-bus recovery algorithm & Recovery Point search

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open (unclaimed)
**Blocked by:** ["Can I take this bus?" comparison algorithm](T05-can-i-take-this-bus.md) (~~[Core Phase 1 data model schema](T03-core-data-model.md)~~ and ~~[TravelSession state machine](T04-travel-session-state-machine.md)~~ both closed)
**Blocks:** [Full Phase 1 API contract](T09-api-contracts.md)

## Question

PROPOSAL.md sections 8-9 require, when a user reports "I took the wrong bus" (or is
inferred to have via `CurrentRoute` diverging from the planned route), generating
`RecoveryOption`s anchored on `RecoveryPoint`s (next stop, previous stop, transfer
point, nearby BTS/MRT, another reachable stop) — never forcing a return to the origin
of the problem.

Define:

- The search strategy for candidate Recovery Points given `CurrentLocation`/
  `CurrentRoute` — what's actually queried (nearby `BusStop`s within what radius,
  reachable `Direction`s from those stops, transfer stations if in the Phase 1 data
  model at all).
- How this reuses vs. duplicates the comparison logic from
  ["Can I take this bus?" comparison algorithm](T05-can-i-take-this-bus.md) — a
  RecoveryOption is structurally a TravelOption from a new CurrentLocation; confirm
  whether it's the literal same code path or a variant.
- How "get off at next stop" vs. "continue on current bus" are represented as options
  (section 8's option list) when the current bus hasn't necessarily diverged yet.
- Whether BTS/MRT stations are modeled as a distinct entity or as a special case of
  `Place`/`BusStop` for Phase 1 purposes (transfer connectivity data availability
  depends on what T01's data source actually includes for BTS/MRT — flag if this needs
  to fall back to a simpler "walk to a known transit hub" treatment for Phase 1).

## Resolution

(pending)
