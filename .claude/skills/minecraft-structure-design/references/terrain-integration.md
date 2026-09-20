# Terrain Integration

A structure that sits on the landscape like it was pasted in reads as unfinished
regardless of how good the architecture is in isolation. Terrain integration is a required
design layer (see SKILL.md's Design Layers list), not an optional polish pass.

## What to consider

- **Slope** — does the structure step down a hillside, cut into it, or sit on a leveled
  pad? Each implies different foundation and retaining logic.
- **Cliffs** — cantilevering, embedding into rock, or bridging a gap all read very
  differently and should match the structure's style/function (a fortress embedded in a
  cliff face reads as defensible; a monastery cantilevered over a gap reads as devotional/
  dramatic).
- **Rivers/water** — piers, stilts, bridges, or waterside foundations; consider whether
  water is a boundary the structure respects or a feature it engages with directly (docks,
  water gates, mill wheels).
- **Vegetation** — whether the structure clears vegetation formally (classical, formal
  gardens) or grows around/through it (rustic, ruined, organic, tribal).
- **Foundations** — a visible plinth, retaining wall, or stepped base that resolves the
  structure into whatever grade it sits on, rather than the walls simply intersecting the
  terrain mesh.
- **Retaining walls and terracing** — for sloped sites, terracing the surrounding ground
  is often a better solution than forcing the structure itself to resolve every grade
  change internally.
- **Paths and approach** — how a viewer/player actually arrives at the structure; the
  approach sequence (path, stairs, gate, threshold) is part of the architectural
  experience, not an afterthought added once the building is finished.

## Embedded vs. elevated vs. organic vs. formal

Tracked in `taste_profile.terrain_relationship`. These are independent axes:

- **Embedded** — structure is cut into or surrounded by terrain (cave dwellings, cliffside
  monasteries, bunkers).
- **Elevated** — structure sits above grade on a plinth, stilts, or a raised pad.
- **Organic** — the structure's footprint and grading follow the terrain's natural
  contours.
- **Formal** — the terrain is regraded/terraced to meet the structure's geometry (formal
  gardens, monumental stairs, plazas).

A style can be paired with any of these — a Gothic cathedral can be embedded into a
mountainside or sit on a formal plaza; don't assume the pairing implied by the most common
real-world example of a style.

## When terrain data isn't provided

If the user hasn't specified a site (slope, biome, surroundings), design the structure to
be terrain-agnostic at LOD0–2 and flag terrain integration as an open question before
LOD3–4, rather than inventing a specific site the user never described.
