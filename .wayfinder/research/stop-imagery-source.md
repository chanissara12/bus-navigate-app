# Research: Bus-stop imagery & landmark data source (T02)

**Question:** What source(s) should supply verified/official bus-stop imagery and
nearby-landmark data (stop photo, surrounding-area photo, road side, crossing points,
nearby buildings/BTS/MRT) for Bus Stop Context (PROPOSAL.md §14), in a
commercial-facing consumer app, for Phase 1?

**Bar to clear (per ticket):** license/ToS must permit *display inside a
commercial-facing consumer app*, not merely "technically viewable" — and must be
affordable/free for a Phase 1 MVP. Every candidate below is judged against that bar.

---

## 1. OpenStreetMap (POI/landmark data — not imagery)

**Verdict: usable for structured landmark/POI data (text + coordinates), not for photos (OSM has none). Commercial display is permitted; only attribution is required for the app itself.**

OSM's data is licensed under the **Open Database License (ODbL) 1.0**.

- Commercial use is explicitly allowed: "You are free to copy, distribute, transmit and adapt our data, as long as you credit OpenStreetMap and its contributors" — [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright).
- The share-alike clause reads: "If you alter or build upon our data, you may distribute the result only under the same license" — same source. Read alone this sounds like it would force the whole app to be ODbL-licensed, but ODbL defines a **"Produced Work"** exception for exactly this case (a map, an app screen, a directions list, etc. rendered *from* the database, as opposed to redistributing the database itself):

  > "If you create a Produced Work, you can apply whatever terms you like to the Produced Work, but you must upon request offer recipients either a copy of your data and any Derivative Databases under the terms of the ODbL or the means of creating the Derivative Databases upon request."
  — [OSM Foundation, Licence and Legal FAQ](https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ)

  In practice: a bus-navigation app that displays "BTS Asok exit 3, 120m from this stop" (derived from OSM nodes) is a Produced Work. The app itself, its code, and its own proprietary BusStop/RouteStop database stay closed-source. Only (a) attribution must be shown, and (b) if asked, the *OSM-derived* landmark dataset (not the whole app) must be made available under ODbL or reproducible.
- **Attribution needed in UI:** a visible "© OpenStreetMap contributors" notice (with a link to openstreetmap.org/copyright or the ODbL text), reachable from wherever the map/landmark data is shown — e.g. an "about/licenses" screen plus a small credit line near the map view. See [OSMF Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines).
- **Cost:** free (self-hosted from planet/extract downloads, or via Overpass API for POI queries near a stop). No imagery is included — OSM tags (`shop=*`, `railway=station`, `crossing=*`, `entrance=*`, etc.) give structured landmark/crossing data only.

**Conclusion:** OSM clears the bar for the *landmark/crossing/BTS-MRT-proximity* part of Bus Stop Context as text/structured data. It supplies zero photos.

---

## 2. Mapillary (crowdsourced street-level imagery, owned by Meta)

**Verdict: legally murky/unfavorable for a commercial consumer app that serves images from its own backend at scale — permitted only under a specific commercial-terms carve-out, and burdened with operational obligations (re-identification safeguards) that are heavy for a Phase 1 MVP.**

- Individual images are licensed **CC BY-SA** (contributor-owned, Mapillary is a sublicensee): "All images on Mapillary are shared under a CC-BY-SA license... anyone can look at and distribute your images, and even modify them a bit, as long as they give attribution." — [Mapillary Help: CC-BY-SA license for open data](https://help.mapillary.com/hc/en-us/articles/115001770409-CC-BY-SA-license-for-open-data)
- Straight CC-BY-SA redistribution (e.g. downloading and serving images from your own CDN) requires attribution **per image**: "If you are downloading individual images and serving them from your own servers, you must attribute the image(s) by visibly displaying the Mapillary logo and linking back to the Mapillary homepage or corresponding Mapillary image page." Suggested format: `"Title" <link to Mapillary image> by "username" <link to user profile>, licensed under CC-BY-SA.` — same source.
- However, Mapillary's **Terms of Use / Commercial Terms** (Section 12) gate *commercial* use of the platform's data/imagery beyond CC-BY-SA's own permissions: commercial use is permitted only for "(i) improvement, training, and development of products, services, maps, studies, platforms, websites, applications, software, algorithms, datasets, solutions, or technologies; and (ii) in the provision of services for or on behalf of one or more of your clients" — [mapillary.com/commercialterms](https://www.mapillary.com/commercialterms). A consumer bus-navigation app showing individual stop photos to end users plausibly fits "development of products... applications" but this is a Meta-controlled commercial license layered on top of CC-BY-SA, not a clean grant — it can be revised or interpreted narrowly by Meta at any time, and requires legal sign-off before shipping a commercial product on it.
- Commercial users additionally take on privacy-compliance burdens: "technical safeguards and business processes that prohibit reidentification or unblurring of any Content, including any individual or license plate," and must prevent "inadvertent disclosure or release of any Content" — same source. This is a real operational obligation (faces/plates are auto-blurred by Mapillary, but the ToS makes *you* responsible for not undoing that), disproportionate for a Phase 1 MVP.
- **Attribution needed in UI:** per-image Mapillary logo + link back to the image or to mapillary.com, on every displayed photo.
- **Coverage caveat:** Mapillary's Bangkok/Thailand coverage is crowdsourced and inconsistent — many bus stops likely have no recent (or any) image, so it cannot be a *complete* Phase 1 source even before the licensing question.

**Conclusion:** Does not clearly clear the bar for a commercial consumer product at Phase 1 — legally conditional (Meta commercial-terms carve-out, not a clean open license for this use case), operationally heavier (re-identification safeguards), and incomplete coverage for Bangkok stops.

---

## 3. KartaView (open street-level imagery, ex-OpenStreetCam, now under Grab/OSM community)

**Verdict: same CC-BY-SA structure as Mapillary, without a big-tech legal team's commercial gate — usable in principle, but Bangkok coverage is almost certainly sparse-to-nonexistent, making it non-viable as a primary source.**

- "KartaView's street images and 3D spatial data are licensed under Creative Commons Attribution-ShareAlike 4.0 International (CC-By-SA)." Terms of use at [kartaview.org/terms](https://kartaview.org/terms) (page did not render statically for this research pass — CC-BY-SA licensing was corroborated via multiple secondary sources: Wikipedia's KartaView article and the Bellingcat OSINT toolkit's KartaView writeup, both citing kartaview.org/terms directly). Recommend a manual re-check of kartaview.org/terms before committing to this source.
- CC-BY-SA share-alike means adaptations of the *imagery itself* must be shared under the same license, but straight display with attribution is permitted, including commercially — this is a more standard, well-understood open license than Mapillary's added commercial-terms layer.
- **Attribution needed in UI:** credit to KartaView + CC BY-SA notice per image if used.
- **Practical blocker:** KartaView's contributor base is much smaller than Mapillary's and has minimal Southeast Asia coverage. Without a directed capture effort, it is very unlikely to have usable imagery at the specific bus stops this app needs for Phase 1.

**Conclusion:** Cleaner license than Mapillary in principle, but not viable as a Phase 1 data source due to near-certain lack of Bangkok bus-stop coverage. Not recommended for Phase 1.

---

## 4. Google Street View Static API

**Verdict: does not clear the bar. Google's terms forbid caching/storing the imagery itself, which is incompatible with building durable "verified stop photo" records — the core Bus Stop Context use case.**

Primary source: [Policies and attributions for Street View Static API](https://developers.google.com/maps/documentation/streetview/policies) (Google for Developers, first-party).

- **Caching/storage restriction:** "Content pre-fetching, indexing, storing, or caching is generally prohibited, except for place IDs and panorama IDs." The only things you may cache indefinitely are the **panorama ID** and **place ID** — i.e., a reference/key, not the image itself: "The panorama ID, which is used to uniquely identify a Street View panorama, is exempt from the caching restriction. Therefore, you can store panorama ID values indefinitely." (Same page.) This mirrors the broader Google Maps Platform Terms restriction (Section 3.2.3 in the general Maps Platform Service Specific Terms, [cloud.google.com/maps-platform/terms/maps-service-terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)): "you must not pre-fetch, index, store, or cache any Content except under the limited conditions stated in the Terms."
- This is a direct conflict with the product need: Bus Stop Context wants a **verified, dated StopImage record** ("Source / วันที่อัปเดต / Verification Status" per CONTEXT.md) that the app owns and can show reliably offline or without a live per-view billed API call. Google's terms require every display to be a fresh, live fetch (or at most reference by panorama ID and re-fetch the pixels each time) — you cannot download-once-and-store a curated "this is the stop" photo the way the feature is designed.
- **Attribution requirement (if used live):** "you must display the reportProblemLink hyperlink in the bottom right-hand corner of the image, and it must include link text that says something like 'Report a problem with this image.'" Plus standard Google Maps attribution ("Google Maps logo, or the text 'Google Maps' where space is limited... never remove, hide, obscure, or modify it").
- **Cost:** Street View Static API is billed per request (not free at volume), compounding the caching restriction — every stop-photo view would be a live, billed API call rather than a one-time captured asset.

**Conclusion:** Legally and architecturally the worst fit of the imagery candidates for this specific feature — the no-caching rule is incompatible with a "verified/dated stop photo" data model, independent of cost.

---

## 5. Thai government / BMTA official data (data.go.th, datagov.mot.go.th)

**Verdict: does not exist yet as a source for this use case.**

- BMTA's page on the Ministry of Transport's open-data catalog ([datagov.mot.go.th/organization/bmta](https://datagov.mot.go.th/organization/bmta)) currently publishes exactly one dataset: monthly bus passenger counts ("จำนวนผู้โดยสารรถเมล์ ขสมก.", XLSX format). No bus-stop photography, landmark, or geodata dataset was found there.
- The general Thai open-data portal ([data.go.th](https://data.go.th/)) was spot-checked via search; no BMTA/transit-stop imagery or landmark dataset surfaced. (This is a lighter-touch check than the other sources — worth a follow-up manual browse of data.go.th's transport category if/when Phase 2 planning revisits this, since government portals add datasets over time.)
- This lines up with T01's likely finding (if BMTA's GTFS/official transit feed doesn't include stop photos) — official Thai sources give schedule/route/stop-location data, not stop photography or curated landmark descriptions.

**Conclusion:** No official Thai government or BMTA-published imagery/landmark dataset exists today. Not usable for Phase 1 (nothing to use).

---

## Summary table

| Source | Imagery? | Commercial-safe? | Caching allowed? | Attribution needed | Bangkok coverage | Phase 1 verdict |
|---|---|---|---|---|---|---|
| OpenStreetMap (POI/landmark tags) | No (text only) | Yes (ODbL, Produced Work exception) | Yes — it's your own derived data | "© OpenStreetMap contributors" + ODbL link | Good (well-mapped in central Bangkok) | **Use — for landmark/crossing text only** |
| Mapillary | Yes | Conditional / murky (Meta commercial-terms carve-out + re-ID safeguard obligations) | Not clearly addressed for durable storage | Per-image logo + link | Inconsistent | Reject for Phase 1 |
| KartaView | Yes | Yes in principle (CC-BY-SA) | Yes, with attribution | Per-image credit + CC BY-SA notice | Very sparse (likely none for BKK stops) | Reject for Phase 1 (no coverage) |
| Google Street View Static API | Yes | No — caching/storage forbidden | **No** (except panorama/place ID) | Google Maps logo + "report a problem" link | Excellent | Reject |
| Thai gov / BMTA open data | N/A | N/A | N/A | N/A | N/A | Doesn't exist |

## Recommendation

**No imagery source clears the bar for Phase 1.** Every street-level-imagery candidate fails on at least one axis that matters for a commercial consumer product: Google Street View's ToS forbids the durable caching a "verified stop photo" feature needs; Mapillary's commercial terms are conditional and impose privacy-safeguard obligations disproportionate to an MVP; KartaView is licensed cleanly but almost certainly lacks Bangkok stop coverage; no official Thai/BMTA photo dataset exists.

**OpenStreetMap POI/landmark tag data does clear the bar** for the non-photo half of Bus Stop Context (nearby landmarks, BTS/MRT proximity, named buildings) as structured text, under ODbL with attribution, using the Produced Work exception so the app's own data model/code stays proprietary.

Recommended Phase 1 scope for Bus Stop Context: **degrade to text-only** — road side, crossing/pedestrian-bridge description, and named nearby landmarks (sourced from OSM tags near the stop's coordinates, or manually curated where OSM is sparse), each carrying `source`, `updated date`, and `verification status` fields per CONTEXT.md's StopLandmark model — with **no stop/area photos in Phase 1** (`StopImage` deferred). Revisit photo imagery in a later phase either by (a) BMTA/BMA commissioning and licensing its own official stop-photography set, or (b) directing volunteer KartaView/Mapillary capture specifically at Bangkok bus stops once a source with acceptable commercial terms and real coverage exists.

## Sources

- [OpenStreetMap Copyright and License](https://www.openstreetmap.org/copyright)
- [OSM Foundation — Licence and Legal FAQ](https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ)
- [OSM Foundation — Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)
- [Mapillary — CC-BY-SA license for open data](https://help.mapillary.com/hc/en-us/articles/115001770409-CC-BY-SA-license-for-open-data)
- [Mapillary — Commercial Terms](https://www.mapillary.com/commercialterms)
- [Mapillary — Terms of Use](https://www.mapillary.com/terms)
- [KartaView Terms](https://kartaview.org/terms) (secondary corroboration: [KartaView — Wikipedia](https://en.wikipedia.org/wiki/KartaView), [Bellingcat Toolkit — KartaView](https://github.com/bellingcat/toolkit/blob/main/gitbook/tools/kartaview/README.md))
- [Google — Policies and attributions for Street View Static API](https://developers.google.com/maps/documentation/streetview/policies)
- [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
- [MOT Data Catalog — BMTA organization page](https://datagov.mot.go.th/organization/bmta)
- [Open Government Data of Thailand](https://data.go.th/)
