# Architectural Styles

Style is the architectural *language* a structure speaks — its vocabulary of forms,
materials, and details. It is never assumed by default; confirm it with the user or infer
it clearly from context (biome, existing builds nearby, explicit request) before designing.

**Medieval is not a default style.** Absent any signal, ask rather than assume.

## Supported style families (non-exhaustive — arbitrary and fictional hybrids are fine)

- Medieval, Gothic, Tudor, Viking
- Japanese, Chinese
- Fantasy, Dark fantasy
- Steampunk, Industrial, Victorian
- Rustic, Classical, Brutalist, Modern
- Sci-fi
- Ancient, Ruined
- Tribal
- Desert architecture, Mountain architecture
- Fictional hybrids (e.g. "Gothic-industrial," "Tribal sci-fi," "Ruined classical")

## Style vs. taste — the distinction this skill enforces

Style tells you the vocabulary; taste tells you how the user wants that vocabulary
arranged. They are independent axes:

`Style = Medieval` does **not** imply `Taste = steep roofs, asymmetry, complex massing`.
A user could want a medieval structure that is boxy and symmetric, or a steampunk
structure with the same layered-roofline, deep-façade sensibility as their medieval
builds. When a style and a Taste Profile dimension seem to conflict, resolve by asking
which one the user prioritizes for this build rather than silently picking one.

When taste has been observed under one style, treat it as evidence of a general
preference to test against the new style — not as a rule that only applies to the style
it was first observed in. See [taste-analysis.md](taste-analysis.md).

## Working with a style

For any style, before designing, identify:

- **Primary structural logic** — timber frame, load-bearing masonry, curtain wall +
  frame, riveted plate, organic/grown forms, etc.
- **Characteristic massing tendencies** — e.g. steampunk favors exposed mechanical
  volumes and asymmetric pipework masses; classical favors symmetric, axial, colonnaded
  massing; brutalist favors raw, heavy, repetitive monolithic forms.
- **Roof/skyline language** — steep multi-tier (Japanese/fantasy), flat/parapet
  (classical/brutalist/desert), industrial saw-tooth or stack-punctuated (industrial/
  steampunk), organic/irregular (ruined/tribal).
- **Material vocabulary** — see [block-palettes.md](block-palettes.md) for how to turn a
  style's real-world materials into a disciplined Minecraft block palette.
- **Detailing vocabulary** — what a style's ornament actually communicates (structural
  emphasis, wealth/status signaling, mechanical function, age/weathering) rather than
  generic "add trim here."

## Hybrid and fictional styles

When asked for a hybrid (e.g. "Gothic-steampunk shrine"), identify which style supplies
massing/structural logic and which supplies material/detail vocabulary rather than
blending both indiscriminately — an unresolved blend usually produces the "random block
noise" failure mode. State the split explicitly in the design thesis, e.g. "Gothic
massing and silhouette, steampunk structural expression and materials."
