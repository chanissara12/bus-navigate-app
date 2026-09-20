# Example: Bridge

Demonstrates terrain integration driving the entire design thesis, and a structural
element (the bridge itself) being the primary mass rather than a building.

## Intent
- Type: bridge
- Style: industrial (user-specified)
- Purpose: crossing a river gorge, connecting two settlement halves
- Site: rocky gorge, moderate width, river well below

## Design thesis
A riveted iron truss bridge carried on two stone piers seated directly on the gorge's
natural rock ledges, so the crossing reads as an engineered response to this specific
site rather than a generic span dropped between two arbitrary banks.

## LOD1–2
- Primary mass: the truss span itself — through-truss, so the structural frame is the
  visible architecture, not cladding hiding it (references/block-palettes.md,
  Structural Frame role carries the whole design here).
- Secondary masses: two stone piers, each shaped to match the specific rock ledge it sits
  on rather than identical twins — this is the terrain-integration move
  (references/terrain-integration.md, "organic" pairing with an industrial style, a
  deliberately non-default combination).
- Structural language: exposed diagonal truss members, riveted-plate gusset details at
  every joint, visible expansion joints at each pier — all load-path-explaining, not
  decorative.
- Rhythm: truss bay spacing is constant across the span, giving the crossing a clear
  visual meter; the piers break that rhythm intentionally at the two support points.
- Palette: oxidized-copper/iron-block truss, stone-brick piers with a cut-stone cap
  course, minimal accent (lantern posts at each end only, marking the crossing points).

## Terrain integration note
The piers' irregular basing on the rock ledges — rather than both piers being identical
poured-looking stone blocks — is what keeps this from reading as a bridge "placed over"
the gorge instead of built into it. This is a terrain decision, made before any truss
detailing was designed.
