# Roofs and Façades

## Roof language

Roof decisions are silhouette decisions first (see [silhouette.md](silhouette.md)) and
weather/structure-logic decisions second.

- **Pitch** — shallow, moderate, steep, or mixed. Pitch should relate to style (steep for
  alpine/Tudor/Japanese-tiered, shallow or flat for classical/desert/brutalist) and to the
  Taste Profile's `roof_language.pitch`.
- **Layering** — a single roof plane vs. stepped/tiered/intersecting roof volumes. Layering
  is one of the strongest tools for silhouette variation (see
  [silhouette.md](silhouette.md), "Roofline variation") but should correspond to actual
  massing underneath, not be applied as surface-only ornament.
- **Complexity** — how many distinct roof forms/intersections a structure carries. More
  complexity suits larger, more important structures; a small utility building with an
  ornate multi-hip roof is a proportion/hierarchy mismatch (see
  [proportions.md](proportions.md)).
- **Overhang** — how far the roof projects past the wall line. Larger overhangs read as
  rustic/organic/weather-driven; minimal/no overhang reads as formal/modern/fortified.
- **Preferred forms** — gable, hip, gambrel, mansard, pyramidal, dome, tiered/pagoda,
  lean-to, saw-tooth (industrial), flat with parapet, or irregular/organic (ruined,
  tribal). Pick the form the structural and stylistic logic calls for, not the form that's
  easiest to build.

## Façade depth and rhythm

A façade of any real length needs depth to avoid the "flat wall" critique-checklist
failure: recesses, projections, framing bays, balconies, buttresses, or layered surface
planes.

- **Depth** — how far forward/back different façade elements sit relative to a base plane.
  Even a single recessed entrance or projected bay materially changes how flat a wall
  reads.
- **Flatness tolerance** — some styles/tastes deliberately embrace flatter, quieter
  façades (modern, brutalist, minimalist fantasy); track this via
  `taste_profile.facade.flatness_tolerance` rather than assuming depth is always wanted.
- **Repetition** — repeated bays/windows create rhythm, but identical repetition across an
  entire long façade with no variation reads as monotonous (also a critique-checklist
  failure: "repeated identical façades"). Break repetition with a central or end-emphasis
  element.
- **Window rhythm** — spacing and sizing of openings should follow a legible pattern
  (regular grid, paired bays, alternating rhythm) rather than ad hoc placement, unless
  irregularity is itself the intended character (ruined, organic, tribal).

## Openings

Entrances, windows, and arches are also hierarchy tools: a main entrance should read as
the most important opening on the structure (size, framing, position), with secondary
entrances and windows subordinate to it. Arches and structural openings (arcades,
colonnades) should express the same structural logic as the rest of the building — see
[references/design-principles.md](design-principles.md) on "unsupported upper volumes"
for the failure mode of openings that ignore what they need to structurally support.

## Roof and façade enrichment (presentation layer)

The elements below belong to Hero Visualization Mode
([hero-visualization.md](hero-visualization.md)) and the Architectural Amplification Mass
tier ([massing.md](massing.md)) — they read as richer presentation of a canonical roof/
façade decision, and don't need to be treated as canonical geometry every time. A roof's
job isn't only to follow the massing underneath (see "Roof language" above); in
presentation it should also help create spectacle and reinforce the silhouette.

**Roof enrichment:**
- Deeper eaves than the canonical minimum overhang.
- A stepped roof hierarchy read more distinctly (see "Layering" above, pushed further).
- Layered roof read emphasized for silhouette impact (see
  [silhouette.md](silhouette.md), "Hero silhouette accents").
- A stronger, more prominent ridge line.
- Exposed brackets and support beams shown more prominently than the structural minimum
  requires.
- Material transitions across the roof plane (e.g. a darker cap course) for visual
  richness.

**Façade enrichment:**
- A more reinforced-looking entrance surround.
- Banners, heraldry, or faction markers mounted on the façade.
- Lantern brackets.
- Slit windows for a fortified/mysterious read.
- Façade rhythm pushed slightly more dramatic than the canonical bay spacing.
- Timber framing rendered more prominent/decorative than the structural minimum.
- Buttress-like supports emphasizing load paths that are real but understated in the
  canonical design.
- Depth variation and stone/timber material transitions beyond the canonical palette
  count (see [block-palettes.md](block-palettes.md)'s Atmosphere Palette).

Every enrichment above should trace back to a real canonical element it's amplifying (see
[massing.md](massing.md), Architectural Amplification Mass) — it should never be the only
place a structural idea appears. If an enrichment doesn't correspond to anything in the
canonical design, it's either a Scene Support element (doesn't touch the building) or a
sign the canonical design itself is missing something and should be revisited.
