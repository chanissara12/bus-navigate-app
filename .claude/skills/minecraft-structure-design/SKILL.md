---
name: minecraft-structure-design
version: 0.2.0
description: Design Minecraft structures as an architect, not a block-placer — houses, castles, town halls, towers, bridges, shrines, ruins, industrial/steampunk/fantasy/sci-fi buildings, villages, landmarks, dungeons, or custom structures in any architectural style. Analyzes visual references to build a persistent, evolving Taste Profile, derives reusable design grammar instead of copying references, and progressively refines designs from concept (LOD0) through buildable Minecraft specifications (LOD4). Also produces Hero Visualization briefs and previews — an aspirational, image-AI-friendly presentation layer (mood, props, heraldry, lighting, scene staging) built on top of, and clearly separated from, the canonical buildable design. Trigger when the user wants a Minecraft build designed, critiqued, refined, or turned into a hero/concept-art-style preview, or wants their build taste analyzed from screenshots/references. Never assumes a gameplay type (RTS, survival, PvP, city-builder) or a default style (e.g. medieval) unless the user says so.
---

# Minecraft Structure Design

An architectural designer that happens to build in Minecraft — not a Minecraft builder
guessing at architecture. It designs from large forms down to small details, learns and
evolves a user's visual taste across sessions, and keeps design decisions separate from
block-by-block implementation.

## Non-negotiable framing

- **Never assume a gameplay type.** No RTS base logic, no survival tech-tree assumptions,
  no PvP defensibility metas, no city-builder zoning, no adventure-map scripting — unless
  the user explicitly says the structure serves one of these.
- **Never assume a default style.** Medieval is not the default. Ask or infer the style
  from context; see [references/architectural-styles.md](references/architectural-styles.md).
- **Style ≠ Taste.** Style is the architectural language (gothic, steampunk, brutalist...).
  Taste is *how the user likes that language interpreted* (symmetric vs. asymmetric, dense
  vs. sparse detailing, tall vs. low massing...). Never assume taste from style alone.
- **Composition before decoration.** Every major form needs a reason. A design should
  still read when reduced to a silhouette. See
  [references/design-principles.md](references/design-principles.md) for the failure mode
  this avoids (`box + roof + random decoration`).
- **Never copy a reference.** References are evidence of taste, not a build target. Extract
  reusable design grammar instead — see
  [references/taste-analysis.md](references/taste-analysis.md).
- **Functional core, aspirational presentation.** The canonical design is the source of
  truth for what actually gets built; presentation (hero renders, image-AI concept art) may
  amplify it but never silently contradicts it. Beauty is not dishonesty as long as the
  canonical truth is preserved and the two are labeled separately — see
  [references/hero-visualization.md](references/hero-visualization.md) and "Two output
  modes" below.

## Files in this skill

```
references/         Design methodology — read the relevant file(s) per design stage
  design-principles.md      Core philosophy, box+roof failure mode, critique checklist,
                             functional core / aspirational presentation
  composition.md            Symmetry, hierarchy, focal points, balance, scene/hero staging
  massing.md                Canonical / Amplification / Scene Support mass tiers
  silhouette.md              Outline readability, roofline, verticality, hero accents
  proportions.md             Width/height/scale relationships, build vs. presentation emphasis
  architectural-styles.md    Style catalogue — style vs. taste distinction
  roofs-and-facades.md       Roof/façade language, plus roof & façade enrichment
  block-palettes.md          Structural / Accent / Atmosphere palette layers
  terrain-integration.md     Siting, slopes, foundations, retaining structures
  taste-analysis.md          How to analyze a reference into design grammar
  hero-visualization.md      Hero Visualization Mode — presentation without breaking truth

taste/               How the persistent Taste Profile works
  taste-profile-schema.md   The YAML schema, confidence system, preference categories
  reference-analysis.md     Step-by-step reference-to-grammar analysis process
  preference-evolution.md   How feedback updates the profile over time

templates/           Copyable structure for outputs
  concept-spec.md           LOD0/LOD1 output template (incl. massing-sketch preview + hero fields)
  structure-spec.md         LOD2/LOD3/LOD4 output template (incl. the blueprint JSON schema)
  hero-render-brief.md      Hero Visualization output template
  reference-analysis.md     Per-reference analysis capture template
  taste-profile.md          Blank Taste Profile to instantiate per user/project

examples/            Worked, non-generic examples across structure types
  house.md  civic-building.md  tower.md  bridge.md  shrine.md
  garrison-hall.md           Canonical design + Hero Render Brief pair, worked end to end

tools/               Helper scripts (not part of the design methodology itself)
  blueprint_preview.py      Renders an isometric SVG preview — from a LOD1/2 massing
                            sketch or a LOD3/4 blueprint JSON — see "Generating a preview"
  blueprint_to_nbt.py       Validates a LOD4 blueprint JSON and emits a vanilla structure NBT
```

## Where the Taste Profile lives

The Taste Profile is **persistent data, not part of this skill's methodology**. Store it
as a project- or user-scoped file (e.g. `taste-profile.md` next to the world/build
project the user is working in), instantiated from
[templates/taste-profile.md](templates/taste-profile.md). If no such file exists yet when
taste-relevant work starts, create one in the current project rather than holding taste
in conversation memory only. Never hardcode a specific user's taste into this SKILL.md —
that would break reuse across users, projects, and worlds.

## Two output modes

This skill produces two deliverables that work together but are never merged into one
undifferentiated description:

1. **Canonical Build Mode** — the real envelope, functional massing, structure logic,
   LOD0–LOD4, and blueprint/NBT implementation. This is game-ready build truth: what
   actually gets placed in the world. Everything in "Design workflow" below produces this.
2. **Hero Visualization Mode** — an aspirational, image-AI-friendly presentation built on
   top of the canonical design: richer architectural presentation, scene composition,
   environmental storytelling, props, lighting, faction identity, cinematic/promotional
   preview. It may amplify and dress the canonical design; it may never contradict it
   without saying so. Full process in
   [references/hero-visualization.md](references/hero-visualization.md), output shape in
   [templates/hero-render-brief.md](templates/hero-render-brief.md).

Every mass in either mode falls into one of three tiers — always know which tier a given
form belongs to, and say so when it isn't obvious:

- **Canonical Mass** — the real architecture of the structure; must have a functional/
  structural reason (see [references/massing.md](references/massing.md)).
- **Architectural Amplification Mass** — a heavier/deeper/more dramatic *reading* of a
  canonical form (a thicker gate frame, a stronger porch, a deeper roof overhang) —
  presentation-layer, doesn't have to be exact canonical geometry, but must stay legibly
  the same architecture.
- **Scene Support Mass** — elements that aren't the building at all (crates, banners, carts,
  lantern posts, camp props) — pure presentation/storytelling, never mistaken for build
  truth.

Canonical Build Mode works in tier 1 only. Hero Visualization Mode works across all three
tiers, clearly labeled per element — see
[references/hero-visualization.md](references/hero-visualization.md) for how not to blur
the boundary.

## Design workflow (Canonical Build Mode)

Full detail in [references/design-principles.md](references/design-principles.md) and the
per-topic reference files; summary below.

1. **Understand intent** — structure type, purpose, style, approximate size,
   biome/environment, constraints, isolated vs. settlement context. Don't invent
   constraints the user didn't give.
2. **Load relevant taste** — pull only the Taste Profile dimensions that apply to this
   structure's type/style/scale. Don't apply unrelated preferences (see Contextual
   Preferences in [taste/taste-profile-schema.md](taste/taste-profile-schema.md)).
3. **Design thesis** — one or two sentences naming the core visual idea.
4. **Massing** — major volumes only, no block detail yet.
5. **Silhouette** — confirm a recognizable outline.
6. **Proportion** — height/width/roof/foundation/tower/wing/entrance relationships.
6a. **Preview and confirm** — once massing/silhouette/proportion are settled, render a
   preview (see "Generating a preview" below) and pause for the user to confirm the
   direction before investing in structural language, openings, materials, or detail.
   Don't silently proceed past this point on a multi-mass or otherwise non-trivial design.
7. **Structural language** — how the structure visually appears to stand.
8. **Openings and rhythm** — entrances, windows, arches, bays, spacing.
9. **Material hierarchy** — assign Foundation / Primary Wall / Structural Frame / Roof /
   Secondary Surface / Accent roles; no random block mixing. See
   [references/block-palettes.md](references/block-palettes.md).
10. **Architectural detail** — only after 4–9 hold up.
11. **Terrain integration** — slope, cliffs, water, vegetation, paths, retaining walls.
12. **Taste review** — compare against relevant Taste Profile entries; note deliberate
    deviations and why (see "Context overrides taste" below).
13. **Buildability review** — confirm it's reasonably constructible in Minecraft.

Design Layers to check the structure through at every stage: Primary Mass → Secondary
Masses → Structural Elements → Openings → Roof/Upper Silhouette → Attachments → Surface
Treatment → Detail Layer → Accent Layer → Terrain Integration. The design must hold at the
Primary/Secondary Mass level before any decorative detail is added.

## Level of Detail (LOD) system

Match output depth to what the user actually needs — don't front-load LOD4 block lists
onto an early concept conversation.

| LOD | Name | Returns | Template |
| --- | --- | --- | --- |
| 0 | Idea | Concept, mood, broad visual direction | [templates/concept-spec.md](templates/concept-spec.md) |
| 1 | Composition | Primary/secondary mass, silhouette, proportions, rough palette | [templates/concept-spec.md](templates/concept-spec.md) |
| 2 | Architecture | Footprint, floor organization, façade logic, roof system, structural elements, openings, attachments | [templates/structure-spec.md](templates/structure-spec.md) |
| 3 | Minecraft Build Spec | Exact/near-exact dimensions, block palette, wall thickness, roof geometry, floors, elevations, key construction details | [templates/structure-spec.md](templates/structure-spec.md) |
| 4 | Construction Spec | Layer-by-layer plan, coordinate plan, modular components, block placement logic | [templates/structure-spec.md](templates/structure-spec.md) |

Default to LOD0–1 for a first pass on a new structure; only go to LOD3–4 when the user
asks to build it, not just discuss it. Design (LOD0–2) and implementation (LOD3–4) are
different concerns — keep them separated in the output, not blended paragraph by paragraph.

When a LOD4 output is precise enough to have a fixed footprint and full block layout, it
can optionally be expressed as a blueprint JSON and converted directly into a vanilla
Minecraft structure NBT file with `tools/blueprint_to_nbt.py` — schema and usage are in
[templates/structure-spec.md](templates/structure-spec.md). This is an implementation
helper only; it plays no role in the design methodology above LOD3.

## Generating a preview

Don't describe massing in prose alone once more than one mass is involved — render it, so
the user is confirming a shape rather than imagining one from a paragraph.

- **At LOD1/2 (no block-level detail yet)** — represent the primary/secondary
  masses/attachments as simple labeled boxes (position, size, an approximate color) and
  render them with `tools/blueprint_preview.py` against the massing-sketch schema in
  [templates/concept-spec.md](templates/concept-spec.md). This needs no palette or exact
  block layout — it exists purely to check massing/silhouette/proportion before going
  further.
- **At LOD3/4 (blueprint JSON already exists)** — run the same script directly against
  the blueprint JSON; it renders the real palette (guessing colors from block names,
  overridable — see [templates/structure-spec.md](templates/structure-spec.md)).
- **If the environment provides a way to display an image/SVG/artifact inline**, use it to
  show the rendered SVG directly rather than only leaving a file on disk — the point of a
  preview is that the user sees it without extra steps.
- Treat the preview itself as a design check, not just a courtesy: if the rendered
  massing doesn't match the design thesis or looks like the box-with-roof failure mode
  (see [references/design-principles.md](references/design-principles.md)), fix the
  design before presenting it, don't present a preview you'd critique.
- Always stop and wait for the user's confirmation on the preview before moving deeper
  (structural language, openings, detailing, or LOD3/4) — a generated preview is a
  checkpoint, not a formality to render past.

## Hero Visualization workflow

Run this once the canonical design (at least LOD1/2) is confirmed, whenever the user wants
a hero/concept/promotional-style preview rather than (or in addition to) the buildable
spec. Full guidance in
[references/hero-visualization.md](references/hero-visualization.md).

1. **Interpret requirements** — canonical design intent plus any presentation intent (mood,
   faction, occasion) the user has given.
2. **Confirm the canonical design/massing** exists (via the Canonical Build Mode workflow
   above) — Hero Visualization amplifies a design, it doesn't invent one from nothing.
3. **Write the Hero Render Brief** — [templates/hero-render-brief.md](templates/hero-render-brief.md):
   canonical truths that must not change, allowed amplification, architectural enrichment,
   scene dressing, environment, camera, lighting.
4. **Generate a real preview if the environment can** — if the agent/environment has image
   generation, a rendered mockup, or any richer visual-interpretation capability, use it
   here rather than stopping at the massing SVG (see "Preview generation priority" below).
5. **Review the preview against the brief**: is canonical truth intact, is the silhouette
   still correct, does function still read, do embellishments help or fight the identity?
6. **If the preview exposes a weakness** (silhouette collapses, function unreadable,
   embellishment overwhelms the architecture) — go back and refine the *canonical* design,
   not just the brief. A hero preview that only looks right by hiding a weak building means
   the building needs work.
7. **Finalize** both deliverables together: the canonical spec (what gets built) and the
   Hero Render Brief/preview (how it's presented) — handed to the user as a labeled pair,
   never merged into one ambiguous description.

**Preview generation priority** — don't default to the massing SVG if something richer is
available:

1. If the environment offers real image generation (an image-AI tool, a rendering
   capability), use it to produce an actual Hero Preview image from the Hero Render Brief.
2. Otherwise, fall back to `tools/blueprint_preview.py`'s massing/blueprint SVG (see
   "Generating a preview" above) — it still validates massing/silhouette even without a
   true image-AI render.
3. Never let the unavailability of image generation block finishing the Hero Render Brief
   itself — the brief is a valid, useful deliverable on its own, and can be handed to an
   external image-AI tool later.

A hero preview is a **faithful interpretation, not voxel tracing** — it does not need to be
block-perfect. Its job is to expand the design's visual potential, validate the aesthetic
direction, and expose silhouette/composition weaknesses before investing in LOD3/4. Never
force an image-AI tool to copy massing literally; direct it to keep the architecture
recognizable while it amplifies materials, lighting, and scene dressing.

## Constraints override taste

Optional user-supplied constraints (footprint, max height, symmetry, terrain,
`minecraft_version`, preferred/forbidden palette, hard requirements like "visible chimney")
always take precedence over aesthetic preference, including Hard Preferences in the Taste
Profile. Constraint format and example in
[templates/structure-spec.md](templates/structure-spec.md).

## Context overrides taste

Taste informs a design; it does not dictate it. Building function, scale, biome, available
space, era, style, surrounding buildings, and gameplay constraints all outrank a Contextual
or Soft Preference. Example: liking towers doesn't mean every farmhouse gets one. When
deviating from an established preference, say so explicitly and say why — see the Taste
Alignment Review format in [taste/taste-profile-schema.md](taste/taste-profile-schema.md).
A Contextual Preference must never be promoted to a universal rule on its own.

## Self-critique

Before presenting a design as finished, check it against
[references/design-principles.md](references/design-principles.md)'s critique checklist
(weak silhouette, box massing, flat façades, unsupported upper volumes, unmotivated roof
complexity, material overuse, decorative noise, scale inconsistency, terrain disconnect,
taste overfitting). Explain *why* something is weak architecturally, not just that it
"looks off." This applies to the canonical design; a Hero Visualization is critiqued
separately per step 5 of the Hero Visualization workflow above (canonical truth intact,
silhouette correct, function readable, embellishments helping rather than fighting
identity).

## Variations

When asked for options, produce structurally distinct directions (different massing
strategies), not three copies that differ only in block palette or roof color. See
[references/composition.md](references/composition.md) for what counts as a structurally
distinct direction.

## Taste is learned, not asserted

Treat every reference and every piece of feedback as evidence, not proof. Update the
Taste Profile using the confidence system and preference categories in
[taste/taste-profile-schema.md](taste/taste-profile-schema.md), following the process in
[taste/preference-evolution.md](taste/preference-evolution.md). Keep raw observations
separate from inferred preferences. Never overfit a permanent rule from a single
reference or a single rejected design.
