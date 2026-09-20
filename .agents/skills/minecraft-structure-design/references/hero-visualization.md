# Hero Visualization

Hero Visualization Mode turns a confirmed canonical design into an aspirational,
image-AI-friendly presentation — without ever silently rewriting what the design actually
is. It exists because "functional, buildable, readable" and "beautiful, memorable,
image-AI-friendly" are not competing goals; treating them as competing goals is what
produces either a generic functional box or an ungrounded pretty picture that couldn't be
built. The target is both at once.

See SKILL.md's "Two output modes" and "Hero Visualization workflow" for where this fits in
the overall process, and [templates/hero-render-brief.md](../templates/hero-render-brief.md)
for the output shape.

## The core distinction

Every element in a Hero Visualization is one of the three tiers from
[massing.md](massing.md):

- **Canonical Mass** — untouched build truth.
- **Architectural Amplification Mass** — a more dramatic reading of a real canonical
  element.
- **Scene Support Mass** — non-architectural presentation/storytelling elements.

A Hero Visualization is honest as long as a viewer (or a future builder) can tell which
tier any given detail belongs to, and the canonical design underneath is never
misrepresented as something it isn't. It is dishonest the moment presentation elements are
implied to be part of the build without saying so, or the canonical architecture's type,
function, or defining proportions are quietly changed.

## Faithful interpretation, not voxel tracing

Do not ask an image-AI tool (or your own presentation writing) to trace the canonical
massing literally, block for block. Direct it to produce a **faithful interpretation**:
recognizable as the same architecture, freely richer in execution.

Example: a canonical design specifies a long drill hall, a projected gate bay, twin gate
piers, and a steep stepped roof. A faithful hero interpretation can:

- make the gate read heavier and more imposing,
- make the roof more dramatic (steeper read, stronger shadow, sharper ridge),
- add façade depth beyond the LOD3 minimum,
- add structural braces that reinforce (not contradict) the load logic,
- add heraldry, banners, or faction marks,
- surround it with military props (racks, crates, a drilling yard) as Scene Support.

All of that is allowed as long as the result still reads unambiguously as *the same
architecture* as the canonical drill hall — long hall, projected gate, twin piers, stepped
roof. It stops being faithful the moment the result would read as a different building
type (a chapel, say, or a keep) to someone who hadn't seen the canonical spec.

## What must never change without an explicit canonical revision

State these explicitly per structure as "Must not change" in the Hero Render Brief:

- The structure's fundamental type/function read (a granary must still read as a granary).
- Primary mass shape and dominant proportion relationship (see
  [proportions.md](proportions.md), "Build proportion vs. presentation emphasis").
- The number and rough arrangement of secondary masses.
- Silhouette-defining elements the canonical design relies on for readability (see
  [silhouette.md](silhouette.md)).
- Anything the user has marked as a hard constraint (see SKILL.md, "Constraints override
  taste").

Everything else — material richness, atmosphere, lighting, scene dressing, prop placement,
accent/heraldry choices, roof/façade enrichment (see
[roofs-and-facades.md](roofs-and-facades.md)) — is fair game for amplification.

## Working process

1. Start only from a confirmed canonical design (SKILL.md's Canonical Build Mode
   workflow, at least through LOD1/2). Hero Visualization amplifies a design; it does not
   invent one.
2. Identify the Canonical Mass elements worth amplifying and state the amplification per
   element (see [massing.md](massing.md)'s Architectural Amplification Mass — always
   traceable to a real canonical element).
3. Decide Scene Support elements: props, staging, environmental storytelling (see
   [composition.md](composition.md), "Building composition vs. presentation composition").
4. Decide presentation-only material layers: Accent Palette and Atmosphere Palette (see
   [block-palettes.md](block-palettes.md)).
5. Decide scene composition: camera, lighting, environment, settlement backdrop (see
   [templates/hero-render-brief.md](../templates/hero-render-brief.md) for the concrete
   fields).
6. Write the Hero Render Brief, explicitly separating canonical truths / must-not-change
   from allowed amplification and scene dressing.
7. Generate a preview per SKILL.md's "Preview generation priority" — real image generation
   if the environment has it, otherwise the massing/blueprint SVG.
8. Review the result: canonical truth intact? Silhouette correct? Function readable? Do
   the embellishments help identity or fight it? If the preview reveals a weakness in the
   canonical design itself (not just the presentation), go back and fix the canonical
   design — a hero image papering over a weak building is a design failure, not a
   presentation success.

## Common failure modes to avoid

- **Silent contradiction** — presenting a version that changes canonical facts (a
  different roof form, a different number of stories, a different footprint shape)
  without flagging it as a canonical revision.
- **Unlabeled scene support** — describing props/staging in a way that could be mistaken
  for part of the buildable structure.
- **Amplification without a canonical anchor** — inventing an "enrichment" that doesn't
  correspond to any real element in the canonical design (that's not amplification, it's
  an unreviewed design addition — route it back through the canonical workflow instead).
- **Presentation excuse for weak architecture** — using atmosphere, props, or lighting to
  distract from massing/silhouette problems in the canonical design rather than fixing
  them (this is the hero-mode version of [design-principles.md](design-principles.md)'s
  "Decoration reinforces, it doesn't rescue").
- **Conservatism mistaken for discipline** — refusing all amplification "to stay safe"
  produces a generic, forgettable image and defeats the purpose of this mode. The
  discipline is in labeling and traceability, not in minimizing richness.
