# Static Bangkok Bus Data — What a Solo Dev Can Actually Get (research, 2026-09-20)

Scope: routes, ordered stop sequence per route, stop coordinates, direction (inbound/outbound).
Method note: findings marked **[verified]** were checked by directly downloading the data or querying the API during this research. Everything else is from search results and is **unverified**.

## Bottom line

- **Use the Namtang GTFS feed.** `https://namtang-api.otp.go.th/download/namtang-gtfs.zip` — official (OTP/สนข., Ministry of Transport), **CC-BY-4.0**, ~42 MB zip, **feed_version `20260919` (yesterday)**. It contains everything the app needs: 2,068 routes, 17,078 stops with lat/lon, ordered `stop_sequence`, and `direction_id` 0/1. **[verified — downloaded and inspected]**
- **It is renumbering-aware.** BMTA route short names are already in `NEW (OLD)` form, e.g. `3-38 (13)`, `1-12E (107)`. 188 of 219 BMTA routes carry a new `N-N` code; 158 also carry the old number. So you get the old↔new mapping for free. **[verified]**
- **Side-of-road is derivable.** Each direction has its own `stop_id` with its own coordinate (opposite-side stops are separate records). Combine the stop's coord with the next stop's coord (or `shapes.txt`) to compute bearing and decide which side to stand on. No extra dataset needed. **[verified]**
- **Biggest data-quality trap: 7,930 of 17,078 stops (46%) are named literally `จุดขึ้นลง;visual stop`** — unnamed flag-stop placeholders. Coordinates are fine, but you cannot show the user a stop name for nearly half of them. Plan a fallback (nearest road/landmark, reverse geocode). **[verified]**
- **Do not bother with OSM as the primary source, and do not bother with data.go.th at all.** OSM has only ~638 `route=bus` relations and ~4,927 `highway=bus_stop` nodes in the Bangkok bbox (vs 17k stops in GTFS), with inconsistent PTv2 tagging. data.go.th's BMTA dataset was last updated 2022-03-25 and predates the renumbering entirely.

---

## 1. Public GTFS feed for Bangkok

**YES — there is a real, live, official, openly-licensed GTFS feed. This is the answer.**

### "Namtang" (นำทาง) GTFS — OTP / สนข.

- Publisher (from `feed_info.txt`): `สำนักงานนโยบายและแผนการขนส่งและจราจร กระทรวงคมนาคม` (Office of Transport and Traffic Policy and Planning, Ministry of Transport). **Not BMTA itself.**
- Direct download: `https://namtang-api.otp.go.th/download/namtang-gtfs.zip` — HTTP 200, `application/zip`, **41,844,577 bytes**. **[verified]**
- Publisher URL: `https://namntang.otp.go.th/` (note: the typo'd hostname is what the feed actually contains)
- License: **CC-BY-4.0**, attribution "Office of Transport and Traffic Policy and Planning, Thailand" (per Transitland registry).
- Registry entry: Transitland `f-th~namtang` — https://www.transit.land/feeds/f-th~namtang. Transitland actively fetches it (last successful fetch 2026-09-19). Matched operator: `o-w4r-...bangkokmasstransitauthority`.
- `feed_info.txt`: `feed_start_date=20260101`, `feed_end_date=20261231`, **`feed_version=20260919`**. All files inside the zip are timestamped 2026-09-19 18:01. **The feed is current, not abandoned.** **[verified]**
  - (Note: Transitland's page claimed "no feed_info.txt" — that is stale/wrong for the current version, which does include it.)

### Contents **[all verified by direct inspection]**

| File | Size | Rows |
|---|---|---|
| `agency.txt` | 17 KB | 126 |
| `stops.txt` | 2.0 MB | 17,078 |
| `routes.txt` | 615 KB | 2,068 |
| `trips.txt` | 418 KB | 4,654 |
| `stop_times.txt` | 7.1 MB | — |
| `shapes.txt` | **154 MB** | — |
| `fare_attributes.txt` | 36 MB | — |
| `fare_rules.txt` | 29 MB | — |
| `frequencies.txt` | 354 KB | — |
| `calendar.txt`, `calendar_dates.txt`, `feed_info.txt` | small | — |

Uncompressed total ≈ 230 MB, dominated by `shapes.txt` and the fare tables. For a bus-stop lookup app you can discard `shapes`, `fare_attributes` and `fare_rules` and the working set drops to ~10 MB.

**Schemas (actual headers):**
```
routes.txt:     route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_color
stops.txt:      stop_id,stop_name,stop_lat,stop_lon,zone_id,wheelchair_boarding
trips.txt:      route_id,service_id,trip_id,trip_headsign,direction_id,shape_id,wheelchair_accessible
stop_times.txt: trip_id,arrival_time,departure_time,stop_id,stop_sequence,timepoint
```

**Bilingual convention:** names are a single field with Thai and English joined by a semicolon, e.g.
`"อู่คลองเตย;Bus Depot Khlong Toei"`, `"ตลาดปัฐวิกรณ์;Pattavikorn Market"`, `"ปัฐวิกรณ์;Patthavikon"`.
Split on `;` to get th/en. **[verified]** (Not standard GTFS `translations.txt` — you must handle this yourself, and handle names that contain no `;`.)

**Route mix by agency (top): `DLT` 943 (Dept. of Land Transport — private minibus / songthaew / van routes), `BMTA` 219, `SRT` 188 (rail), `TSB` 154 (Thai Smile Bus), `TC` 98, plus BTSC/BEM/SRTET rail lines.** The feed is multimodal and nationwide-ish; filter by `route_type` and by a Bangkok bbox. **[verified]**

### Worked example proving ordered stops + both directions **[verified]**

Route `3-38 (13)` (BMTA, Khlong Toei ↔ Patthavikon), `route_id=293`, has 4 trips:

```
route_id=293  trip_id=340   headsign="ปัฐวิกรณ์;Patthavikon"   direction_id=0
route_id=293  trip_id=341   headsign="คลองเตย;Klong Toey"      direction_id=1
route_id=293  trip_id=2839  headsign="คลองเตย;Klong Toey"      direction_id=1
route_id=293  trip_id=2840  headsign="ปัฐวิกรณ์;Patthavikon"   direction_id=0
```
(Two service_ids × two directions.)

`stop_times` for trip 340 — 69 rows, clean 1..N sequence:
```
"340","00:00:00","00:00:00","3743","1","0"
"340","00:01:15","00:01:30","3731","2","0"
"340","00:02:30","00:02:45","3732","3","0"
...
```
First stop of direction 0 = stop 3743 `อู่คลองเตย;Bus Depot Khlong Toei` (13.7158, 100.5654);
first stop of direction 1 = stop 3238 `ตลาดปัฐวิกรณ์;Pattavikorn Market` (13.8123, 100.6513). Correctly mirrored.

**Caveat on times:** `arrival_time` starts at `00:00:00` on every trip and increments — these are **cumulative travel offsets, not clock times**. The feed is frequency-based (`frequencies.txt` supplies headways). Do not read `stop_times` times as a timetable. **[verified]**

**Caveat on stop names:** `จุดขึ้นลง;visual stop` occurs **7,930 times** (46% of all stops). Only 8,985 distinct stop names exist across 17,078 stop_ids. **[verified]**

**Caveat on stop deduplication:** the same physical location can appear as multiple stop_ids with slightly different coords, e.g. `ARL มักกะสัน;ARL Makkasan` as stop 324 (13.75083, 100.56123) and stop 2648 (13.75149, 100.56386). This is exactly what makes side-of-road derivable, but it also means "which stop am I at?" needs a radius/cluster match, not a name match. **[verified]**

### Mirrors / snapshots
- `https://github.com/asiripanich/bangkok-gtfs` — snapshot archive of the Bangkok GTFS, started 2022-04-26, taken when the feed changes. **Most recent snapshot visible in the repo listing is 2023-04-21** — treat as a historical archive for diffing, not a current mirror.
- `https://github.com/danilom/bangkok-bus-check` — a working app built on this exact feed; its README is a useful sanity check on the feed's shape and it notes it uses Thai Wikipedia as an independent cross-check to fill "what the feed lacks (old numbers for the reform-era routes)". *(Unverified whether that gap still exists — see §4; in the 2026-09-19 feed most reform routes DO carry the old number.)*

### Sources that are NOT usable
- **data.go.th → BMTA org** (`https://data.go.th/organization/bangkok_mass_transit_authority`): only 2 datasets — `ข้อมูลสายและป้ายหยุดรถโดยสารประจำทางขององค์การขนส่งมวลชนกรุงเทพ` (ZIP, 1,598 records, **last updated 2022-03-25**) and `การบริการและอัตราค่าโดยสาร` (XLSX, 2021-10-31). Not GTFS, ~4.5 years stale, predates the renumbering, and it is unverified whether the ZIP even carries coordinates. **Skip.**
- **datagov.mot.go.th** (MOT catalog, `organization/bmta`): ridership/statistics, not route geometry. **Skip.**
- **TransitFeeds**: retired; all historical data migrated into Mobility Database in Dec 2025. Do not build against `transitfeeds.com`.
- **mobilitydatabase.org**: the readily-surfacing Thailand entry is `mdb-1208` "Green Bus Thailand" — intercity northern Thailand, stale 2018 TransitFeeds import. Not Bangkok city buses. Transitland's `f-th~namtang` is the better registry entry point. *(Unverified whether Mobility Database also carries a Namtang entry under a different mdb- id; worth a 1-minute check but irrelevant since the OTP URL works directly.)*

---

## 2. OpenStreetMap — coverage and Overpass extraction

**Verdict: viable as a cross-check / gap-filler, not as the primary source.**

### Measured coverage **[verified — live Overpass queries, bbox 13.49,100.32 → 14.00,100.94]**

| Query | Count | OSM base timestamp |
|---|---|---|
| `relation[type=route][route=bus]` | **638** | 2026-09-20 |
| `node[highway=bus_stop]` | **4,927** | 2026-05-06 (mirror) |

Compare to GTFS: 17,078 stops nationwide / ~13k in Bangkok per community reports, and 219 BMTA + 154 TSB + hundreds of DLT routes. **OSM has roughly a third of the stops and, at 638 relations (each direction is a separate relation under PTv2, so ~319 route-directions), well under half the route-directions.**

### Tagging quality **[verified — sampled 30 relations in central Bangkok, bbox 13.70,100.45 → 13.85,100.65]**

`ref` values are inconsistent across three styles:
- old-number-only: `166`, `71`, `9`, `402`, `203`
- combined new+old: `3 (2-37)`, `522 (1-22E)`, `48 (3-11)`, `145 (3-18)`, `52 (1-6)`, `32 (2-5)` — note OSM writes **`OLD (NEW)`**, the *opposite order* from the GTFS's `NEW (OLD)`
- non-BMTA operators: `ต.27` (songthaew), `1013`, `1024ข`, `1003บบท`, `1003บก` (DLT minibus)

`public_transport:version` was present on only 7 of 30 sampled relations (6× `"2"`, 1× `"1"`) — so **most relations don't declare PTv2, and a mix of PTv1 and PTv2 tagging is in the data.** `from`/`to` tags present on 15 of 30.

### Can you extract route-with-ordered-stops via Overpass?

**Technically yes; practically unreliable here.** The PTv2 model gives you what you want — one relation per direction, with `platform`/`stop` role members listed in travel order at the head of the member list. `route_master` groups the two directions. A working pattern:

```overpassql
[out:json][timeout:180];
relation["type"="route"]["route"="bus"](13.49,100.32,14.00,100.94);
out body;
>;
out skel qt;
```
then walk `members[]` in order, keeping those with `role` in `{platform, platform_entry_only, platform_exit_only, stop, stop_entry_only, stop_exit_only}`.

The problem is that member ordering is only meaningful for correctly-tagged PTv2 relations, and a large share of Bangkok's relations are not. You would need per-relation validation and manual repair. Also note Overpass rate limits: `overpass-api.de` returned HTTP 406 without a `User-Agent` header and timed out under load; `overpass.kumi.systems` is a usable mirror but its data was ~4.5 months stale at time of query.

**Recommended use of OSM:** (a) road geometry for the "which side of the road" rendering and for snapping stops to the correct carriageway; (b) real stop names to fill some of the 7,930 `visual stop` blanks; (c) a sanity check on suspicious GTFS geometry. Not for route-stop sequence.

License note: OSM is **ODbL** (share-alike on derived databases); Namtang is **CC-BY-4.0**. Mixing them into one shipped database has licensing consequences — keep them as separate layers, or accept ODbL on the combined database.

---

## 3. Thai third-party / scrapeable sources

All items in this section are **unverified** — I did not attempt to access or scrape any of them, and several are likely against their terms of service.

- **ViaBus** (`com.indyzalab.transitia`, iOS `id1074208600`) — the dominant Thai transit app; covers BMTA, MRT, BTS, ferries, airport buses, with real-time vehicle tracking. It has a private mobile API, no published public API, and no open license. Scraping it is a ToS risk and a maintenance treadmill. **Given that Namtang gives you the same static data legally and for free, there is no reason to touch ViaBus for static data.** ViaBus is only interesting if you later want *real-time* vehicle positions, which is out of scope here.
- **BMTA website** (`http://www.bmta.co.th/en/bus-lines`, `/th/bus-lines`) — has per-route pages. Unverified whether these expose ordered stop lists with coordinates or just a prose route description; historically BMTA route pages have been descriptive text plus a static image, not structured data. Even if scrapeable it would be strictly worse than Namtang. Note the site is HTTP and has been intermittently unavailable.
- **Longdo Map** — Thai mapping provider with a commercial Map API. Unverified whether any bus route/stop endpoint is available on a free tier. Likely paid and licensed, so not a source for a shipped dataset.
- **SmartVC** — mentioned in a 2016 research paper ("Bangkok Bus Route Planning API") as the holder of an official BMTA transit information concession. Historical context only; no evidence of a current public offering.
- **Thai Wikipedia route lists** (`รายชื่อเส้นทางรถโดยสารประจำทางในกรุงเทพมหานคร` and per-route articles) — genuinely useful as a **cross-check for the old↔new number mapping**, which is what the `bangkok-bus-check` project uses it for. Community-maintained, CC-BY-SA, moderate reliability, no coordinates. Worth scraping once into a lookup table; not worth depending on at runtime.

---

## 4. The 2024–2026 BMTA route renumbering

### What happened

- The Department of Land Transport (กรมการขนส่งทางบก) route reform reassigns every Bangkok bus route a **zone-prefixed code `Z-NN`**, where `Z` is the zone (1–4) and `NN` the route within it; an `E` suffix marks expressway/express variants (e.g. `1-12E`, `3-7E`, `1-35E`).
- **Key milestone: 25 July 2024** — 107 reform routes entered service. BMTA ran old and reform routes in parallel, with the old routes ceasing **31 August 2024**.
- Examples widely reported: `13` → `13 (3-38)`; `21` → `21 (4-6)`; `59` split into `59 (1-7E)` (expressway) and `59 (1-8)`.
- Separately, many routes have been transferred to **Thai Smile Bus** (electric), which uses the same `Z-NN` scheme and displays the old BMTA number in parentheses on the bus.
- The transition has been messy and publicly criticised (BMTA's own union objected to the renumbering; press reported rider confusion on day one). Old numbers remain in colloquial use, on signage, and in people's heads.

### Do the datasets reflect it?

**Namtang GTFS: YES, and it is the best available mapping.** **[verified on the 2026-09-19 feed]**
- 219 BMTA routes total.
- **188 (86%)** have a `route_short_name` starting with a new-style `N-N` code.
- **158 (72%)** carry the old number in parentheses.
- Format is **`NEW (OLD)`** — e.g. `3-12E (102)`, `1-12E (107)`, `4-20 (111)`, `1-21 (114)`, `3-38 (13)`, `3-47 (136)`, `2-49 (156L)`, `2-21E (166)`, `1-16 (185)`, `4-4 (20)`, `1-35E (26E)`, `2-5 (32)`, `3-41 (47)`.
- **The remainder is messy and needs handling:** new-code-only with no old number (`1-14E`, appearing twice); old-number-only (`166`, `203`); free-text suffixes (`166 ศูนย์ราชการ`, `205 เดิม` ["205 old"], `511 [ท]`). Leading/trailing whitespace occurs (` 2-21E (166)`).
- So: **parse `route_short_name` with a regex to extract new code and old code separately, and index both.** This is exactly what your app needs — a user at a stop will read `13` off a sign or say "สาย 13" while the dataset's canonical key is `3-38`.

**OSM: PARTIALLY, and in the opposite order.** **[verified]** Sampled `ref` values mix old-only (`166`, `71`, `9`) with combined `OLD (NEW)` (`3 (2-37)`, `522 (1-22E)`, `48 (3-11)`). If you ever merge OSM refs with GTFS refs, **note the reversed parenthesis convention** — a naive "first token is the new code" parser will silently mis-map.

**data.go.th BMTA dataset: NO.** Last updated 2022-03-25, ~2.3 years before the 25 July 2024 reform launch. It cannot contain new codes.

**Thai Wikipedia: partially, community-maintained,** and the `bangkok-bus-check` project uses it specifically to fill old-number gaps the feed lacks. Useful as a supplement for the ~31 BMTA routes whose GTFS short name lacks a clean old/new pair.

---

## Confidence and gaps

**High confidence (directly verified this session):**
- The Namtang feed exists, downloads at the stated URL, is dated 2026-09-19, and contains routes / ordered `stop_sequence` / stop lat-lon / `direction_id` 0-1 / bilingual names.
- All record counts, schema headers, the `NEW (OLD)` short-name format and its 188/158-of-219 hit rates, the 7,930 `visual stop` placeholder count, the frequency-based (offset, not clock) times, and the worked 3-38 example.
- The OSM counts (638 route relations, 4,927 bus_stop nodes) and the sampled tagging inconsistency.

**Medium confidence (from search results, corroborated but not verified by me):**
- CC-BY-4.0 licensing — this came from the Transitland registry page and the `bangkok-bus-check` README, not from a license file inside the zip. **The zip contains no LICENSE file; confirm attribution terms on `https://namntang.otp.go.th/` before shipping.** This is the single most important thing to double-check.
- The reform timeline dates (25 Jul 2024 launch, 31 Aug 2024 old-route cutoff) and the `Z-NN` zone semantics.

**Low confidence / not checked:**
- Whether `data.go.th`'s 2022 ZIP contains coordinates (moot — it's stale).
- Whether Mobility Database carries a Namtang entry under some `mdb-` id.
- Whether BMTA's own website route pages are scrapeable into structured stop lists (moot — Namtang is better).
- Longdo's bus data availability and pricing.
- **Feed update cadence.** `feed_version` equals a date and the file was 1 day old when fetched, which suggests frequent (possibly daily) regeneration — but I only observed one version. Compare two fetches a week apart before assuming it is safe to pin an old copy. The `asiripanich/bangkok-gtfs` archive's irregular snapshots suggest content changes are *not* daily even if the file is regenerated daily.
- **How stale the reform data itself is.** The feed is current as a file; whether its route geometry reflects service changes made in 2025–2026 (further Thai Smile Bus transfers, additional reform routes) is not something I could verify without ground truth.
- **Accuracy of stop placement for side-of-road purposes.** Opposite-side stops are separate records with distinct coordinates, but I did not verify that those coordinates are accurate enough (i.e. actually on the correct side of the carriageway, not both snapped to the road centreline) to drive a "stand on this side" instruction. **This is the highest-risk assumption for the app's core feature and should be spot-checked against satellite imagery at a handful of known stops before committing to the design.** A bearing-based approach (direction of travel from consecutive stops / `shapes.txt`) is more robust than relying on the absolute lateral offset of the stop coordinate.

**Recommended next step:** download the zip once, strip `shapes`/`fare_*`, load the rest into SQLite, and spot-check five stops you personally know against reality — especially the side-of-road question.
