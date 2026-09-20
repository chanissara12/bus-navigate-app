# Taste Profile Schema

The Taste Profile is persistent data describing how a specific user likes structures to
look — independent of any one style, structure type, or Minecraft world. It lives outside
this skill (see SKILL.md, "Where the Taste Profile lives"), instantiated from
[../templates/taste-profile.md](../templates/taste-profile.md).

## Schema

```yaml
taste_profile:

  massing:
    complexity:
    dominant_mass:
    secondary_mass_frequency:
    fragmentation:

  silhouette:
    complexity:
    verticality:
    landmark_strength:
    roofline_variation:

  symmetry:
    preference:

  proportions:
    width_to_height:
    preferred_scale:
    exaggeration:

  facade:
    depth:
    flatness_tolerance:
    repetition:
    window_rhythm:

  roof_language:
    pitch:
    layering:
    complexity:
    overhang:
    preferred_forms:

  structural_expression:
    exposed_supports:
    beams:
    buttresses:
    columns:
    foundations:

  attachments:
    frequency:
    preferred_types:

  detailing:
    density:
    scale:
    repetition:
    randomness_tolerance:

  palette:
    material_count:
    contrast:
    gradients:
    accent_usage:

  atmosphere:
    realism:
    fantasy:
    weathering:
    age:
    warmth:

  terrain_relationship:
    embedded:
    elevated:
    organic:
    formal:
```

**Do not require every field to have a value.** An unfilled field means "unknown," not
"neutral" or "default medium." Never invent a value to fill a gap — leave it blank and say
so if the user asks what's known about a dimension.

## Confidence system

Every recorded preference carries a confidence score, not a binary yes/no:

```yaml
preferences:
  layered_roofs:
    value: preferred
    confidence: 0.88
  asymmetry:
    value: preferred
    confidence: 0.72
  towers:
    value: contextual
    confidence: 0.45
```

**Confidence increases when:**
- the feature appears repeatedly across independent references;
- the user explicitly states they like it;
- the user repeatedly chooses designs containing it over alternatives that lack it.

**Confidence decreases or is reconsidered when:**
- a new reference contradicts it;
- the user rejects a design containing the feature;
- the feature turns out to belong to one specific style rather than the user's general
  taste (i.e. it was style, not taste — see
  [../references/architectural-styles.md](../references/architectural-styles.md)).

Do not overfit: one reference or one piece of feedback should move confidence
incrementally, not swing it from unknown straight to high confidence.

## Preference categories

**Hard Preferences** — strong design rules repeatedly confirmed by the user, applied
almost universally. Example: avoid completely flat façades; maintain a readable
silhouette; avoid meaningless block noise.

**Soft Preferences** — generally preferred, not mandatory, expected to yield to context.
Example: layered roofs; secondary volumes; controlled asymmetry.

**Contextual Preferences** — appropriate only under specific conditions. Example: towers
on landmarks; dramatic verticality on temples; heavy fortification on military structures.
A Contextual Preference must never be auto-promoted to a universal rule just because the
user likes it in its usual context — see SKILL.md, "Context overrides taste."

## Negative taste

Track dislikes with the same rigor as preferences — equally important, and equally subject
to the confidence system:

```yaml
avoid:
  - box-with-roof composition
  - completely flat walls
  - random block gradients
  - excessive material variety
  - meaningless decorative noise
  - repeated identical façades
  - decorative pieces unsupported by the architecture
```

When a reference or feedback signals dislike, record the underlying *design
characteristic*, not just the rejected object — "dislikes flat walls" generalizes; "dislikes
this specific tavern" does not.

## Taste Alignment Review format

After a design is produced, optionally provide a short alignment review — never an
objective-beauty rating, only alignment with this Taste Profile:

```
Taste alignment

Strong alignment:
- layered roof silhouette
- deep façade composition
- dominant main volume
- controlled asymmetry

Intentional deviations:
- fewer attachments because this is a small rural structure
- simpler palette to preserve visual hierarchy
```

Numeric percentages are optional and, if used, must be labeled as taste-alignment
percentages, never quality scores.
