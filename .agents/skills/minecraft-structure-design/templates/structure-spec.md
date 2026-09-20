# Structure Spec Template (LOD2 / LOD3 / LOD4)

Use once a design has passed LOD0–1 and the user wants architecture-level or
implementation-level detail. Keep LOD2 (architecture) and LOD3/4 (implementation) in
clearly separate sections — see SKILL.md, "Design (LOD0–2) and implementation (LOD3–4)
are different concerns."

```markdown
## Structure: <name/type>

(Carry forward Intent, Design thesis, and Taste notes from the concept spec.)

### LOD2 — Architecture
- Footprint: <shape and organization>
- Floor organization: <number of floors, what's on each>
- Façade logic: <depth, rhythm, repetition — see references/roofs-and-facades.md>
- Roof system: <form, pitch, layering — see references/roofs-and-facades.md>
- Structural elements: <how it visually stands — frame, buttress, columns, etc.>
- Openings: <entrances, windows, arches, and their hierarchy>
- Attachments: <towers, porches, outbuildings, and why each exists>

### LOD3 — Minecraft Build Specification
- Overall dimensions (W × H × D): <...>
- Wall thickness: <...>
- Material palette by role (see references/block-palettes.md):
  | Role | Block(s) |
  | --- | --- |
  | Foundation | |
  | Primary Wall | |
  | Structural Frame | |
  | Roof | |
  | Secondary Surface | |
  | Accent | |
- Roof geometry: <exact form/pitch in Minecraft terms, e.g. "2:1 stair-block hip roof">
- Floor elevations: <Y-levels or relative heights per floor>
- Significant construction details: <anything load-bearing/visually critical that a
  builder needs called out explicitly>

### LOD4 — Construction Specification
Only produce this when the user is ready to actually build, not during concept
exploration.

- Layer-by-layer plan or coordinate plan: <...>
- Modular components: <repeated units — a bay, a dormer, a truss segment — defined once
  and reused, rather than re-specified per instance>
- Block placement logic: <ordering/build sequence if it matters, e.g. frame before infill>

#### Optional: emit a buildable blueprint file

For a structure precise enough to have a fixed footprint and full block-by-block layout,
LOD4 can be expressed as a JSON blueprint and converted straight into a vanilla Minecraft
structure NBT file with `tools/blueprint_to_nbt.py`. This is implementation output, not
part of the architectural design itself — only produce it once LOD2/LOD3 are settled.

**Blueprint JSON schema** (`schema_version: 1`):

```json
{
  "schema_version": 1,
  "size": [width, height, depth],
  "palette": {
    ".": "minecraft:air",
    "F": "minecraft:cobblestone",
    "W": "minecraft:oak_planks",
    "L": "minecraft:oak_log[axis=y]"
  },
  "layers": [
    ["FFF", "F.F", "FFF"],
    ["WWW", "W.W", "WWW"]
  ],
  "markers": [
    { "id": "entrance", "pos": [1, 0, 0] }
  ]
}
```

- `size` is `[width, height, depth]` — width = row length (x), height = number of layers
  (y), depth = rows per layer (z).
- `palette` maps single-character symbols to a block state string
  (`minecraft:name` or `minecraft:name[prop=value,...]`); `.` must map to
  `minecraft:air`.
- `layers` has exactly `height` entries; each layer has exactly `depth` rows; each row is
  exactly `width` characters, one palette symbol per character. This is literally the
  structure read bottom-to-top, one horizontal slice per layer.
- `markers` are optional named points (e.g. entrance, anchor) — `pos` must be a 3-int
  `[x, y, z]` inside the structure's bounds unless `"external": true`.

**Converting to NBT:**

```bash
python tools/blueprint_to_nbt.py path/to/blueprint.json --output path/to/structure.nbt
```

Running it without `--output` validates one or more blueprints (glob patterns supported)
and reports block counts without writing a file — useful to sanity-check a generated
blueprint before emitting the NBT. The resulting `.nbt` file loads as a vanilla Java
Edition structure block file (`DataVersion` is pinned in the script — update it there if
targeting a different Minecraft version).
```
