# Mapillary API/commercial terms & Bangkok bus-stop coverage

**Research date:** 2026-09-28

## API / commercial-use findings

Mapillary's current official FAQ says the service is free for organizations and companies and states that Mapillary is "100% free to use—for any use case." Its current introduction likewise says Mapillary is free for commercial, research, and hobby use, and says imagery/data can be used by applications and other commercial geospatial users.

Mapillary's current API documentation confirms that Mapillary provides an API for integrating imagery/data into applications. The official help article directs larger-area downloads to the Mapillary API or Python SDK.

However, the current Terms of Use page itself is not publicly readable when logged out: opening the official Terms URL returns "Not Logged In" and requires login. Mapillary's own download documentation explicitly says imagery/map data are subject to the Terms of Use, "particularly the Commercial Terms (section 12)." Therefore the exact current section-12 text could not be independently read from the public page during this research.

This matters because the ticket requires the actual current commercial clause, not an assumption based only on the CC license. The available official material is strong evidence that commercial use is supported, but the current Terms page being login-gated means this research should **not** claim that the exact current section-12 API permission was directly verified.

### Attribution

Mapillary's current image-license documentation says all images are shared under CC-BY-SA and gives the attribution form as image title + link to the Mapillary image + username + CC-BY-SA.

Mapillary's API demo published in 2026 states that when individual images are downloaded and served from an application's own servers, the application must visibly display attribution and link to the Mapillary homepage or corresponding Mapillary image page. It also states that applications using data extracted by the API/vector tiles must visibly attribute Mapillary and link to the Mapillary homepage. This is a Mapillary community/demo source rather than the Terms page, so treat it as implementation guidance pending direct verification of section 12.

### Rate limits / cost

Mapillary's official FAQ says use is free, including commercial use.

For API limits, a Mapillary staff reply in August 2026 says the documented **50,000 requests/day** limit for tiles is scoped by application ID; the same reply warns that IP-based blocking can occur earlier during sudden spikes and recommends contacting support for other use cases. This is a current Mapillary staff statement, not the legal Terms text.

Older Mapillary staff forum guidance also confirms a 50,000 requests/day tile limit and that rate limits reset every 24 hours.

## Bangkok / bus-stop coverage

Mapillary does not publish a reliable official statistic in the sources reviewed for "percentage of Bangkok bus stops with imagery." Its current map UI is explicitly designed to inspect coverage, including All Captures, Best Captures, and Captures Needed. Best Captures are map-matched; All Captures exposes all uploaded sequences.

A Mapillary community post from 2018 documents approximately 3,000 km of Mapillary imagery uploaded on a route starting and ending in Bangkok and passing through several Thai provinces. This proves Bangkok/Thailand imagery exists, but it is old and is not evidence of present-day coverage at bus stops.

Mapillary's current documentation says coverage can be inspected visually and that each green sequence/point represents imagery; its Web AppBuilder integration can also show the global coverage layer and load the closest image to a clicked point when coverage exists.

No authoritative source found during this run provides a Bangkok bus-stop coverage percentage, and a reliable automated spot-check against Namtang GTFS stop coordinates would require authenticated Mapillary API access. Therefore the coverage verdict is **"imagery exists in Bangkok, but bus-stop-level coverage is unverified and cannot be treated as complete."**

## P04 verdict

**API/commercial:** Mapillary's current public documentation says commercial use is supported and free, and Mapillary provides an API. However, the current Terms of Use / Commercial Terms page is login-gated, so the exact current section-12 commercial clause could not be directly quoted. The ticket's strict legal bar is therefore **not fully cleared by public evidence alone**. Obtain/read the authenticated current section 12 before making Mapillary a mandatory commercial dependency.

**Attribution:** Plan for visible Mapillary attribution and a link to the Mapillary homepage/image page when serving individual images, and CC-BY-SA attribution to the creator.

**Cost:** Official FAQ says free for commercial use.

**Rate limit:** Current Mapillary staff guidance says 50,000 tile requests/day per app ID, with possible earlier IP-based blocking.

**Coverage:** Bangkok imagery is documented, but there is no verified bus-stop coverage percentage. Do not make `StopImage` mandatory based on Mapillary coverage assumptions. If the product uses Mapillary, implement it as an optional/on-demand source with a text-only fallback.

## Recommended next action

Before production adoption, sign in to Mapillary and archive the current Terms of Use section 12 / Commercial Terms in the project research record. Then use the API/coverage layer to sample a defined set of Namtang stop coordinates and record: nearest image distance, capture date, image type, and whether the stop itself is visible.