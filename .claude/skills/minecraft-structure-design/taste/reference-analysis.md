# Reference Analysis Process

Step-by-step process for turning one or more user-supplied references into Taste Profile
updates. See [../references/taste-analysis.md](../references/taste-analysis.md) for the
underlying analysis categories and the observed/possible/confirmed distinction this
process produces.

## 1. Collect and scope

Note what was actually provided (screenshots, a Minecraft build, Pinterest links, concept
art, photographs, real architecture references, or several unrelated-looking examples) and
whether the user framed it as "here's my taste" vs. "build me this" vs. "here's what I
don't like." That framing changes what tier of claim is appropriate — an explicit "I like
this" is stronger evidence than a reference offered without comment.

## 2. Analyze each reference individually

For each reference, run it through the categories in
[../references/taste-analysis.md](../references/taste-analysis.md) (overall form,
silhouette, composition, depth, structural language, material language, detailing,
atmosphere) using [../templates/reference-analysis.md](../templates/reference-analysis.md).
Record only observed features at this step — no preference language yet.

## 3. Compare across references

If more than one reference was provided, look for:

- features repeated across different styles/structure types (strongest signal of a
  general taste, not a style artifact);
- features present in every reference vs. only some;
- direct contradictions between references (record as genuinely unclear, don't average).

## 4. Classify each candidate feature

For every recurring or notable feature, state explicitly which tier it belongs to:
Observed feature / Possible preference / Confirmed preference (see
[../references/taste-analysis.md](../references/taste-analysis.md)). A feature only
reaches "confirmed" through the confidence-building conditions in
[taste-profile-schema.md](taste-profile-schema.md).

## 5. Update the Taste Profile

- Map each classified feature onto the relevant schema dimension(s) in
  [taste-profile-schema.md](taste-profile-schema.md) — don't force a feature into a
  dimension it doesn't fit.
- Assign or adjust confidence per the rules there.
- Sort into Hard / Soft / Contextual, or into `avoid` for negative taste.
- Leave dimensions with no evidence blank — do not fill gaps with assumed defaults.

## 6. Report back in grammar form, not a style label

Summarize the update the way [../references/taste-analysis.md](../references/taste-analysis.md)
describes — as a portable design-grammar statement — not as "this is style X." Tell the
user what was updated and at what confidence, so they can correct it if the read is wrong.

## 7. Never let this block using the reference for the current design

Analysis and application can happen together: extract the grammar, apply the relevant
tiers of it to the structure actually being designed (subject to "Context overrides
taste" in SKILL.md), and update the persistent profile as a side effect — don't make the
user wait through a separate "analyzing your taste" step before getting a design.
