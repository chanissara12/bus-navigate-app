# Taste Analysis

How to turn a reference (screenshot, Minecraft build, Pinterest link, concept art,
photograph, architecture reference) into reusable design grammar, without merely labeling
it by style and without copying it.

## Bad vs. better analysis

- Bad: "This is medieval."
- Better: "The user appears to prefer dominant central masses, layered rooflines, deep
  façades, strongly projected secondary volumes, and controlled asymmetry."

A style label tells you the vocabulary; it tells you nothing about *why the user chose
this particular reference* out of everything else in that style. The goal is always the
second kind of statement.

## What to inspect per reference

Work through these categories (mirrors the Design Layers a structure is built through):

- **Overall form** — dominant mass, secondary masses, vertical vs. horizontal emphasis,
  footprint character, scale.
- **Silhouette** — roof shape, towers, spires, chimneys, overhangs, height variation.
- **Composition** — symmetry, asymmetry, hierarchy, focal points, balance.
- **Depth** — recesses, projections, balconies, buttresses, framing, façade layering.
- **Structural language** — visible supports, foundations, columns, timber frames, arches,
  beams.
- **Material language** — primary material, secondary material, structural material,
  accent material, material contrast.
- **Detailing** — density, repetition, scale, pattern language.
- **Atmosphere** — clean, weathered, ruined, warm, imposing, whimsical, industrial,
  mystical.

Use [templates/reference-analysis.md](../templates/reference-analysis.md) to capture this
per reference.

## Three tiers of claim

Always distinguish these explicitly when writing up an analysis — don't collapse them into
one statement:

1. **Observed feature** — what is literally present in this one reference (e.g. "this
   building has a three-tier roof").
2. **Possible preference** — a hypothesis that this feature reflects a recurring taste,
   not yet confirmed by repetition or explicit statement (e.g. "may indicate a preference
   for roof layering").
3. **Confirmed preference** — supported by repetition across references, explicit user
   statement, or repeated selection of designs containing the feature (see the confidence
   system in [../taste/taste-profile-schema.md](../taste/taste-profile-schema.md)).

Never write up a single reference's features as tier 3. A single reference can only ever
produce tier 1 observations and, at most, tier 2 hypotheses.

## Finding recurring patterns across multiple references

When several references are provided together (including "several unrelated-looking
examples"):

- Look for the same feature appearing across different styles/structure types — this is
  the strongest signal, since it isn't explainable by "that's just what this style looks
  like."
- Note features that appear in every reference vs. features that appear in only some —
  universal features are stronger candidates for Hard/Soft Preferences; partial ones are
  candidates for Contextual Preferences (see the Taste Profile categories).
- Flag contradictions explicitly rather than averaging them away — e.g. two references
  with opposite symmetry only means symmetry preference is genuinely unclear, not that the
  user wants "medium symmetry."

## Extracting design grammar instead of copying

Once features are identified, restate them as a portable compositional formula rather than
as a description of the specific building:

```
dominant central mass
+ stepped secondary volume
+ steep layered roof
+ recessed entrance
+ projected upper floor
+ strong foundation
```

This grammar is what gets applied to a new, unrelated structure — e.g. grammar learned
from a Town Hall reference can inform a blacksmith, barracks, library, tavern, train
station, or shrine, without any of those looking like copies of the Town Hall. Never
reproduce a reference structure block-for-block unless the user explicitly asks for
replication and it's appropriate to the request (e.g. rebuilding a real-world landmark).

## When the user gives feedback instead of a reference

Feedback on a design in progress is also reference material — see
[../taste/preference-evolution.md](../taste/preference-evolution.md) for how to extract
the underlying architectural characteristic from feedback like "this roof is too busy"
rather than storing only "user disliked this roof."
