# [wayfinder:grilling] TravelSession state machine

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
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

**States:** `PLANNED` → `WALKING_TO_STOP` → `WAITING` → `RIDING` → `ALIGHTED` →
`COMPLETED`, plus `MISBOARDED` as a distinct state entered from `RIDING` (or `WAITING`,
if the user reports boarding the wrong vehicle before it even departs) when the user
reports being on the wrong bus, and `ABANDONED` as a terminal state for stalled
sessions. `BOARDED` was considered and dropped — nothing distinguishes it from the
start of `RIDING`, so it would just be a duplicate state with no behavioral difference.
`MISBOARDED` is a full state, not a flag layered on `RIDING`, because the recovery flow
(sections 8-9) routes to a different downstream target (`RecoveryOption` generation,
[T06](T06-wrong-bus-recovery.md)) than the normal flow (`TravelOption` follow-through) —
querying "sessions currently in trouble" should be a plain state filter.

**Transitions:** driven by **explicit user action** (an API call — e.g. "I boarded",
"I got off", "I'm on the wrong bus") for every state-machine transition, not inferred
from GPS/polling alone — these transitions gate real decisions (e.g. whether recovery
computation starts), so guessing wrong from location alone is too risky. The
progress-polling endpoint (per map Notes' standing decision) operates *within* the
`RIDING` state — it computes remaining-stop-count/ETA without changing state — and is
the mechanism behind Q3 below.

**Get-off assistance** ("1 stop to Siam") is a **computed value**, not its own state —
a threshold read off the remaining-RouteStop count from the progress-polling endpoint
while in `RIDING`. Modeling it as a separate state (e.g. `APPROACHING_DESTINATION`)
would require keeping two sources of truth (the state machine and the stop counter) in
sync for no behavioral benefit.

**Stall handling:** a `TravelSession` with no user action or progress-poll for **2
hours** auto-transitions to a terminal `ABANDONED` state — long enough to cover a
realistic worst-case Bangkok bus trip (wait + transfers + ride), short enough that
stale sessions don't linger indefinitely as if still active, which would otherwise
pollute anything downstream that queries "current" sessions.

### State transition table

| From | To | Trigger |
|---|---|---|
| — | `PLANNED` | User confirms a `TravelOption` |
| `PLANNED` | `WALKING_TO_STOP` | User action: started walking |
| `WALKING_TO_STOP` | `WAITING` | User action: arrived at boarding stop |
| `WAITING` | `RIDING` | User action: boarded |
| `WAITING`, `RIDING` | `MISBOARDED` | User action: reports wrong bus |
| `RIDING` | `ALIGHTED` | User action: got off |
| `ALIGHTED` | `COMPLETED` | User action: reached destination (or auto, if `ALIGHTED` stop == `Destination`) |
| any non-terminal | `ABANDONED` | No user action/poll for 2 hours |

This feeds [T06](T06-wrong-bus-recovery.md) (MISBOARDED is its entry point) and
[T09](T09-api-contracts.md) (each transition needs a corresponding endpoint/action).
