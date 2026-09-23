# Research: Transit data source for Bangkok bus routes/directions/stops/schedules

Ticket: [T01-transit-data-source.md](../tickets/T01-transit-data-source.md)
Date: 2026-09-23

Scope per [CONTEXT.md](../../CONTEXT.md): need `BusRoute`, `Direction`, `Trip`,
`RouteStop`, `BusStop`, `ServiceCalendar`, `ServiceException` data — i.e. a
GTFS-shaped static dataset (routes, ordered stops per direction, scheduled
trip times, service calendar/exceptions). Phase 1 explicitly does **not**
need live vehicle positions (see CONTEXT.md "Out of scope: Vehicle /
RealtimeVehicle"), which relaxes the bar considerably: we do not need a
real-time feed or a company's live-tracking backend — a well-maintained
static GTFS feed is sufficient.

---

## 1. Thailand open government data portal (data.go.th)

**What's there:** Searching data.go.th and the Ministry of Transport's own
catalog (datagov.mot.go.th) turns up BRT (Bus Rapid Transit) route/line
datasets for Bangkok (e.g. the Sathorn–Ratchapruek pilot BRT line,
[data.go.th/en/dataset/brt-bus-rapid-trbrt_lineansit](https://data.go.th/en/dataset/brt-bus-rapid-trbrt_lineansit)),
but **no BMTA (ขสมก.) conventional bus route/stop/schedule dataset** was
found on either data.go.th or datagov.mot.go.th at the time of this
research. The MOT catalog's "Road" transport category is dominated by
traffic-volume/travel-statistics datasets, not BMTA route geometry or
timetables.

**License (confirmed, primary source read in full):** data.go.th publishes
data under the **"Terms and Conditions for DGA Open Government License"
v1.0 (10 June 2021)**, issued by the Digital Government Development Agency
(DGA) — PDF: https://data.go.th/uploads/page_images/2021-06-11-053225.908526Terms-and-Conditions-for-DGA-Open-Government-LicenseEN04062021.pdf
(also linked from https://data.go.th/en/pages/dga-open-government-license).
Key clauses, quoted directly:

- Commercial/derivative use: *"The User can copy, publish, distribute or
  benefitially processing the Data in whatever methods, for the purposes of
  enhancing services and innovations or other purposes in relation to be the
  benefits of developing the country's economy and society."* — this is
  broad enough to cover a commercial consumer app, and there is no
  non-commercial-only restriction anywhere in the license.
- Attribution (mandatory): *"The User shall state references for the Use of
  Data, at all the time, which are referred to the sources of Data and
  organizations or individuals whom such Data owned by."* — and further,
  *"In case of no reference specified, the Data without the reference deem
  to be contrary to this Terms."* If the specific producing agency can't be
  identified, the license prescribes exact fallback text: *"The right to Use
  the Data is subject to the terms and conditions for DGA Open Government
  License."*
- No share-alike / no redistribution restriction beyond attribution and not
  misrepresenting the data (*"apply the Data by any means or methods, of
  which do not change substantive definitions to be misled from the
  originals"*).
- No warranty, and DGA can suspend/terminate publication of any dataset
  "without prior notice" with no liability — an operational risk (feed could
  disappear), not a legal blocker.

**Verdict:** The license is genuinely permissive and commercial-use-clean —
comparable in spirit to CC-BY. **However, there is currently no BMTA bus
route/stop/schedule dataset published under it** for us to ingest. This
portal is a legally clean *fallback* generally, but not a currently usable
*data source* for this ticket's specific need. Worth periodically re-checking
in case BMTA publishes route/schedule data here later.

---

## 2. BMTA (ขสมก., Bangkok Mass Transit Authority) direct

**What's there:** BMTA operates a public bus-lines listing page
(http://www.bmta.co.th/en/bus-lines) and has released its own consumer app,
"BMTA BUS," for real-time GPS tracking and route lookup (per Thai-language
coverage, e.g. MGR Online:
https://mgronline.com/business/detail/9680000067323). No evidence was found
of a public API, open-data program, or developer portal operated directly by
BMTA. The BMTA BUS app is consumer-facing only; nothing indicates a
documented API contract, license, or terms permitting third-party ingestion
of its underlying data.

**Verdict:** Not usable — there is no license or ToS granting any right to
ingest BMTA's data programmatically. Scraping the BMTA BUS app or website
would have no legal basis and is not recommended.

---

## 3. GTFS feeds for Bangkok (Transitland / Mobility Database / publisher-specific)

Several GTFS feeds exist for Thailand, but most (Green Bus Thailand,
Northern Chiang Mai, various long-distance coach operators like Watcharin
Tour, Tigerline Travel) are **intercity coach operators**, not Bangkok city
buses, and are irrelevant to this ticket.

The one directly relevant feed is:

### Namtang GTFS (Office of Transport and Traffic Policy and Planning — OTP / สนข.)

- **Publisher:** Thailand's Office of Transport and Traffic Policy and
  Planning (OTP/สนข.), Ministry of Transport — a government transport
  planning agency, publisher of the "Namtang" (นำทาง) multimodal transit
  navigation app (https://namtang.otp.go.th/,
  https://play.google.com/store/apps/details?id=th.go.otp.namtang).
- **Coverage:** Per Transitland's feed detail page
  (https://www.transit.land/feeds/f-th~namtang, Onestop ID `f-th~namtang`),
  and corroborated by the independent `bangkok-bus-check` project
  (https://github.com/danilom/bangkok-bus-check, which uses this exact feed
  and describes it as covering *"every Bangkok bus, van and suburban route
  with both directions, ordered stops, Thai and English names, coordinates
  and service hours"*), this feed covers BMTA and BMTA-affiliated/private
  joint bus routes, vans, and suburban routes across the Bangkok metro area
  — i.e. exactly the RouteStop/Direction/BusStop/Trip shape our domain model
  needs. It is actively maintained: Transitland shows the feed with over 100
  versions and a fetch as recent as 22 Sept 2026 (one day before this
  research), so it is a live, frequently-updated pipeline, not a stale
  one-off dump.
- **License (confirmed via Transitland's feed record, and corroborated by
  OTP's own open-data page):** **CC BY 4.0**, with Transitland listing the
  required attribution text verbatim: *"Required attribution text: Office of
  Transport and Traffic Policy and Planning, Thailand."* OTP's own open-data
  landing page (https://namtang-api.otp.go.th/opendata) states in Thai that
  the transit-stop and GTFS datasets are released *"ภายใต้สัญญาอนุญาตแบบ
  Creative Commons CC-BY"* ("under a Creative Commons CC-BY license"),
  copyright reserved by OTP (สนข.), explicitly to promote reuse by
  government, education, and the **private sector**.
- **CC BY 4.0 clauses (primary source: https://creativecommons.org/licenses/by/4.0/legalcode):**
  - Commercial use permitted, explicitly and without royalty: *"The Licensor
    hereby grants You a worldwide, royalty-free, non-sublicensable,
    non-exclusive, irrevocable license to exercise the Licensed Rights..."*
    covering reproduction and distribution "for any purpose, including
    commercial purposes."
  - Attribution required (Section 3(a)(1)): must retain/reproduce
    identification of the creator, a copyright notice, a notice referring to
    the license, and a URI/hyperlink to the material where supplied,
    "in any reasonable manner based on the medium, means, and context in
    which You Share the Licensed Material."
  - **No share-alike / no derivative-database copyleft**: CC BY 4.0 (unlike
    BY-SA or ODbL) does **not** require that adaptations or downstream
    databases be released under the same license — *"the Adapter's License
    You apply must not prevent recipients of the Adapted Material from
    complying with this Public License,"* but recipients are free to license
    their own adaptation differently. This means BusNavigateApp's derived
    schedule database does **not** need to be published or open-sourced —
    only attributed.
- **Attribution requirement for downstream API responses:** Yes — any Trip/
  RouteStop/BusStop data derived from this feed must carry a visible
  attribution to "Office of Transport and Traffic Policy and Planning,
  Thailand" somewhere reachable by the end user (e.g. an About/Data Sources
  screen, and ideally referenced in API contract metadata per
  [T09-api-contracts.md](../tickets/T09-api-contracts.md)). No rate limits
  apply since this is a static downloadable GTFS export, not a live query
  API with quotas.

**Verdict: Usable, and the strongest candidate.** Government-agency-published,
actively maintained, explicit CC BY 4.0 license with commercial use
expressly permitted and only an attribution obligation, and it covers the
exact GTFS-shaped entities the domain model needs (BMTA + affiliated routes,
directions, ordered stops, schedules).

---

## 4. ViaBus (Thailand's popular bus-tracking app)

**API/partner program:** No public or documented partner API was found. All
public references (App Store, Google Play, LinkedIn) describe ViaBus purely
as a consumer app.

**Terms of Service (read in full, primary source: https://www.viabus.co/terms,
effective 30 October 2019, entity: Via Group (Thailand) Co., Ltd.):**

Directly relevant prohibitions, quoted verbatim from Section 3 ("Application's
Services Usage" — things the User must not do):

> "modifying, adapting, translating, or reversing engineer section of the
> Application, or reproducing of any part of the Application, whether by
> yourself or allowing third parties to do so. The User must not infringe
> any copyright, trademark or any other intellectual property of ViaBus or
> other users. In addition, **the User must not attempt to collect data of
> other users, restaurant information, location and maps or pictures that
> ViaBus and the members of the Application created**, including pictures,
> background images and icons for any whatsoever purpose **unless permitted
> in writing from ViaBus**"

> "downloading, uploading, posting a notice, or doing anything to **illegally
> exploit contents or work from this Application without prior written
> permission from ViaBus**"

> "using computer software to obstruct, intervene, or disturb the operation
> or services of ViaBus or third parties' computer or computer system such
> as the use of Trojan Horse, Time Bombs, etc. **The User shall not
> intentionally attempt to heavily load to the Application** that may be
> harmful to the service of the Application without reasonable cause"

Section 1 ("Intellectual Property") additionally asserts that all data,
maps, and content in the app are ViaBus's "ownership, copyright, right and
property... solely," reinforcing that reuse requires ViaBus's consent.

There is no published rate limit (because there is no published API at all
— any access would necessarily be via reverse-engineering the consumer app,
which the "collect data... unless permitted in writing" and
"reproducing... whether by yourself or allowing third parties" clauses
squarely prohibit), and no self-service registration path for commercial
API access is advertised anywhere on viabus.co.

**Verdict: Not usable** for ingestion without a signed partnership. Scraping
or reverse-engineering ViaBus's app/API would violate the quoted ToS clauses
and create direct legal exposure for a commercial, consumer-facing,
overlapping product. If BusNavigateApp wants ViaBus's real-time layer later
(Phase 2, when RealtimeVehicle is in scope), that would require directly
contacting Via Group (Thailand) Co., Ltd. for a formal data-partnership
agreement — not something this ticket can resolve unilaterally.

---

## 5. OpenStreetMap (public_transport / route relations)

**Coverage (spot-checked via a live Overpass API query run during this
research, not just a write-up):** An Overpass query for
`relation[route=bus]` within the Bangkok Metropolis area returned **583 bus
route relations**. For comparison, Wikipedia's Bangkok Mass Transit
Authority entry states BMTA + joint/private operators run roughly "470
routes" total. 583 OSM relations is in a plausible range for meaningful (if
imperfect) coverage — likely representing both directions of many routes
plus some duplicated/variant relations — but the OSM wiki's own "Transport
in Bangkok Metropolitan Region" page
(https://wiki.openstreetmap.org/wiki/Transport_in_Bangkok_Metropolitan_Region)
has its "Bangkok Mass Transit Authority (BMTA) Bus" and "Private Bus"
sections **entirely blank**, i.e. the community documentation for bus
route mapping conventions/IDs in Bangkok is essentially absent, and only
rail/BRT are documented in detail. This suggests real coverage exists (per
Overpass) but is not curated/vetted the way it is for BTS/MRT/BRT, so
per-route/per-stop completeness and ordering accuracy cannot be assumed
without spot-checking individual routes.

**License (primary source: https://opendatacommons.org/licenses/odbl/1-0/,
fetched directly):**

- Commercial use explicitly permitted: *"These rights explicitly include
  commercial use, and do not exclude any field of endeavour."* (Section 3.1)
- Attribution required for any "Produced Work" (e.g. a map or app UI built
  from the data): *"If You Publicly Use a Produced Work, You must include a
  notice associated with the Produced Work reasonably calculated to make any
  Person...aware that Content was obtained from the Database..."*
  (Section 4.3) — in practice this is satisfied by the standard "© OpenStreetMap
  contributors" attribution.
- **Share-alike applies only to Derivative Databases, not Produced Works**:
  Section 4.4(a) requires any *Derivative Database* you *publicly use* to be
  released "only under the terms of: This License; A later version...; or a
  compatible license" — but Section 4.5(b) clarifies: *"Using this Database,
  a Derivative Database, or this Database as part of a Collective Database
  to create a Produced Work does not create a Derivative Database for
  purposes of Section 4.4."* This is the critical distinction for
  BusNavigateApp: our backend's internal schedule database, if built by
  extracting/transforming substantial OSM route/stop content, would likely
  count as a **Derivative Database** and would need to be made available
  under ODbL too (i.e. effectively open-sourcing our derived
  routes/stops/directions dataset) — whereas the app's UI/API *output*
  (a "Produced Work") does not trigger share-alike, only attribution.

**Verdict:** Legally usable for commercial use with attribution, but the
ODbL's share-alike clause on Derivative Databases is a real constraint: if
OSM becomes our primary/backbone dataset for RouteStop/BusStop data (not
just a supplementary geometry/POI layer), we would likely need to publish
our compiled Bangkok bus schedule+stop database back under ODbL. Also,
schedule/timetable data (ServiceCalendar, Trip departure times) is generally
**not** well-represented in OSM at all — OSM primarily encodes route
geometry and stop membership/order, not GTFS-style trip schedules. So OSM
alone cannot satisfy the Trip/ServiceCalendar/ServiceException part of the
domain model; at best it's a stop/geometry supplement or fallback.

---

## 6. Other candidates checked

- **Google GTFS schedule/realtime partnerships:** Search turned up that
  Google commissioned EACOMM to develop GTFS static/real-time feeds for
  Singapore, Jakarta, Bangkok, and Queensland (per a LinkedIn/EACOMM
  write-up: https://www.linkedin.com/pulse/gtfs-protocol-simplified-mobility-eacomm-corporation).
  This is very plausibly the historical origin of Bangkok GTFS data feeding
  Google Maps transit directions, but no separate public feed, license, or
  API distinct from Namtang/OTP was found; Google's own partner-facing GTFS
  program (Transit Partners) is for agencies submitting data *to* Google,
  not a redistribution channel *for* third parties to obtain Bangkok data
  from Google. Not independently actionable for this ticket.
- **Rocket Media Lab / other Thai civic-tech open datasets:** No Bangkok bus
  route/schedule dataset was found from Rocket Media Lab or similar civic-tech
  groups during this research.
- **`bangkok-gtfs` (GitHub, asiripanich/bangkok-gtfs) and `bangkok-bus-check`
  (GitHub, danilom/bangkok-bus-check):** Both are community/hobby projects
  that snapshot or consume the **same underlying Namtang/OTP GTFS feed**
  (the `bangkok-bus-check` README explicitly names "Namtang GTFS" as its
  source and states it is "Licensed under CC BY 4.0"). These are useful as
  secondary corroboration of Namtang's coverage and license but should not
  themselves be treated as the source of record — the primary source is
  OTP/Namtang directly (or Transitland's mirrored copy, which preserves the
  license/attribution metadata).

---

## Recommendation

**Ingest the Namtang GTFS feed, published by Thailand's Office of Transport
and Traffic Policy and Planning (OTP/สนข.), licensed CC BY 4.0**, either
pulled directly from OTP's open-data endpoint
(https://namtang-api.otp.go.th/opendata) or mirrored via Transitland
(Onestop ID `f-th~namtang`, https://www.transit.land/feeds/f-th~namtang) for
easier tooling/versioning.

**Rationale:** It is the only candidate that clears the diligence bar
cleanly on all fronts required by this ticket: it is published by a
government transport-planning agency (not a scraped or reverse-engineered
third-party app), it is under an explicit, primary-source-verified open
license (CC BY 4.0) that expressly permits commercial use and imposes only
an attribution obligation (no share-alike, no non-commercial restriction, no
registration/partnership requirement), it is actively maintained (fetched by
Transitland as recently as the day before this research), and its coverage
description — "every Bangkok bus, van and suburban route with both
directions, ordered stops, Thai and English names, coordinates and service
hours" — maps directly onto the domain model's BusRoute/Direction/RouteStop/
BusStop/Trip entities, including schedule data that OSM cannot provide and
that BMTA/ViaBus do not offer without a formal (unobtained) partnership.

**Caveats / follow-on work:**

1. **Attribution obligation is mandatory, not optional** — the API contract
   ticket ([T09-api-contracts.md](../tickets/T09-api-contracts.md)) must
   surface "Office of Transport and Traffic Policy and Planning, Thailand"
   attribution somewhere user-reachable (e.g. an About/Data Sources screen
   and/or API response metadata).
2. **Coverage/freshness risk, not a legal one:** Namtang is government-run
   and could lag real-world route changes (BMTA route reforms, new private
   operator routes) or, per the DGA-license pattern seen elsewhere, be
   suspended/changed without notice. Recommend a periodic (e.g. weekly)
   re-fetch with diffing/alerting, and treat OSM route relations (583 found
   via Overpass) as a **secondary cross-check / gap-filling supplement**
   for stop geometry — but if OSM content is ever substantially incorporated
   into the shipped schedule database (not just used as a Produced-Work
   basemap layer), remember the ODbL share-alike obligation on Derivative
   Databases (Section 4.4a) and budget for publishing that derived dataset
   under ODbL, or keep OSM usage limited to map-tile/POI display only
   (a Produced Work, not a Derivative Database) to avoid that obligation.
3. **ViaBus real-time data remains off-limits** absent a signed partnership
   with Via Group (Thailand) Co., Ltd. — do not attempt to scrape or
   reverse-engineer the ViaBus app for RealtimeVehicle data even in Phase 2;
   pursue a direct partnership conversation if/when real-time is in scope.
4. **BMTA and data.go.th direct sources remain unusable/nonexistent today**
   — re-check data.go.th periodically in case BMTA later publishes its own
   dataset there under the (also-clean) DGA Open Government License.
