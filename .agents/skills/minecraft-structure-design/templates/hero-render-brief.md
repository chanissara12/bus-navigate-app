# Hero Render Brief Template

Use once a canonical design (at least LOD1/2, per SKILL.md's Canonical Build Mode
workflow) is confirmed and the user wants a hero/concept/promotional-style presentation.
Full process in [../references/hero-visualization.md](../references/hero-visualization.md).

Keep this document clearly separate from the canonical spec (concept-spec.md /
structure-spec.md) — never let presentation language drift into the canonical LOD2/LOD3
sections, and never let canonical dimensions get silently overwritten by a presentation
value.

```markdown
## Hero Render Brief: <structure name/type>

### Canonical truths (from the confirmed design — do not restate loosely)
- Structure type/function: <...>
- Primary mass: <...>
- Secondary masses: <...>
- Silhouette-defining elements: <roofline, towers, projections that make this readable>
- Style: <...>

### Must not change
List what would break this structure's identity if an image-AI tool or presentation
pass altered it — see references/hero-visualization.md, "What must never change without
an explicit canonical revision":
- <e.g. "must remain a single-story longhouse, not a multi-story keep">
- <e.g. "twin gate piers must remain twin and remain the primary entrance">
- <e.g. "stepped roof profile must remain stepped, not simplified to one plane">

### Allowed amplification (Architectural Amplification Mass — see references/massing.md)
For each, name the real canonical element it amplifies:
| Canonical element | Amplification allowed |
| --- | --- |
| e.g. gate frame | heavier, more imposing framing; deeper reveal |
| e.g. roof | steeper visual read, stronger ridge, sharper shadow |
| e.g. façade | more depth than the LOD3 minimum; visible timber framing |

### Architectural enrichment (roof / facade / supports — see references/roofs-and-facades.md)
- Roof: <deeper eaves / stepped hierarchy / exposed brackets / material transitions / ...>
- Façade: <reinforced entrance / banners / lantern brackets / slit windows / rhythm / ...>
- Structural expression: <braces, buttress-like supports reinforcing real load paths>

### Scene dressing (Scene Support Mass — see references/massing.md)
- Props: <crates, barrels, weapon racks, carts, work props, ...>
- Identity markers: <banners, heraldry, faction colors>
- Environmental storytelling: <what the scene implies — busy vs. abandoned, in-use vs. derelict>

### Environment
- Setting: <e.g. medieval settlement, castle wall, farmland, workshop court, isolated site>
- Settlement backdrop: <present/absent, and what it implies about scale/context>
- Terrain/weather cues: <if relevant>

### Camera
<e.g. "3/4 front hero angle", "RTS-like elevated view", "low dramatic hero angle looking up
at the entrance">

### Lighting
<e.g. "warm sunset, long shadows", "overcast, flat even light for legibility", "torch-lit
evening, warm pools of light at entrances">

### Presentation mood
<A short phrase capturing the intended feeling — imposing, welcoming, weathered and lived-
in, pristine and ceremonial, etc.>

### Image-AI render notes
<Anything the generation step needs explicitly, e.g. "faithful interpretation, not literal
block tracing — see references/hero-visualization.md" plus any style/reference cues.>

### Preview review (fill in after a preview is generated)
- Canonical truth intact? <yes/no + notes>
- Silhouette still correct? <yes/no + notes>
- Function still reads? <yes/no + notes>
- Embellishments helping or fighting identity? <notes>
- Action: <finalize / refine canonical design / refine brief only>
```
