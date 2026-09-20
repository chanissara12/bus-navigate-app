# Example: Tower

Demonstrates a style the spec explicitly must not default to skipping — sci-fi — and
shows proportion/structural-language reasoning driving a vertical landmark.

## Intent
- Type: freestanding tower
- Style: sci-fi (user-specified) — not a default; confirmed before design started
- Purpose: unspecified beyond "a landmark tower" — treated as a pure vertical focal point,
  no gameplay function assumed (not a turret, not a spawn point, not a resource silo)
- Scale: tall, narrow footprint

## Design thesis
A tapering tower built from three visually distinct stacked segments — a wide braced
base, a slender mid-shaft, and a flared instrument crown — so verticality reads through
proportion change, not just height.

## LOD1 — Composition
- Primary mass: the mid-shaft — narrow, dominant by height even though it isn't the
  widest segment.
- Secondary masses: the base (wider, for visual and structural grounding) and the crown
  (flared, to avoid the "tower is just a tall rectangle" silhouette failure).
- Silhouette: each segment has a different width, so the outline changes at two clear
  break points instead of running as one uninterrupted vertical edge — this is the
  primary landmark-strength move (references/silhouette.md).
- Structural language: exposed diagonal bracing wraps the base segment only, visually
  explaining why a narrow shaft can rise from it — addresses the "unsupported upper
  volume" failure mode from the opposite direction (a wide top would need this; here it's
  a wide bottom justifying a narrow top).
- Palette: dark iron-block/deepslate base with copper bracing accents, smooth
  quartz/light-gray mid-shaft, glass-and-light-accent crown to read as "instrument" from a
  distance.

## Why sci-fi doesn't imply a fixed taste
This tower's brief happens to want strong verticality and a clear landmark read. A
different user's sci-fi tower brief — say, one whose Taste Profile favors low
verticality and horizontal massing — would instead produce something closer to a squat,
wide sensor array with a short mast, still legibly sci-fi, but not vertical. Style
supplies the vocabulary (structural bracing, smooth paneling, light accents); taste
decides how tall, how tapered, how landmark-forward the result is.
