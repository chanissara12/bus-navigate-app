# Silhouette

The silhouette is what a structure reads as from viewing distance, in fog, at night, or
reduced to a flat black shape against the sky. Minecraft's blocky construction and often
long sightlines make silhouette one of the highest-leverage design decisions — more
players will see a structure's outline than will ever inspect its detailing up close.

## What shapes a silhouette

- Roofline: shape, pitch, layering, breaks (dormers, gables, chimneys piercing the line).
- Towers, spires, and any vertical elements that punctuate an otherwise horizontal mass.
- Height variation between primary and secondary masses.
- Overhangs and eaves that widen the silhouette at specific heights rather than leaving a
  uniform vertical edge.

## Verticality vs. horizontality

A structure's silhouette should commit to an emphasis rather than splitting the difference
evenly. A dominant vertical landmark (tower, spire, cliffside monastery) reads as a
landmark from far away; a dominant horizontal composition (great hall, longhouse, factory
floor) reads as substantial and grounded up close. `taste_profile.silhouette.verticality`
and `.landmark_strength` capture how strongly a given user wants this.

## Roofline variation

A single unbroken roofline over a long structure reads as monotonous. Variation —
stepped heights, intersecting roof volumes, a punctuating gable or tower — gives the eye
places to land. This is a silhouette concern first, decoration second: the variation
should come from massing decisions, not from surface ornament pretending to be a roofline
break.

## The reduction test

To evaluate a silhouette: mentally flatten the design to a single-color outline. Ask:

1. Is there an obvious focal point, or does the eye wander with no place to land?
2. Would this outline be distinguishable from a generic box structure of similar size?
3. Does the outline communicate the building's function or importance at all (landmark vs.
   utility vs. domestic), or would any structure type fit this same outline?

If the answer to (2) or (3) is "no, it would look the same," go back to massing before
adding any more detail.

## Hero silhouette accents

Once a canonical silhouette passes the reduction test above, Hero Visualization Mode (see
[hero-visualization.md](hero-visualization.md)) can push specific accents further for
memorability, using the Architectural Amplification Mass tier
([massing.md](massing.md)): roofline emphasis (a ridge read heavier or more sharply than
the canonical minimum), entrance projection, chimney emphasis, a tower crown emphasized
beyond its canonical proportion, or a bell/dais/gate treated as a stronger focal point than
its literal LOD3 geometry.

The concept phase may exaggerate a proportion slightly if it makes function or identity
read more clearly — this is the same tool as
[proportions.md](proportions.md)'s "Exaggeration as a deliberate tool," applied here
specifically for silhouette legibility. The constraint that makes this safe rather than a
drift into a different design: **exaggeration must never change what type of building this
reads as.** A steep-roofed granary emphasized further still reads as a granary; if the
emphasis makes it read as a chapel instead, it has crossed from amplification into altering
canonical identity, and that's out of scope for presentation-layer work — it would need to
go back through the canonical design workflow instead.
