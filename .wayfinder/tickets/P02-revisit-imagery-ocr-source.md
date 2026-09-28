# [wayfinder:research] Revisit bus-stop imagery / OCR / vision source

**Parent map:** [Phase 2 Spec — Public Transit Decision & Recovery Assistant](../map-phase2.md)

**Status:** closed (resolved by research agent)
**Blocked by:** none
**Blocks:** none yet — resolving this unblocks the (not-yet-ticketed) Bus Stop Photos,
OCR Bus Stop Sign, and Landmark Recognition design work; all three stay fog on
[map-phase2.md](../map-phase2.md) until this closes. Crowdsourced Reports is held
alongside them by charting choice, not a technical dependency on this ticket — see
map-phase2.md's Notes.

## Question

Phase 1's [Choose bus-stop imagery & landmark source](T02-stop-imagery-source.md)
closed with **no source clearing the licensing/coverage bar** — Google Street View
Static API, Mapillary, KartaView, and official Thai gov/BMTA data were all checked and
rejected; `StopImage` was deferred entirely, and Bus Stop Context degraded to
OpenStreetMap POI/landmark text only.

This ticket covers two related but distinct sub-questions — investigate both:

**A. Stored bus-stop photo corpus** (for Phase 2's Bus Stop Photos / `StopImage`):
Has anything changed since T02 closed? Re-check the same candidates plus any new ones
(e.g. a Thai government open-imagery initiative, BMTA finally publishing stop photos,
Mapillary coverage specifically for Bangkok bus stops rather than general coverage).
Apply T02's same bar: license must permit commercial use, quote the actual clause.

**B. On-the-fly vision/OCR service** (for OCR Bus Stop Sign + Landmark Recognition):
These process the *user's own just-taken photo* in real time — they don't need a
licensed stored-photo corpus the way `StopImage` does. Investigate vision/OCR services
that could read a bus-stop sign photo (route numbers, Thai text, destination names) —
e.g. Google Cloud Vision OCR, AWS Textract, Tesseract (self-hosted, no licensing
concern but check Thai-script accuracy), Azure Computer Vision. Report cost model, Thai
text accuracy if documented/testable, and whether Landmark Recognition (identifying
*where the user is* from a photo, not what's printed on a sign) is realistically the
same service or a separate capability (e.g. reverse image search / landmark-detection
API vs. plain OCR).

Report A and B as separate verdicts — a source clearing bar A doesn't imply anything
about B, and vice versa.

## Resolution

**A — Stored imagery:** Mapillary's current documentation now says all images are shared under CC-BY-SA, and CC BY-SA permits commercial reuse subject to attribution/ShareAlike. This is a material change from T02. However, API/service use remains subject to Mapillary's terms/commercial terms, and comprehensive Bangkok bus-stop coverage was not verified. Keep Mapillary optional and keep the T02 text-only fallback.

**B — User-photo OCR/vision:** Google Cloud Vision supports Thai OCR and has separate Landmark Detection; Tesseract provides Thai trained data under an Apache-licensed engine and is the self-hosted fallback; Azure Vision also supports Thai OCR. AWS Textract is not suitable for Thai OCR under its documented language limitations.

Full findings: [imagery-ocr-source.md](../research/imagery-ocr-source.md).
