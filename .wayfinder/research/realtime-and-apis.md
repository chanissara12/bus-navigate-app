# Real-time & Commercial Bus Data for Bangkok — What a Solo Dev Can Actually Get

Research date: 2026-09-20. Status: COMPLETE.

## Bottom line

- **Need (a) — "which bus numbers serve my destination from this stop" — is solved, cheaply.**
  Google Directions/Routes API in transit mode returns `line.short_name` (the bus number),
  `departure_stop` and `arrival_stop` by name and coordinate, and `num_stops`. Free tier is
  10,000 calls/month (Essentials) or 5,000 (Pro); a solo dev's personal app will never pay.
- **Need (b) — "is the bus ever coming?" — has no real-time answer available to you.**
  There is no public ViaBus API, no Bangkok GTFS-Realtime feed, and BMTA publishes no live
  vehicle positions. The only live data exists inside private, auth-gated operator apps
  (ViaBus, BMTA BUS, TSB Go Plus). Design around this constraint rather than fighting it.
- **Answer (b) statistically instead.** Use Google's `transit_details.headway` (expected seconds
  between departures) as a baseline, and log your own stop observations to build a real waiting-
  time distribution. For a personal app this is *better* than tracking: it learns your actual
  stops, and Bangkok headway variance is traffic-driven anyway.
- **Thai Smile Bus now runs more routes than BMTA (123 vs ~112), and no single source covers
  both in real time.** ViaBus reportedly has no GPS for TSB routes. The full region is ~470
  routes / ~16,321 vehicles including รถร่วมบริการ, minibuses and สองแถว — the long tail is
  undocumented. Scope the app to numbered BMTA + TSB routes and say so explicitly.
- **Do one 30-minute spike before you commit: test Longdo Map's Route API transit mode.** Its
  free tier (100,000 service transactions/month) dwarfs Google's and it is Thai-maintained. The
  open question is whether it returns bus numbers and stop names or just geometry. If it does,
  prefer it; if not, Google is the answer. Also beware: any dataset predating the July 2024 bus
  reform carries obsolete route numbers, which breaks need (a) at its core.

## 1. Real-time bus positions

**Verdict: effectively NOT obtainable by a solo dev through any sanctioned channel.**

### ViaBus
- ViaBus (Indyza Lab, `com.indyzalab.transitia`) is the de-facto real-time bus tracker for Bangkok
  (plus Chiang Mai, Phuket, Nakhon Si Thammarat, Saraburi, Udon Thani, Vientiane, and several
  Malaysian cities). It tracks BMTA, MRT, BTS, ferries, songthaew, minibus, airport bus.
- **No public developer API, no documented API, no pricing page, no developer portal found.**
  Searched in English and Thai. Every result is consumer-app coverage (Techsauce, The Momentum,
  DroidSans, Thaiware) — zero developer documentation.
- There IS an *unofficial* wrapper: https://github.com/pleum/viabusgo — "Unofficial Viabus API
  wrapper for Go". Tiny (~5 commits), "under development", has an `examples/auth` directory so the
  private API is auth-gated. Endpoints/base URL not documented on the repo landing page.
  UNVERIFIED whether it still works — the repo looks abandoned.
- Practical read: ViaBus's live positions come from a private, authenticated mobile-app API.
  Using it means reverse-engineering someone's commercial product — brittle (auth tokens, cert
  pinning, API churn), and a ToS problem if the app is ever distributed.

### GTFS-Realtime
- **No Bangkok / BMTA GTFS-Realtime feed found** in the Mobility Database or anywhere else.
  Thailand's presence in the Mobility Database is sparse and *schedule-only*: e.g. Green Bus
  Thailand (mdb-1208), Northern Chiang Mai (mdb-1282). Neither is Bangkok city bus.
- The only Bangkok GTFS artifact found is static and stale:
  https://github.com/asiripanich/bangkok-gtfs — daily snapshots of "Bangkok GTFS", but the latest
  snapshot in the repo table is **2023-04-21**. Source of the upstream feed is not documented in
  the README. Treat as an archaeological artifact, not a live feed.

### BMTA itself
- No evidence BMTA publishes live vehicle positions in any machine-readable form. BMTA's own app
  and the E-Ticket/GPS program exist internally but nothing found that exposes them publicly.

### Bottom line for (b) "should I keep waiting?"
You almost certainly cannot answer this from a live position feed. Plan for a **statistical**
answer (expected headway + elapsed wait) rather than a **tracking** answer, or accept a fragile
dependency on a private ViaBus endpoint.

## 2. Google Maps Platform — Directions API transit mode

**Verdict: this is the realistic primary data source. It answers need (a) directly, and gives you
a statistical proxy for need (b).**

### Does it return what you need?
Yes. In `transit_details` on each transit step, Directions API (Legacy) returns:
- `line.short_name` — "the short name of this line... normally a line number", e.g. "2", "M14".
  **This is your Bangkok bus number.** `line.name` (long name), `line.agency` (operator name/URL),
  `line.vehicle` (BUS / SUBWAY / etc.) also present.
- `departure_stop` — a TransitStop object (name + lat/lng) = **the stop you board at**.
  `arrival_stop` likewise. So you get stop-level boarding/alighting detail, not just a polyline.
- `num_stops`, `departure_time`, `arrival_time`.
- **`headway`** — "the expected number of seconds between departures from the same stop at this
  time... with a headway value of 600, you would expect a ten minute wait if you should miss your
  bus." **This is the single most useful field for the "should I keep waiting?" feature** — see §4.
  Caveat: documented as "when available", so expect it to be absent on many Bangkok routes.

Note: the newer **Routes API** (`computeRoutes`, TRANSIT mode) is the non-legacy successor and has
an equivalent `transitDetails` structure. Legacy Directions API still works but is in maintenance.

### Pricing (from developers.google.com/maps/billing-and-pricing/pricing, checked 2026-09-20)
The old blanket **$200/month credit is gone**. Google now uses **per-SKU free monthly caps**:

| SKU | Free events/month | Price per 1,000 (0–100K) | 100K–500K |
|---|---|---|---|
| Routes: Compute Routes **Essentials** | 10,000 | $5.00 | $4.00 |
| Routes: Compute Routes **Pro** | 5,000 | $10.00 | $8.00 |
| Directions API (Legacy) Essentials | 10,000 | $5.00 | $4.00 |

UNVERIFIED which SKU tier a *transit* Compute Routes call bills as — transit routing has
historically been a higher tier than basic driving directions. Budget for Pro (5,000 free/month,
then $10/1,000) until you confirm on a live billing report.

**Practical implication for a personal app:** 10,000 (or even 5,000) free calls/month is enormous
for one person. Realistically you will never pay Google anything. Cache aggressively anyway and
put a billing quota cap on the key so a bug can't cost money.

## 3. Longdo Map API and other Thai providers

### Longdo Map API (Metamedia Technology) — https://map.longdo.com/products/
- **Free tier is genuinely generous**, far more so than Google:
  - Map transactions < 800,000/month
  - **Service transactions < 100,000/month** (this is the bucket Route/Search/Geocode fall into)
  - Rate limits: 60 req/min, 5,000 req/day
  - Cost: ฿0
- Paid tiers (monthly): Starter ฿8,250 · Basic ฿13,750 · Standard ฿22,917 · Premium ฿27,500 ·
  Super Power (custom). **These are enterprise prices — irrelevant to a solo dev**, who should
  never leave the free tier.
- **Route API does claim a public-transport mode** ("เดินทางสาธารณะ") among its modes, alongside
  shortest/avoid-traffic/traffic-prediction/multi-destination/TSP.
- **UNVERIFIED and this is the critical gap**: whether Longdo's transit mode returns *bus route
  numbers* and *named boarding stops*, or just a geometry + travel time. The pricing page and the
  Route API marketing page do not say. **Recommend a 30-minute spike**: sign up for the free key,
  fire one transit route request across central Bangkok, and inspect the JSON. If it returns
  `route number + stop name`, Longdo is a free, Thai-sourced, locally-maintained alternative to
  Google and worth preferring.
- Docs to check during the spike: https://map.longdo.com/docs/rest and
  https://map-blog.longdo.com/longdo-map-rest-api/

### Other Thai options
- **NOSTRA Map API** (GIS Development Co.) — Thai commercial mapping provider. Has routing/POI;
  no evidence found of bus/transit routing. Pricing is quote-based, not self-serve. UNVERIFIED.
- **OpenTripPlanner self-hosted on the (stale) Bangkok GTFS** — the "own your stack" option. Free
  and gives you full stop-level control, but you inherit a 2023-vintage network that predates the
  2024 route-reform renumbering. Only viable if you're willing to curate the GTFS yourself.
- **No Thai provider found that sells real-time bus positions** to individuals at any price.

## 4. Headway / frequency data for BMTA routes

**Verdict: not published by BMTA as data. The only practical machine-readable source is Google's
`headway` field. Beyond that, you measure it yourself.**

- **BMTA's own site (bmta.co.th) does not publish headways.** The "เวลาเดินรถ" page and the
  `/bus-lines` listing are a route-search UI, not a dataset — no downloadable table, no API,
  no "every N minutes" field surfaced. First-bus/last-bus times exist per route inside the site's
  route pages but are not exposed as a feed. No `data.go.th` BMTA frequency dataset found.
- **Google Directions `transit_details.headway`** is the one structured "runs every N seconds"
  value you can actually call for. Documented as available "when available" — quality for Bangkok
  is UNVERIFIED and likely patchy, because Google's headway comes from `frequencies.txt` in the
  underlying GTFS, and the Bangkok feed's completeness there is unknown.
- **GTFS `frequencies.txt`**: the stale asiripanich/bangkok-gtfs snapshot (2023-04) may contain it.
  Cheap to check locally — clone and grep. If present, you get published headways per route per
  time-band for free, at the cost of a 3-year-old network.
- **The honest fallback, and arguably the right design**: log your own observations. Bangkok bus
  headways are dominated by traffic variance, not by the timetable, so a published "every 10 min"
  is a weak predictor anyway. A personal app that records "I saw bus 8 at 08:14, 08:31, 08:52 at
  this stop" builds an empirical waiting-time distribution for *your* stops within a few weeks —
  which is strictly better for answering "should I keep waiting?" than any published headway.
  Use the renewal-process result: for observed headways, expected remaining wait given you've
  already waited *t* minutes rises as the distribution's tail gets fatter. That's the actual
  signal the user wants.

## 5. Non-BMTA operators (รถร่วมบริการ, Thai Smile Bus, minibus, สองแถว)

**Verdict: this is the biggest data-quality trap in the whole project. BMTA is now a minority of
Bangkok's bus network.**

Scale of the network (Bangkok Metropolitan Region):
- **BMTA**: ~112 routes, ~2,884 buses (BMTA's own figure; other sources cite ~3,506 buses).
- **Thai Smile Bus (TSB)**: **123 routes as of 2025** — *more routes than BMTA*. All-EV fleet.
  Has progressively taken over routes from BMTA since 2022 under a Ministry of Transport
  concession. Also runs Thai Smile Boat ferries.
- **Whole region**: ~**470 routes** and ~**16,321 vehicles** once you include รถร่วมบริการ
  (joint-service private operators), minibuses, สองแถว (songthaew) and vans.

Implications:
- **Real-time is fragmented per operator, not per city.** ViaBus reportedly works well for BMTA
  routes but **does not receive real-time GPS for Thai Smile Bus routes**; TSB pushes riders to its
  own app, **TSB Go Plus**, which carries GPS for TSB buses only. So even the "just use ViaBus"
  answer covers less than half the network. UNVERIFIED whether TSB Go Plus has any API (almost
  certainly not).
- **Songthaew and van routes are essentially undocumented.** They have no fixed stops in the
  formal sense, no published route numbers in any dataset, and no GPS. ViaBus nominally supports
  songthaew as a mode but coverage is crowd-dependent. Do not plan features around them.
- **The 2024 bus reform renumbered routes** (107 new-format route numbers went live 2024-07-25,
  e.g. old "8" → new-format codes). Any dataset older than mid-2024 — including the 2023 GTFS
  snapshot — carries obsolete route numbers. Since need (a) is literally "tell me the bus number",
  a stale numbering scheme is a correctness bug, not a cosmetic one. Google's transit data is the
  most likely to be current here.

## Confidence and gaps

**High confidence**
- No public ViaBus API exists; no Bangkok GTFS-Realtime feed exists; BMTA publishes no live
  vehicle positions. Searched EN + TH, multiple angles, consistent negative.
- Google Directions/Routes `transit_details` returns `line.short_name` (bus number),
  `departure_stop`/`arrival_stop` (named, with coords), `num_stops`, and `headway`.
- Google's $200 blanket credit is gone; it is now per-SKU free caps (10,000/mo Essentials,
  5,000/mo Pro) with $5 / $10 per 1,000 thereafter.
- Longdo free tier limits (800k map / 100k service transactions per month, 60/min, 5,000/day).
- TSB ≈123 routes vs BMTA ≈112; region total ≈470 routes / ≈16,321 vehicles.

**Unverified — worth a short spike before committing architecture**
1. Whether Longdo's Route API transit mode actually returns bus route numbers and stop names.
   *(Highest-value unknown. Free key, one request, ~30 min.)*
2. Which Google SKU tier a TRANSIT `computeRoutes` call bills as (Essentials vs Pro).
3. Whether `headway` is actually populated for Bangkok bus routes in practice, and how often.
4. Whether `pleum/viabusgo`'s unofficial endpoints still function in 2026 (repo looks abandoned).
5. Whether the 2023 bangkok-gtfs snapshot contains `frequencies.txt`, and what its upstream
   source was.
6. Whether TSB Go Plus exposes anything queryable.
7. NOSTRA Map API transit capability and pricing — barely investigated.

**Known gaps not investigated**
- data.go.th (Thai national open-data portal) was not searched directly for BMTA datasets.
- Transit apps with possible APIs (Moovit, Transit App) and their licensing terms.
- Legal/ToS analysis of scraping any operator app — flagged, not assessed.

**Methodology note**: ~13 web calls, English and Thai queries. Absence of evidence for the
real-time feeds is strong here (multiple independent search angles, all negative, and the
existence of an *unofficial* Go wrapper is itself evidence that no official one exists), but it
is still absence of evidence.
