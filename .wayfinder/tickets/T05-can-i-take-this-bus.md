# [wayfinder:grilling] "Can I take this bus?" comparison algorithm

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none (~~[Core Phase 1 data model schema](T03-core-data-model.md)~~ closed)
**Blocks:** [Wrong-bus recovery algorithm](T06-wrong-bus-recovery.md), [Full Phase 1 API contract](T09-api-contracts.md)

## Question

PROPOSAL.md section 7/8 (and the section-19 explainability example) requires answering
"can I take this approaching bus instead of the one I'm waiting for?" with a yes/no plus
reasons, not a single score. Define, against the entities settled in
[Core Phase 1 data model schema](T03-core-data-model.md):

- What factors qualify a candidate `Trip` as a valid substitute for the originally
  planned one — same `Destination` reachable, no/acceptable transfer count, walking
  distance from its alighting stop to the destination or next leg, arrival-time
  comparison. What's the precise accept/reject rule (not just "better," but "valid at
  all")?
- How ties or close calls are presented — proposal wants multiple `TravelOption`s shown
  side by side (section 7 table), not a single winner. Confirm the comparison always
  returns a ranked/tagged list, never collapses to one answer.
- How `Reason` factor codes (see map Notes — structured, not free text) are generated
  for both the "yes, take it" and "no, don't" cases from section 19's examples.
- How walking distance between an alighting stop and the destination/next stop is
  computed for Phase 1 (straight-line estimate vs. some routing calculation) — note
  Phase 1 excludes turn-by-turn `WalkingRoute` per CONTEXT.md, so this is likely a
  straight-line/simple estimate only.

## Resolution

**Scope:** This algorithm checks **one specific candidate** Route/Direction (the
approaching bus the user points at or the app detects arriving at the same stop)
against the user's currently planned `TravelOption` — a 1-to-1 comparison, not a fresh
alternatives search. Full alternative-route search is trip-planning's job — initial
`TravelOption` generation, per
[Initial trip planning search](T11-initial-trip-planning-search.md) (T11, added after
this ticket, since no ticket had actually designed that algorithm until then) — not
this ticket.

**Accept/reject rule** (hard gates, not just ranking — matches PROPOSAL.md section 19's
explicit "don't take this bus" examples):

A candidate is **rejected outright** (with `Reason` explaining why) if any of:
1. `DOES_NOT_REACH_DESTINATION` — no `RouteStop` on the candidate's `Direction` is
   within the walk budget (see below) of the `Destination` or of a workable next-leg
   transfer point.
2. More than **1 additional transfer** versus the original plan's transfer count.
3. Alighting-to-destination walking distance exceeds **800 meters** (the walk budget).

If none of these trip, the candidate is **valid** and shown as an option (not
necessarily "better" than the original — just usable), alongside `TravelOption`s,
always as part of a set per the map's Notes (never collapsed to a single answer).

**Walking distance formula:** straight-line (haversine) distance × **1.3** detour
factor (standard approximation for irregular urban street grids, given Phase 1 has no
turn-by-turn `WalkingRoute`/routing-graph per CONTEXT.md), converted to time at
**5 km/h** average walking speed.

**Reason factor codes** (structured, per map Notes — frontend owns
localization/rendering): `REACHES_DESTINATION`, `DOES_NOT_REACH_DESTINATION`,
`FASTER_BY` (+minutes), `SLOWER_BY` (+minutes), `NO_TRANSFER`, `EXTRA_TRANSFER_COUNT`
(+count), `EXTRA_WALK_DISTANCE` (+meters), `WITHIN_WALK_BUDGET` /
`EXCEEDS_WALK_BUDGET`. Extendable later as new cases surface during implementation —
not designed exhaustively upfront.

Feeds [T06](T06-wrong-bus-recovery.md) (recovery options are TravelOption-shaped
candidates generated the same way, from a new `CurrentLocation`) and
[T09](T09-api-contracts.md) (comparison endpoint + `Reason` DTO shape).
