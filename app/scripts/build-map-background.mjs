// Reads pre-fetched Overpass extracts from OSM_DIR (see below) — there is no
// fetch step here except in .github/workflows/update-map-background.yml,
// which runs monthly; a manual re-fetch uses the same queries below. Files
// are gitignored (scratch/osm/, ~40 MB total, re-downloadable) and read from:
// roads.json, roads-secondary.json, rivers.json, places.json.
//
// A generic User-Agent like "Mozilla/5.0" gets a bare 406 from
// overpass-api.de's WAF on /api/interpreter specifically (its /api/status
// still answers) — send a full browser UA string. If that endpoint stays
// blocked, overpass.kumi.systems is a working mirror, but check its
// osm3s.timestamp_osm_base in the response: it can lag the main instance by
// months (the places.json shipped as of 2026-09-22 was fetched from kumi
// with a 2026-07-15 base — acceptable for a monthly-refresh convenience
// layer, but prefer overpass-api.de when it's available).
//
// roads.json — motorway/trunk/primary and their _link variants:
// [out:json][timeout:180];
// way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link)$"](<south>,<west>,<north>,<east>);
// out geom;
//
// roads-secondary.json — secondary/tertiary and their _link variants:
// [out:json][timeout:180];
// way["highway"~"^(secondary|secondary_link|tertiary|tertiary_link)$"](<south>,<west>,<north>,<east>);
// out geom;
//
// rivers.json:
// [out:json][timeout:180];
// way["waterway"="river"](<south>,<west>,<north>,<east>);
// out geom;
//
// footbridges.json — pedestrian overpasses, shown as a plain visual layer so
// a rider can see where a crossing exists near a stop; the app never infers
// which side of the road anyone is standing on to recommend one (WF-003):
// [out:json][timeout:120];
// way["highway"="footway"]["bridge"="yes"](<south>,<west>,<north>,<east>);
// out geom;
//
// places.json must be queried with `nwr[...]` and `out center;`, not
// `node[...]` — a mall mapped as a building outline (a way) has no top-level
// lat/lon, only `.center`, and a `node`-only query silently drops it:
//
// [out:json][timeout:180];
// (
//   nwr["railway"="station"](<south>,<west>,<north>,<east>);
//   nwr["station"="subway"](<south>,<west>,<north>,<east>);
//   nwr["shop"="mall"](<south>,<west>,<north>,<east>);
//   nwr["amenity"="hospital"](<south>,<west>,<north>,<east>);
//   nwr["amenity"="university"](<south>,<west>,<north>,<east>);
//   nwr["amenity"="marketplace"](<south>,<west>,<north>,<east>);
//   nwr["amenity"="ferry_terminal"](<south>,<west>,<north>,<east>);
//   nwr["amenity"="place_of_worship"](<south>,<west>,<north>,<east>);
//   nwr["amenity"="school"](<south>,<west>,<north>,<east>);
//   nwr["leisure"="park"](<south>,<west>,<north>,<east>);
//   nwr["office"="government"](<south>,<west>,<north>,<east>);
//   nwr["amenity"="townhall"](<south>,<west>,<north>,<east>);
//   node["highway"="bus_stop"]["name"](<south>,<west>,<north>,<east>);
// );
// out center;
//
// The last line is a deliberate exception: a bus stop is transit
// infrastructure, not a landmark, but Thai OSM contributors sometimes name a
// stop after the storefront next to it (e.g. a mall recorded nowhere else in
// OSM) — see .wayfinder/research/ for the "ทรี ออน ธรี" case that prompted
// this. Kept lowest display priority (see PLACE_KIND_PRIORITY in svgMap.ts)
// so it never crowds out an actual amenity when a view has more than
// maxCount candidates.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { douglasPeucker, haversineMeters, lineLengthMeters } from './simplify.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OSM_DIR = process.env.OSM_DIR ?? join(__dirname, '..', '..', 'scratch', 'osm')
const OUT_FILE = join(__dirname, '..', 'public', 'data', 'map-background.json')

const ROAD_TOLERANCE_M = 30
const RIVER_TOLERANCE_M = 40
const MIN_LINE_LENGTH_M = 250
// Footbridges are short by nature (median ~25m in the current extract — a
// single crossing over one road), so the road/river minimum would discard
// almost all of them (only 73 of 3,216 clear 250m). Barely simplify either:
// a few-point line is already as simple as these get.
const FOOTBRIDGE_TOLERANCE_M = 5
const MIN_FOOTBRIDGE_LENGTH_M = 3
// Was 550m back when places.json only covered 5-6 sparse categories
// (stations, malls, hospitals, universities, markets). Once
// worship/school/park/government/landmark-bus-stop were added, real, distinct
// places in dense areas started colliding: a 550m radius silently dropped
// "เทอร์มินอล 21 พระราม 3" and "ทรี ออน ธรี" because seven separate named
// places (mall, hotel, pier, temple, bus stops) sit within 550m of each
// other there, and dedup keeps only whichever was encountered first.
// Measured against the current extract: 550m -> 1,717 places (both those
// landmarks missing); 150m -> 3,883 places (both present, +87KB gzip) with
// no meaningfully closer look-alike duplicates reappearing.
const PLACE_DEDUPE_RADIUS_M = 150

const ROAD_PRIORITY = { river: 0, motorway: 1, trunk: 1, primary: 2, secondary: 3, tertiary: 4 }

// Each row is [osmKey, osmValue, ourKind]. A node/way can only be resolved to
// one kind, so order matters when a place could match more than one row —
// it doesn't currently, but keep more specific tags above 'other'-ish ones
// if that changes.
const PLACE_KIND_RULES = [
  ['railway', 'station', 'transit'],
  ['station', 'subway', 'transit'],
  ['amenity', 'ferry_terminal', 'transit'],
  ['shop', 'mall', 'mall'],
  ['amenity', 'hospital', 'hospital'],
  ['amenity', 'university', 'university'],
  ['amenity', 'marketplace', 'market'],
  ['amenity', 'place_of_worship', 'worship'],
  ['amenity', 'school', 'school'],
  ['leisure', 'park', 'park'],
  ['office', 'government', 'government'],
  ['amenity', 'townhall', 'government'],
  ['highway', 'bus_stop', 'landmark'],
]

function readOsm(name) {
  return JSON.parse(readFileSync(join(OSM_DIR, name), 'utf-8')).elements
}

function toPointArray(geometry) {
  return geometry.map((g) => ({ lat: g.lat, lon: g.lon }))
}

function buildLines(ways, kind, toleranceM, minLengthM) {
  const lines = []
  for (const way of ways) {
    if (!way.geometry || way.geometry.length < 2) continue
    const raw = toPointArray(way.geometry)
    const simplified = douglasPeucker(raw, toleranceM)
    if (simplified.length < 2) continue
    if (lineLengthMeters(simplified) < minLengthM) continue

    const name = way.tags?.name ?? null
    const priority = kind === 'river' ? ROAD_PRIORITY.river : (ROAD_PRIORITY[way.tags?.highway] ?? 5)

    lines.push({
      kind,
      points: simplified.map((p) => [p.lat, p.lon]),
      name,
      priority,
    })
  }
  return lines
}

function buildLabels(lines) {
  return lines
    .filter((line) => line.name)
    .map((line) => {
      const mid = line.points[Math.floor(line.points.length / 2)]
      return { lat: mid[0], lon: mid[1], name: line.name, priority: line.priority }
    })
}

function placeKind(tags) {
  for (const [key, value, kind] of PLACE_KIND_RULES) {
    if (tags[key] === value) return kind
  }
  return 'other'
}

// Overpass returns nodes with lat/lon at the top level, but ways/relations
// (queried with `nwr` and `out center`) instead carry their centroid under
// `.center` — a mall mapped as a building outline has no other coordinate.
function elementCoords(element) {
  return element.type === 'node' ? { lat: element.lat, lon: element.lon } : element.center
}

function dedupePlaces(elements) {
  const named = elements.filter((e) => e.tags?.name && elementCoords(e))
  const kept = []
  for (const element of named) {
    const coords = elementCoords(element)
    const nearby = kept.find((k) => haversineMeters(k, coords) <= PLACE_DEDUPE_RADIUS_M)
    if (nearby) continue
    kept.push({ ...coords, name: element.tags.name, kind: placeKind(element.tags) })
  }
  return kept
}

function build() {
  const roadWays = [...readOsm('roads.json'), ...readOsm('roads-secondary.json')]
  const riverWays = readOsm('rivers.json')
  const footbridgeWays = readOsm('footbridges.json')
  const placeNodes = readOsm('places.json')

  const roadLines = buildLines(roadWays, 'road', ROAD_TOLERANCE_M, MIN_LINE_LENGTH_M)
  const riverLines = buildLines(riverWays, 'river', RIVER_TOLERANCE_M, MIN_LINE_LENGTH_M)
  const footbridgeLines = buildLines(footbridgeWays, 'footbridge', FOOTBRIDGE_TOLERANCE_M, MIN_FOOTBRIDGE_LENGTH_M)
  const lines = [...riverLines, ...roadLines, ...footbridgeLines]
  const labels = buildLabels(lines)
  const places = dedupePlaces(placeNodes)

  const data = { generatedAt: new Date().toISOString(), lines, labels, places }
  writeFileSync(OUT_FILE, JSON.stringify(data))

  console.log(`lines: ${lines.length} (roads: ${roadLines.length}, rivers: ${riverLines.length}, footbridges: ${footbridgeLines.length})`)
  console.log(`labels: ${labels.length}`)
  console.log(`places: ${places.length} (from ${placeNodes.length} raw elements)`)
  console.log(`output: ${OUT_FILE}`)
}

build()
