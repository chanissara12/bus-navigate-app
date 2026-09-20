# Preference Evolution

The Taste Profile is never finished — it updates continuously as the user reacts to
designs, not only when they hand over a fresh reference.

## Extract the underlying architectural preference from feedback

When the user gives feedback, don't store the surface reaction — infer the architectural
characteristic behind it. Keep the raw observation and the inferred preference as separate
records whenever possible, so a bad inference can be corrected without losing the original
feedback.

Example — Thai-language feedback the skill must handle the same way as English:

| User feedback | Raw observation (store) | Inferred preference (store separately) |
| --- | --- | --- |
| "ชอบ A มากกว่า B" (prefers A over B) | user chose A over B | whatever architectural feature A has that B lacks — identify it, don't just log "prefers A" |
| "หลังคานี้เยอะไป" (this roof is too much) | user found this specific roof excessive | `roof_language.complexity` should trend toward less; not "dislikes roofs" |
| "ชอบแบบที่ดูแน่นกว่านี้" (prefers something that looks denser/more solid) | user wants more visual density than what was shown | `detailing.density` or `massing.complexity` trending higher — check which one the design actually varied |
| "ไม่ชอบกำแพงเรียบ" (dislikes flat walls) | user rejected the flat wall | `facade.flatness_tolerance` trending low; candidate for `avoid: completely flat walls` |
| "อันนี้ดู Minecraft จ๋าเกินไป" (this looks too "generic Minecraft") | user rejected default/generic block-game look | likely a `detailing`/`palette` signal — probe further rather than guessing which dimension; don't record a vague "wants less Minecraft-y" with no architectural referent |

For the last example, if the specific cause isn't clear from context, it's fine to ask a
short follow-up ("is it the roof shape, the flat walls, or the block choices that read as
generic here?") rather than guessing and recording a low-confidence, poorly-targeted
update.

## Confidence movement from feedback

Apply the same rules as [taste-profile-schema.md](taste-profile-schema.md)'s confidence
system:

- A single piece of feedback nudges confidence; it doesn't set it to 0 or 1.
- Repeated feedback pointing the same direction compounds confidence.
- Feedback that contradicts an existing high-confidence entry should lower that
  confidence and prompt re-examination, not silently overwrite it.
- If feedback seems to apply only to one style or one structure type, record it as a
  Contextual Preference candidate rather than updating a Hard/Soft Preference.

## Don't overfit to the most recent design

A rejection is evidence about the specific feature the design manipulated, not a
wholesale verdict on the direction. When a design combines many features and gets
rejected, isolate which feature the feedback is actually about before updating anything —
don't lower confidence across every feature the rejected design happened to contain.

## Style-contamination check

Before recording a preference as general taste, check whether it might actually be a
style-specific effect (see [../references/architectural-styles.md](../references/architectural-styles.md)).
If a preference has so far only ever been observed within a single style, keep its
confidence lower and its category as Contextual until it's confirmed across at least one
different style or by explicit user statement.
