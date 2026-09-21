// Reads pre-fetched Overpass extracts from OSM_DIR (see below) — there is no
// fetch step here, the JSON files are pulled manually and are gitignored
// (scratch/osm/, ~40 MB, re-downloadable). places.json in particular must be
// queried with `nwr[...]` and `out center;`, not `node[...]` — a mall mapped
// as a building outline (a way) has no top-level lat/lon, only `.center`,
// and `node`-only queries silently drop it. Query used for the current data:
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
// );
// out center;
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
const PLACE_DEDUPE_RADIUS_M = 550

const ROAD_PRIORITY = { river: 0, motorway: 1, trunk: 1, primary: 2, secondary: 3, tertiary: 4 }
const PLACE_KIND_BY_TAG = {
  station: 'transit',
  subway: 'transit',
  ferry_terminal: 'transit',
  mall: 'mall',
  hospital: 'hospital',
  university: 'university',
  marketplace: 'market',
}

function readOsm(name) {
  return JSON.parse(readFileSync(join(OSM_DIR, name), 'utf-8')).elements
}

function toPointArray(geometry) {
  return geometry.map((g) => ({ lat: g.lat, lon: g.lon }))
}

function buildLines(ways, kind, toleranceM) {
  const lines = []
  for (const way of ways) {
    if (!way.geometry || way.geometry.length < 2) continue
    const raw = toPointArray(way.geometry)
    const simplified = douglasPeucker(raw, toleranceM)
    if (simplified.length < 2) continue
    if (lineLengthMeters(simplified) < MIN_LINE_LENGTH_M) continue

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
  for (const [tag, kind] of Object.entries(PLACE_KIND_BY_TAG)) {
    if (tags.railway === tag || tags.station === tag || tags.shop === tag || tags.amenity === tag) return kind
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
  const placeNodes = readOsm('places.json')

  const roadLines = buildLines(roadWays, 'road', ROAD_TOLERANCE_M)
  const riverLines = buildLines(riverWays, 'river', RIVER_TOLERANCE_M)
  const lines = [...riverLines, ...roadLines]
  const labels = buildLabels(lines)
  const places = dedupePlaces(placeNodes)

  const data = { generatedAt: new Date().toISOString(), lines, labels, places }
  writeFileSync(OUT_FILE, JSON.stringify(data))

  console.log(`lines: ${lines.length} (roads: ${roadLines.length}, rivers: ${riverLines.length})`)
  console.log(`labels: ${labels.length}`)
  console.log(`places: ${places.length} (from ${placeNodes.length} raw elements)`)
  console.log(`output: ${OUT_FILE}`)
}

build()
