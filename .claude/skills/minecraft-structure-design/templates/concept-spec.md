# Concept Spec Template (LOD0 / LOD1)

Use for early-stage design conversations. Do not include block lists, exact dimensions, or
construction detail at this level — see SKILL.md's LOD system.

```markdown
## Structure: <name/type>

### Intent
- Type: <house / castle / tower / bridge / shrine / ...>
- Style: <style, or "unspecified — ask">
- Purpose: <what it's for, if known>
- Scale: <rough size impression, if known>
- Biome/environment: <if known>
- Isolated / part of a settlement: <if known>
- Constraints given: <list, or "none given">

### Design thesis
<One or two sentences naming the core visual idea. E.g. "A low stone mountain monastery
organized around a tall central bell tower, with smaller timber wings stepping naturally
down the slope.">

### LOD0 — Concept
- Mood: <words that capture the intended feeling>
- Broad visual direction: <one short paragraph>

### LOD1 — Composition (include once the concept is agreed)
- Primary mass: <description>
- Secondary masses: <description, or "none">
- Silhouette: <what the outline reads as>
- Proportions: <rough height/width relationship>
- Approximate palette: <role-based, e.g. "stone foundation, timber frame, dark wood roof">

### Preview (render and confirm before going further — see SKILL.md, "Generating a preview")
Express the primary/secondary masses above as a massing sketch and render it with
`tools/blueprint_preview.py`:

```json
{
  "boxes": [
    { "pos": [0, 0, 0], "size": [11, 5, 9], "color": "#8a8578", "label": "primary mass" },
    { "pos": [11, 0, 2], "size": [4, 3, 5], "color": "#6f5a3f", "label": "kitchen wing" },
    { "pos": [3, 5, 3], "size": [3, 6, 3], "color": "#556677", "label": "bell tower" }
  ]
}
```

- `pos` / `size` are `[x, y, z]` in blocks (x = width axis, y = height/up axis, z = depth
  axis) — approximate is fine at this stage, they don't need to match the eventual LOD3
  dimensions exactly.
- `color` is optional (a distinct default color is assigned per box if omitted); pick
  something roughly indicative of the intended material, not the final palette.
- `label` should name what the box is standing in for, matching the Primary/Secondary
  mass description above.

Run: `python tools/blueprint_preview.py massing.json --output massing.svg`, then show the
result to the user (inline if the environment supports it) and wait for confirmation
before proceeding to LOD2 and beyond.

### Taste notes
- Relevant Taste Profile dimensions applied: <list, or "no established profile yet">
- Deliberate deviations from taste, if any, and why: <...>

### Canonical build truth (fill in once LOD1 is confirmed)
- Canonical envelope: <rough footprint × height, the real buildable envelope>
- Canonical truths: <the facts a Hero Visualization must not contradict — see
  references/hero-visualization.md>
- Core masses: <primary/secondary masses, Canonical Mass tier only — see references/massing.md>

### Hero Visualization seeds (optional — only if the user wants a hero/concept preview;
full brief goes in templates/hero-render-brief.md, this is just the handoff)
- Hero silhouette accents: <candidate Architectural Amplification elements — see
  references/silhouette.md, "Hero silhouette accents">
- Architectural amplification opportunities: <candidate elements from references/massing.md>
- Scene support elements: <candidate props/staging — see references/massing.md>
- Must-preserve truths: <carry forward from "Canonical truths" above>
- Allowed presentation embellishments: <what's fair game to amplify>
- Presentation mood: <...>
- Environment cues: <setting, backdrop>
- Suggested props: <...>
- Image-AI render notes: <faithful interpretation, not literal tracing>
- Recommended camera angle: <...>
- Lighting / time of day: <...>
- Settlement backdrop: <present/absent>

### Open questions
<Anything genuinely ambiguous that needs the user's input before proceeding — don't
invent answers to these.>
```
