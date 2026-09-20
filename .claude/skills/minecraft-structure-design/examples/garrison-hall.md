# Example: Garrison Hall (Canonical Design + Hero Render Brief)

A rendered massing fallback preview for this example is at
[garrison-hall-hero-preview.svg](garrison-hall-hero-preview.svg), generated with
`tools/blueprint_preview.py` per SKILL.md's "Preview generation priority" — this session
had no real image-generation capability available, so it demonstrates the documented
fallback rather than a true Hero Preview image. When an image-AI tool is available, this
example's Hero Render Brief below is what should be handed to it instead.

Demonstrates the full Canonical Build Mode → Hero Visualization Mode pairing end to end,
and makes explicit what belongs in Canonical Build Truth vs. what's Presentation
Embellishment. Style/gameplay context is stated, not assumed — this is a military
structure because the user asked for one, not a default.

## Intent
- Type: garrison drill hall
- Style: fortified rustic (user-specified)
- Purpose: explicitly a military training structure — the only example in this skill that
  intentionally uses defensibility/military framing, because the user asked for it
- Scale: large, single-story, long footprint
- Context: part of a settlement, adjoining a walled compound

## Design thesis
A long, single-story drill hall entered through a projected twin-pier gate bay, roofed
with a steep stepped profile that breaks the hall's long roofline into two readable
segments.

---

## CANONICAL BUILD TRUTH — goes into the blueprint/NBT

### LOD1 — Composition
- Primary mass: long rectangular hall, low wall height relative to length (see
  references/proportions.md — long-low proportion is the canonical read).
- Secondary mass: projected gate bay at one end, narrower and taller than the hall wall,
  containing the entrance.
- Silhouette: two-tier stepped roof — a lower tier over the gate bay, a taller ridge over
  the hall — giving the long roofline a single clear break (references/silhouette.md,
  "Roofline variation").
- Twin gate piers: two vertical stone piers flanking the entrance, functionally there to
  visually carry the gate bay's roof load (references/design-principles.md, "unsupported
  upper volumes").

### LOD2 — Architecture
- Footprint: one long open-plan hall, gate bay as a shallow entrance vestibule.
- Façade logic: repeated structural bays along both long walls (timber posts + infill),
  breaking what would otherwise be a long flat wall (references/roofs-and-facades.md).
- Roof system: stepped gable, steep pitch, moderate overhang.
- Structural elements: exposed timber posts at each bay division; stone gate piers.
- Openings: single main entrance through the gate bay (primary), regularly spaced slit-
  style windows along the hall's long walls (secondary, subordinate in size).

### LOD3 (abbreviated)
- Material palette by role: cobblestone/stone-brick foundation and gate piers, oak-log
  structural frame, oak-plank primary wall infill, dark-oak-stair stepped roof.
- Overall dimensions: long hall ~9 wide × 6 tall (wall) × 23 long; gate bay ~5 wide × 8
  tall, projecting 3 blocks.

**This section — massing, proportions, structural logic, palette roles, dimensions — is
what actually gets built. A Hero Visualization may amplify how it's presented; it may not
contradict any of it without an explicit canonical revision.**

---

## HERO RENDER BRIEF — presentation only, does not change the above

### Must not change
- Single-story hall — must not become multi-story.
- Twin gate piers — must remain twin and remain the primary entrance.
- Stepped two-tier roof — must remain visibly stepped, not simplified to one plane.
- Long-low proportion of the hall — must not become tall/vertical.

### Allowed amplification (Architectural Amplification Mass)
| Canonical element | Amplification allowed |
| --- | --- |
| Gate piers | Read heavier and more imposing; deeper reveal, chunkier proportion |
| Stepped roof | Steeper visual pitch, stronger ridge shadow, more dramatic stepping |
| Façade bays | More depth than the LOD3 minimum; timber framing read more prominent |

### Architectural enrichment
- Roof: deeper eaves than canonical minimum, exposed rafter tails, a darker cap course at
  the ridge for material contrast.
- Façade: reinforced-looking entrance surround at the gate, iron banding on the gate
  piers, lantern brackets flanking the entrance.
- Structural expression: visible diagonal braces at each timber bay, reinforcing (not
  contradicting) the real post-and-infill logic.

### Scene dressing (Scene Support Mass — none of this is in the blueprint)
- Props: weapon racks and crates staged near the entrance, a cart off to one side.
- Identity markers: a banner on each gate pier carrying the garrison's heraldry.
- Environmental storytelling: worn dirt path leading to the entrance, a drilling yard
  implied in the foreground.

### Environment
- Setting: walled military compound within a larger settlement.
- Settlement backdrop: visible but secondary — rooftops beyond the compound wall.

### Camera
Low 3/4 hero angle from the drilling yard, looking up slightly at the gate.

### Lighting
Overcast, cool daylight — functional and unglamorous, matching a working military
structure rather than a ceremonial one.

### Presentation mood
Imposing but worn-in — a structure that's seen use, not a pristine showpiece.

### Image-AI render notes
Faithful interpretation, not literal block tracing: keep the long-low hall, the twin-pier
gate, and the stepped roof recognizable; amplify materials, lighting, and staging freely
within that.

### Preview review
- Canonical truth intact: yes — single story, twin piers, stepped roof all preserved in
  the brief's constraints.
- Silhouette still correct: yes — amplification reinforces the same roofline break rather
  than replacing it.
- Function still reads: yes — military/training read comes through scene dressing without
  altering the architecture.
- Embellishments helping or fighting identity: helping — heraldry and props reinforce
  "garrison," not fighting the hall's long-low read.
- Action: finalize.
