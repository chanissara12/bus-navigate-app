# Design Principles

## The failure mode this skill exists to avoid

`box + roof + random decoration`. A rectangular volume, a roof dropped on top, then
decoration scattered on to compensate for the fact that the massing never had a reason to
look the way it does. Decoration should reinforce architecture that already works, not
disguise architecture that doesn't.

## What to think about before touching blocks

Composition, massing, silhouette, proportion, hierarchy, depth, rhythm, structural logic,
architectural language, material hierarchy, detailing, terrain integration, viewing
distance, visual readability. All of these are decided before individual Minecraft blocks
are chosen. If a design decision can't be explained in these terms, it isn't ready yet.

## Every major form needs a reason

A wing exists because it houses something, breaks a long façade, or responds to terrain —
not because "buildings have wings." A tower exists because the structure needs a landmark
moment, a defensive sightline, or a vertical focal point in its silhouette — not because
towers look good. If a form's reason can't be stated in one sentence, reconsider it before
adding detail on top of it.

## Silhouette test

A strong design should still be recognizable when reduced to a flat silhouette — no
texture, no color, no block variation. If the outline is a plain rectangle with a
triangle on top, the massing hasn't done its job yet regardless of how much detail gets
added later. See [silhouette.md](silhouette.md).

## Decoration reinforces, it doesn't rescue

Detail should clarify structure that's already legible: emphasizing a load path, marking
an entrance, breaking a long repetitive run. Detail added to distract from a flat wall or
a weak silhouette is noise, not architecture.

## Functional core, aspirational presentation

Major architecture — the Canonical Mass, the load-bearing logic, the envelope — must still
have a functional and structural reason (see "Every major form needs a reason" above and
[massing.md](massing.md)). That discipline doesn't relax for a hero-facing design. But
minor elements, and everything in Hero Visualization Mode (see
[hero-visualization.md](hero-visualization.md)), are allowed to serve a *different* set of
legitimate jobs: reinforcing identity, creating atmosphere, supporting storytelling,
improving presentation. None of those are lesser reasons — they just aren't structural
ones, and should be labeled as presentation rather than build truth.

Working rules:

- **Do not treat beauty as dishonesty.** A design that reads as more dramatic, more
  atmospheric, or more memorable than a strictly minimal reading of its function is not
  automatically "unfaithful" — it's dishonest only if it misrepresents what will actually
  be built without saying so.
- **Hero readability may exceed literal minimalism.** A gate that's presented heavier, a
  roof that reads more dramatic, a façade with more depth than the bare LOD3 minimum are
  legitimate presentation choices, not violations of "architecture before decoration" —
  see [hero-visualization.md](hero-visualization.md) for where the line sits.
- **Meaningful embellishment is allowed.** The failure mode this skill avoids is
  *meaningless* decorative noise (see the critique checklist below), not decoration or
  richness in general. A banner, a heraldic mark, a lantern bracket, a weathered texture
  that reinforces identity or mood is doing a job.
- **A concept render may amplify material richness and atmosphere while preserving the
  canonical architectural truth.** Amplifying how something *looks* (lighting, weathering,
  material depth, prop dressing) is different from changing *what it is* (its massing,
  proportions, structural logic, and identity as a structure type) — the first is
  presentation, the second breaks canonical truth and is not allowed without the user
  explicitly revising the design.

## Self-critique checklist

Run every design past this list before presenting it as finished. For each hit, explain
the underlying architectural issue, not just "this looks off."

- **Weak silhouette** — outline reads as a generic box/box+triangle regardless of detail.
- **Excessive symmetry** — every element mirrored with no hierarchy or focal point.
- **Excessive asymmetry** — no organizing logic; reads as random rather than composed.
- **Box-like massing** — a single undifferentiated volume with no secondary masses.
- **Inconsistent proportions** — e.g. a tower whose width doesn't relate to its height, or
  a roof so tall it visually outweighs the walls it sits on.
- **Flat façades** — no depth: no recesses, projections, framing, or layering across a
  wall of any real length.
- **Unsupported upper volumes** — an overhang or upper floor with no visible structural
  logic (bracket, buttress, taper) holding it up.
- **Roof complexity unrelated to the building** — layered/ornate roof forms bolted onto a
  building whose massing doesn't call for them.
- **Too many materials** — material count exceeds what the hierarchy needs (see
  [block-palettes.md](block-palettes.md)); reads as noisy rather than rich.
- **Noise disguised as detail** — random block substitution standing in for actual
  architectural articulation.
- **Scale inconsistency** — window/door/floor heights that don't agree with the
  structure's implied number of stories or its neighbors.
- **Terrain disconnect** — the structure sits on the landscape rather than in or against
  it; no foundation, retaining, or grading logic. See
  [terrain-integration.md](terrain-integration.md).
- **Taste overfitting** — a Contextual or Soft Preference applied somewhere it doesn't
  belong just because the user likes it elsewhere (see SKILL.md, "Context overrides
  taste").

## Recognizing gameplay-type assumptions to avoid

Watch for creeping assumptions that don't belong unless the user stated them:

- RTS: base-building layout logic, resource-flow zoning, unit-pathing chokepoints.
- Survival: mob-proofing, farm integration, redstone tech placement.
- PvP: sightline denial, choke-point defensibility as a primary driver.
- Adventure map: puzzle/quest scripting implications, forced sequencing.
- City-builder: zoning categories, growth-stage variants.

Any of these can be *added* if the user asks — they must never be the default lens the
design is built through.
