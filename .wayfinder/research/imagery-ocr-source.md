# [wayfinder:research] Revisit bus-stop imagery / OCR / vision source

**Parent map:** [Phase 2 Spec - Public Transit Decision & Recovery Assistant](../map-phase2.md)

**Status:** closed (resolved by research agent)
**Blocked by:** none
**Blocks:** none

## Resolution

### A. Stored bus-stop photo corpus

**Verdict:** Mapillary's published image license has changed materially since T02, but it is not a clean Phase-2 "store any Bangkok stop photo forever" decision without checking access/API terms and coverage.

Current Mapillary documentation says **all images on Mapillary are shared under CC-BY-SA**. Creative Commons confirms CC BY-SA permits commercial use, subject to attribution and ShareAlike for adapted material.

Sources:
- https://help.mapillary.com/hc/en-us/articles/115001770409-CC-BY-SA-license-for-open-data
- https://creativecommons.org/share-your-work/use-remix/cc-licenses/

Mapillary also states that imagery/map-data use through its service is subject to its Terms of Use and, for map data, its Commercial Terms. The image license and API/service access terms therefore remain separate checks.

No authoritative source found here establishes comprehensive **Bangkok bus-stop-specific** coverage sufficient to guarantee a StopImage for arbitrary stops. KartaView also uses CC-BY-SA, but its current open-imagery page does not establish comprehensive Bangkok bus-stop coverage.

Sources:
- https://kartaview.org/landing/open-imagery
- https://wiki.openstreetmap.org/wiki/KartaView

**Implementation implication:** do not make `StopImage` a required Phase-2 dependency. Mapillary can be investigated as an optional on-demand imagery source with per-image attribution and explicit API/commercial-terms review. Keep the T02 text-only fallback.

### B. On-the-fly OCR / vision

**Verdict:** Google Cloud Vision is the clearest documented fit for an initial OCR prototype; Tesseract is the self-hosted fallback. Azure Vision is also technically capable. AWS Textract is not a fit for Thai OCR under its documented language limitations.

**Google Cloud Vision**
- Current OCR documentation lists **Thai (`th`)** as supported.
- Text detection/document text detection support language hints.
- Pricing is usage-based per image/feature; the current price table gives the first 1,000 units/month free and lists Text Detection at $1.50 per 1,000 units for the first paid tier.
- Vision also exposes separate `LANDMARK_DETECTION`, returning landmark name, confidence and coordinates.

Sources:
- https://docs.cloud.google.com/vision/docs/languages
- https://cloud.google.com/vision/pricing
- https://docs.cloud.google.com/vision/docs/detecting-landmarks

**Azure Vision**
- Current Azure Vision Read OCR documentation lists **Thai (`th`)** for printed text and supports multilingual OCR.
- No product-level Thai accuracy guarantee for arbitrary bus-stop photographs was found; benchmark with real Bangkok sign photos before final selection.

Source:
- https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/language-support

**Tesseract**
- Tesseract is Apache License 2.0 and its official trained data includes Thai (`tha.traineddata`).
- A 2025 Thai OCR study reports that preprocessing materially improved Tesseract performance, so outdoor-sign accuracy must be tested rather than assumed.
- There is no per-image API fee, but the application owns deployment, preprocessing and tuning.

Sources:
- https://github.com/tesseract-ocr/tesseract
- https://github.com/tesseract-ocr/tessdoc/blob/main/Data-Files.md
- https://www.sciencedirect.com/science/article/pii/S2214579625000036

**AWS Textract**
- Textract pricing is usage-based per page/image.
- AWS's current documented OCR language limitations do not include Thai; an AWS sample guide explicitly identifies Thai as an unsupported-character language requiring an alternative OCR engine.

Sources:
- https://aws.amazon.com/textract/pricing/
- https://github.com/aws-samples/amazon-textract-transformer-pipeline/blob/main/CUSTOMIZATION_GUIDE.md

### OCR vs landmark/location recognition

OCR extracts visible text. Landmark recognition attempts to identify a recognizable physical landmark and can return geographic coordinates. They are separate capabilities.

For "where am I?" the app should combine OCR + GPS + nearby-stop geometry + map/POI data, with landmark detection as an optional signal. A generic bus stop is not guaranteed to be a recognizable landmark.

### Recommended Phase-2 shape

- `BusStopSignOcr`: user photo -> detected text/route candidates/confidence.
- `PhotoLandmarkDetection`: optional image -> recognized landmark/coordinates.
- `StopContextResolver`: combines OCR + current GPS + known stops/routes to identify the likely stop.

Start with Google Cloud Vision OCR and benchmark against a small real Bangkok bus-stop photo set. Keep Tesseract as the self-hosted fallback. Do not make stored third-party stop imagery a prerequisite for the OCR flow.
