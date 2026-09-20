# Massing

Massing is the arrangement of a structure's major three-dimensional volumes, decided
before any wall texture, window, or roof detail. Get massing right and the structure will
survive a bad palette choice; get it wrong and no amount of detailing saves it.

## Primary mass

The single largest, most legible volume — usually the main hall, keep, nave, or living
core. It should be identifiable at a glance as "the building," with everything else read
as attached to it.

## Secondary masses

Volumes attached to or stepping off the primary mass: wings, towers, dormers, porches,
outbuildings folded into the composition. Secondary masses:

- should be clearly smaller or clearly differentiated (height, material, roof form) from
  the primary mass — not the same size, or they compete for primary status;
- give a composition depth and interest without needing extra detail;
- are where most of a structure's asymmetry and character usually live.

`taste_profile.massing.secondary_mass_frequency` and `.dominant_mass` track how much a
given user wants of this.

## Fragmentation

How broken-up a structure's overall form is: a single unified volume vs. many small
volumes clustered together. High fragmentation suits organic/rustic/village-cluster
structures; low fragmentation suits monumental/formal/industrial ones. Neither is
default-correct — it's read from style, function, and taste together.

## Scale cues

Massing choices imply a building's scale even before doors/windows are placed: a tall
primary mass with few large secondary volumes reads as monumental; many small
comparably-sized volumes reads as vernacular/domestic. Keep the implied scale consistent
with the structure's actual function — a small forge shouldn't get monumental massing
just because the style is "grand."

## The three mass tiers

Every volume associated with a structure — in the canonical design or in a Hero
Visualization — belongs to exactly one of these tiers. Know which tier a given form is in;
say so explicitly whenever it isn't obvious (see
[hero-visualization.md](hero-visualization.md) for how this maps onto output).

**Canonical Mass** — the real architecture: primary mass, secondary masses, and any volume
that's actually part of the structure's envelope. Every canonical mass must have a
functional or structural reason (see [design-principles.md](design-principles.md), "Every
major form needs a reason"). This is what goes into LOD3/4 and the blueprint/NBT.

**Architectural Amplification Mass** — a more dramatic *reading* of a canonical form,
used in presentation to make an already-justified element read stronger: a thicker gate
frame, a stronger porch, a deeper roof overhang, added roof layering, a parapet, a heavier
buttress, stronger entrance framing, chimney emphasis. An amplification mass corresponds to
a real canonical element — it exaggerates how that element reads, it doesn't invent a new
one. It does not need to match canonical geometry block-for-block; it needs to stay
legibly the same architecture (see [proportions.md](proportions.md), "Build proportion vs.
presentation emphasis").

**Scene Support Mass** — elements that are not the building at all: crates, barrels,
weapon racks, carts, banner poles, lantern posts, fences, palisade fragments, hay, work
props, camp elements. These exist purely for presentation, identity reinforcement, or
storytelling and carry no structural claim on the building whatsoever.

Functional-reason requirements scale down the tiers, not up:

- Canonical Mass **must** have a functional/structural reason.
- Architectural Amplification Mass **should** correspond to a real canonical element and
  amplify it legibly — its "reason" is presentation/identity, which is legitimate (see
  [design-principles.md](design-principles.md), "Functional core, aspirational
  presentation"), but it is never invented as a substitute for a canonical mass that
  doesn't otherwise exist.
- Scene Support Mass **may** be purely functional, identity-reinforcing, atmospheric, or
  storytelling support — any of these is a sufficient reason on its own, since it never
  claims to be part of the building's structural logic.

Canonical Build Mode works in the Canonical Mass tier only. Hero Visualization Mode can use
all three, each labeled — never blur an Amplification or Scene Support mass into looking
like it belongs in the LOD3/4 spec.

## Working at the massing stage

- Block volumes as simple solids (mentally: boxes, wedges, cylinders) — no textures, no
  windows, no roof detail yet.
- Test the arrangement from multiple angles; a composition that only works from the front
  usually isn't finished.
- Do not proceed to silhouette/proportion refinement until the volumes have a stated reason
  each (see [design-principles.md](design-principles.md), "Every major form needs a
  reason").
