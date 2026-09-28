# [wayfinder:research] Mapillary API/commercial terms & Bangkok bus-stop coverage

**Parent map:** [Phase 2 Spec — Public Transit Decision & Recovery Assistant](../map-phase2.md)

**Status:** closed (resolved by research agent)
**Blocked by:** none
**Blocks:** none yet — resolving this is what would let Bus Stop Photos (`StopImage`)
graduate out of fog on [map-phase2.md](../map-phase2.md), if the answer clears the bar.

## Question

[P02](P02-revisit-imagery-ocr-source.md) found that Mapillary now documents all images
under **CC-BY-SA** (a material change from [T02](T02-stop-imagery-source.md), which
found no source clearing the licensing bar) — but explicitly stopped short of two
things, which this ticket picks up:

1. **API/commercial terms**: Mapillary's image *license* (CC-BY-SA) is separate from
   its *service* terms. Read Mapillary's actual Terms of Use and Commercial Terms (not
   just the CC-BY-SA image-license page) — confirm whether pulling images via its API
   for a commercial consumer product (BusNavigateApp) is permitted, what attribution
   the API/ToS requires beyond the bare CC-BY-SA text (per-image credit? app-wide
   credit, like T08's OSM handling?), any rate limits, and any cost (is API access
   free, or does commercial use require a paid tier?).
2. **Bangkok bus-stop coverage**: Does Mapillary actually have meaningful street-level
   imagery coverage at/near Bangkok bus stops specifically (not just "some coverage of
   Bangkok generally")? If possible, spot-check coverage near a handful of real
   Namtang GTFS bus stop coordinates (already ingested per T01/T03) using Mapillary's
   coverage/viewer tools or API, and report what fraction plausibly have usable nearby
   imagery. If exhaustive spot-checking isn't feasible, report what Mapillary's own
   documentation/blog/coverage-map claims about Thailand/Bangkok coverage, and how
   confident that claim is.

Apply the same diligence bar as T02/T01: quote the specific clause/page that supports
whatever verdict is reached, don't assume.

## Resolution

**Correction (2026-09-28):** the original resolution below claimed Mapillary's Terms of
Use page was login-gated and section 12 unreadable. That was **wrong** — the page is
public at https://www.mapillary.com/terms, no account needed. Verified directly by
fetching the live page. Section 12 text and a previously-unnoticed Section 5
prohibition are quoted below; this materially changes the verdict.

**Section 12 (Commercial Purposes), quoted in full:**
> You may use the Mapillary Services only for the following commercial purposes: (i)
> improvement, training, and development of products, services, maps, studies,
> platforms, websites, applications, software, algorithms, datasets, solutions, or
> technologies; and (ii) in the provision of services for or on behalf of one or more
> of your clients. You will implement and maintain (i) technical safeguards and
> business processes that prohibit reidentification or unblurring of any Content,
> including any individual or license plate; and (ii) business processes to prevent
> inadvertent disclosure or release of any Content, and notify
> vendor-incident@meta.com of any incident, infraction, or other activity related to
> the foregoing i and/or ii that may be considered an unauthorized or unlawful
> processing of Content or User Content.

Commercial use is permitted under (i) ("development of ... applications") — plausibly
covers BusNavigateApp — subject to a real operational obligation: technical/business
safeguards against re-identifying/unblurring faces or license plates, plus an incident
notification duty to Meta.

**New finding — Section 5 (Prohibited Conduct) explicitly bans:**
> Use any Mapillary Services with any products, systems, or applications for or in
> connection with real-time navigation or route guidance, such as to turn-by-turn
> route guidance that is synchronized to the position of a sensor-enabled device, or
> with any systems or functions for automatic or autonomous control of vehicle or
> device behavior.

**This is a real risk, not resolved by this ticket.** BusNavigateApp's entire
Destination (per map.md) is route guidance — trip planning, get-off alerts, wrong-bus
recovery — all synchronized to the user's live location. The clause's plain text bans
using "Mapillary Services" with an "application ... for or in connection with
real-time navigation or route guidance," not narrowly "using Mapillary as the
navigation data source." Whether displaying a single static reference photo inside a
navigation-purposed app falls inside that ban is genuinely ambiguous and **not
something this research can responsibly call either way** — it needs an actual legal
read, not another desk-research pass.

**Revised verdict:** `StopImage` via Mapillary is **not clearable by research alone**
— it needs a legal/compliance judgment call this ticket cannot make, on top of the
still-unresolved Bangkok bus-stop coverage question (unchanged from the original
finding below). Recommend treating Mapillary as **not viable for Phase 2** rather than
pending further research, since the blocker is now a legal-risk judgment call, not a
missing fact.

---

**Original resolution (superseded by the correction above, kept for record):**

**Verdict:** **Do not make Mapillary a mandatory `StopImage` dependency yet.** Mapillary's current official FAQ and introduction explicitly support free commercial use, and its API is available for application integration. However, Mapillary's current Terms of Use page is login-gated; its public download documentation says the relevant Commercial Terms are section 12, but the current section-12 text could not be independently read/quoted without authentication. Because this ticket requires direct verification of the actual commercial clause, the strict legal bar is **not fully cleared from publicly accessible evidence alone**.

For implementation, Mapillary's current image documentation requires CC-BY-SA attribution, and current Mapillary API guidance says an app serving downloaded images should visibly attribute and link to Mapillary/the corresponding image. Current Mapillary staff guidance reports a 50,000 tile requests/day limit per app ID, with possible earlier IP-based blocking; commercial use itself is free.

**Bangkok coverage:** Mapillary imagery definitely exists in Bangkok/Thailand, but no authoritative source reviewed provides a bus-stop coverage percentage. A 2018 Mapillary community post documents about 3,000 km of imagery on a route starting/ending in Bangkok, while current Mapillary documentation provides coverage layers for inspecting actual sequences. This is evidence of general Bangkok/Thailand coverage, not proof that individual Namtang bus stops have usable imagery.

Full findings: [mapillary-api-coverage.md](../research/mapillary-api-coverage.md).
