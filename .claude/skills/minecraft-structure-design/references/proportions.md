# Proportions

Proportion is the relationship between a structure's dimensions — not any single
dimension in isolation. A tower isn't "tall," it's tall *relative to* its footprint; a
roof isn't "steep," it's steep *relative to* the wall height it sits on.

## Relationships to evaluate

- **Height vs. width** — the structure's overall aspect ratio, and whether it commits to
  that ratio or hedges toward a generic cube.
- **Roof height vs. wall height** — a roof that's taller than the walls it covers reads
  very differently (dramatic, top-heavy, alpine) from one that's a shallow cap.
- **Foundation vs. superstructure** — how much visual weight sits below vs. above the main
  floor line; a tall plinth/foundation changes a building's perceived gravity.
- **Tower vs. main mass** — a tower's width should read as proportionate to its height
  (thin towers read as spires/lookouts, thick towers read as keeps/fortifications), and
  its height should read as proportionate to the mass it rises from.
- **Wing vs. primary mass** — wings should be legibly subordinate in scale, not
  near-equal, or they contest the primary mass for dominance (see
  [massing.md](massing.md)).
- **Entrance vs. facade** — an entrance sized and positioned to read clearly against the
  wall it's set into; oversized entrances read as monumental/civic, undersized ones as
  humble/domestic even at the same overall building size.

## Exaggeration as a deliberate tool

Minecraft's cubic grid makes subtle proportion differences hard to read at a distance.
Slight exaggeration of a proportion relationship (a little taller, a little steeper, a
little deeper) often reads more clearly than a "realistic" ratio would. This is tracked as
`taste_profile.proportions.exaggeration` — some users want restrained, near-realistic
proportion; others want intentionally heightened drama. Neither is default-correct.

## Consistency

Whatever proportion language a structure establishes (e.g. "windows are always half a
wall-segment tall") should hold across the structure unless a deliberate exception marks
something as special (a great hall's windows taller than the rest). Inconsistent
proportions without a reason read as a buildability accident, not a design decision.

## Build proportion vs. presentation emphasis

The relationships above define **build proportion** — the real, canonical ratios that go
into LOD3/4 and the blueprint. They hold for the whole structure and don't get suspended
for effect.

**Presentation emphasis** is a separate, narrower move that belongs to Hero Visualization
Mode (see [hero-visualization.md](hero-visualization.md)): specific hero-facing elements —
a gate, a porch, a chimney, the roof/ridge, a tower crown, a civic entrance, a command
dais, a forge bay — can be emphasized beyond their literal canonical proportion when
presenting the design, using the Architectural Amplification Mass tier
([massing.md](massing.md)). This is scoped to elements the design already gives a reason
to foreground (see [composition.md](composition.md), "Focal points"); it is not a general
license to inflate every dimension.

Keep the two labeled separately in output: a structure-spec's LOD3 dimensions state build
proportion; a Hero Render Brief's "architectural enrichment" section states presentation
emphasis. Never let a presentation emphasis value silently overwrite the build proportion
value for the same element — if the user likes the emphasized version enough to want it
built, that's a deliberate canonical design change, made explicitly, not an automatic
promotion.
