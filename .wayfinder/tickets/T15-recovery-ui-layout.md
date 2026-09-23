# [wayfinder:grilling] Wrong-bus recovery UI layout

**Parent map:** [Phase 1 Spec — Public Transit Decision & Recovery Assistant](../map.md)

**Status:** closed
**Blocked by:** none ([Finalize module & folder boundaries](T10-module-boundaries.md)
closed); should be designed after
[Active-trip tracking UI layout](T14-travel-session-ui-layout.md) since recovery is
entered from a `MISBOARDED` `travel-session` state
**Blocks:** none — informs the `recovery` Angular module's page implementation

## Question

Same gap as [T12](T12-trip-planning-ui-layout.md), for the `recovery` module: no
UI/wireframe design is in scope for the map, but this page needs a real layout before
implementation can proceed past the current placeholder.

`POST /travel-sessions/{id}/recovery` (per T09) triggers wrong-bus recovery, reusing
T05's comparison algorithm exactly via the shared `TravelOptionEvaluation` service
(per [T06](T06-wrong-bus-recovery.md) / [T10](T10-module-boundaries.md)) from the
session's `CurrentLocation`. Results are `RecoveryOption[]` — "continue on current
bus" isn't special-cased, just another candidate. BTS/MRT stations appear only as
unconfirmed `Place` pointers (`DataConfidence: Unknown`, no rail routing in Phase 1).

What should the recovery screen look like: how does it present "continue as-is" next
to genuine alternatives without making the current (wrong) bus look like a normal
option, and how is `DataConfidence: Unknown` (unconfirmed BTS/MRT pointer) visually
distinguished from a confirmed bus `RecoveryOption`?

Follow [T12](T12-trip-planning-ui-layout.md)'s process: prototype 2-3 structurally
different layouts on the live `/recovery` route via the project's `/prototype` UI
workflow (`?variant=`), pick one, record the resolution here.

## Resolution

**Variant C — tiered urgency stack — wins.** Strong visual hierarchy answers this
ticket's core question directly: `RecommendedOptions` render as prominent
emerald-bordered cards tagged "แนะนำ" (recommended) — **except** the "continue on
current bus" candidate (`isCurrentBus`), which stays inside the `RecommendedOptions`
list per T06's "not special-cased" rule but is deliberately rendered in the same muted
slate style as a de-emphasized option, tagged "คันเดิม (ไม่แนะนำเป็นพิเศษ)" (current
bus — not specially recommended) instead of the green "แนะนำ" badge. It never reads as
a normal, equally-good choice even though it's technically eligible.
`LastResortOptions` are collapsed behind a "ทางเลือกสุดท้าย" expander (closed by
default) so they don't compete visually with the recommended tier.
`UnconfirmedRailPointers` (`DataConfidence: Unknown`) get a distinct dashed-border,
reduced-opacity treatment with an explicit "(ยังไม่ยืนยัน)" tag — visually separated
from confirmed `BusDirection` options in every tier, not just flagged in text.

Rejected:
- **A (list-first sectioned)** — same section-header approach T12/T13 landed on, but
  it treats the current-bus candidate as just another card in the Recommended section
  with only a small parenthetical tag — too easy to skim past and mistake for a
  genuinely recommended alternative, which is exactly the failure mode this ticket's
  Question asked to avoid.
- **B (split list + reasons detail)** — the reasons-on-selection detail panel is nice
  for understanding *why* an option qualifies, but recovery is an urgent, single-glance
  decision (the rider already knows they're on the wrong bus) — forcing a click to see
  each option's reasons adds friction this screen shouldn't have, unlike T12's
  trip-planning case where a considered, side-by-side comparison is the actual point.

**Not yet folded into production code.** The prototype (all three variants + the
`?variant=` switcher) currently lives on the `test` branch at
`frontend/src/app/modules/recovery/pages/recovery-home/prototype/`. Per the project's
prototype workflow, the next step is: fold variant C's markup into
`recovery-home.component`, drop variants A/B and the switcher from the mainline, and
move the full prototype set to a throwaway branch as the primary source. That
follow-up hasn't been done yet — this ticket only captures the layout decision.
