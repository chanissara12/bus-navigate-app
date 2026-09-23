# [wayfinder:grilling] "Can I take this bus?" comparison algorithm

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** open (unclaimed) — unblocked
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

(pending)
