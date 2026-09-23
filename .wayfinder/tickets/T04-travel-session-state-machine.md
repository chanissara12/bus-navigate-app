# [wayfinder:grilling] TravelSession state machine

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open (unclaimed)
**Blocked by:** none
**Blocks:** [Wrong-bus recovery algorithm](T06-wrong-bus-recovery.md), [Full Phase 1 API contract](T09-api-contracts.md)

## Question

Per [CONTEXT.md](../../CONTEXT.md), `TravelSession` starts at trip-plan confirmation and
spans walk→wait→board→ride→alight. Define its concrete state machine for Phase 1:

- What are the named states (e.g. `PLANNED`, `WALKING_TO_STOP`, `WAITING`, `BOARDED`,
  `RIDING`, `ALIGHTED`, `COMPLETED`, plus however "wrong bus"/recovery is represented —
  a distinct state, or a flag orthogonal to state)?
- What triggers each transition — user action (explicit "I boarded" tap), inferred from
  GPS, inferred from the progress-polling endpoint, or a mix? (Standing decision: active
  trip progress is server-computed via polling — see map Notes.)
- Where does "get off assistance" (section 13's threshold alert, e.g. "1 stop
  remaining") attach — is it a computed property of the current state + remaining
  RouteStop count, or its own state?
- How does the state machine represent a `TravelSession` that stalls (user closes app,
  no updates) — does it expire, and after how long?

This does not need to wait on the data-source decision — it's abstract session-lifecycle
design, independent of which transit data source is chosen.

## Resolution

(pending)
