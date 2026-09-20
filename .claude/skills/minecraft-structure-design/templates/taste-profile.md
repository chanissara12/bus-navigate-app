# Taste Profile — <user/project name>

Instantiate one copy of this file per user (or per project/world, if a user wants
separate taste profiles for separate worlds) and store it outside this skill — see
SKILL.md, "Where the Taste Profile lives." Leave every field blank until there's real
evidence for it; see [../taste/taste-profile-schema.md](../taste/taste-profile-schema.md)
for what each dimension means and how confidence is assigned.

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

preferences:
  # <feature>:
  #   value: preferred | avoided | contextual
  #   confidence: 0.0–1.0

hard_preferences:
  # - <rule confirmed repeatedly, applied nearly universally>

soft_preferences:
  # - <generally preferred, yields to context>

contextual_preferences:
  # - <feature>: <the context it applies in>

avoid:
  # - <design characteristic the user dislikes, not just a rejected object>

history:
  # Optional running log of what evidence produced/changed each entry, e.g.:
  # - 2026-09-18: raised roof_language.complexity confidence after user rejected a
  #   heavily tiered roof on a small structure — see preference-evolution.md
```
