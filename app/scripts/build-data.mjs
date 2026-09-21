import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseCsv } from './csv.mjs'
import { dedupeDirections } from './dedupeDirections.mjs'
import { douglasPeucker, haversineMeters } from './simplify.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GTFS_DIR = process.env.GTFS_DIR ?? join(__dirname, '..', '..', 'scratch', 'gtfs')
const OUT_FILE = join(__dirname, '..', 'public', 'data', 'bus-data.json')
const INCLUDED_AGENCIES = new Set(['BMTA', 'TSB'])
const SHAPE_TOLERANCE_M = 15
const MAX_SHAPE_POINTS = 140

function readShapesForIds(neededIds) {
  const text = readFileSync(join(GTFS_DIR, 'shapes.txt'), 'utf-8')
  const lines = text.split('\n')
  const byShapeId = new Map()

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line) continue
    const firstComma = line.indexOf(',')
    const shapeId = line.slice(1, firstComma - 1)
    if (!neededIds.has(shapeId)) continue

    const rest = line.slice(firstComma + 1).split(',')
    const lat = Number.parseFloat(rest[0].replace(/"/g, ''))
    const lon = Number.parseFloat(rest[1].replace(/"/g, ''))
    const seq = Number.parseInt(rest[2].replace(/"/g, ''), 10)

    const list = byShapeId.get(shapeId) ?? []
    list.push({ seq, lat, lon })
    byShapeId.set(shapeId, list)
  }

  for (const list of byShapeId.values()) list.sort((a, b) => a.seq - b.seq)
  return byShapeId
}

function simplifyShape(points) {
  let tolerance = SHAPE_TOLERANCE_M
  let simplified = douglasPeucker(points, tolerance)
  while (simplified.length > MAX_SHAPE_POINTS && tolerance < 500) {
    tolerance *= 1.5
    simplified = douglasPeucker(points, tolerance)
  }
  return simplified
}

function readGtfs(name) {
  return parseCsv(readFileSync(join(GTFS_DIR, name), 'utf-8'))
}

function splitBilingual(raw) {
  if (!raw) return { th: '', en: '' }
  const idx = raw.indexOf(';')
  if (idx === -1) return { th: raw, en: raw }
  return { th: raw.slice(0, idx), en: raw.slice(idx + 1) }
}

function parseRouteShortName(raw) {
  const trimmed = (raw ?? '').trim()
  const match = trimmed.match(/^([^\s(]+)\s*\(([^)]+)\)$/)
  if (match) {
    return { newCode: match[1], oldCode: match[2] }
  }
  return { newCode: trimmed, oldCode: null }
}

function timeToSeconds(hhmmss) {
  const [h, m, s] = hhmmss.split(':').map((v) => Number.parseInt(v, 10))
  return h * 3600 + m * 60 + s
}

function median(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

const COORD_SCALE = 1e6
const OFFSET_UNIT_SEC = 5

// Delta-encodes a column of coordinates (already scaled to integers): each
// value becomes the difference from the previous one, so repeated runs of
// small numbers compress far better than full-precision floats.
function deltaEncodeColumn(values) {
  const out = []
  let prev = 0
  for (const v of values) {
    out.push(v - prev)
    prev = v
  }
  return out
}

function packStops(stops) {
  const latE6 = deltaEncodeColumn(stops.map((s) => Math.round(s.lat * COORD_SCALE)))
  const lonE6 = deltaEncodeColumn(stops.map((s) => Math.round(s.lon * COORD_SCALE)))
  return {
    id: stops.map((s) => s.id),
    nameTh: stops.map((s) => s.nameTh),
    nameEn: stops.map((s) => s.nameEn),
    latE6,
    lonE6,
  }
}

function packRoutes(routes) {
  return {
    id: routes.map((r) => r.id),
    agency: routes.map((r) => r.agency),
    newCode: routes.map((r) => r.newCode),
    oldCode: routes.map((r) => r.oldCode),
    longNameTh: routes.map((r) => r.longNameTh),
    longNameEn: routes.map((r) => r.longNameEn),
  }
}

function packShape(shapeCoords) {
  const flat = []
  let prevLat = 0
  let prevLon = 0
  for (const [lat, lon] of shapeCoords) {
    const latE6 = Math.round(lat * COORD_SCALE)
    const lonE6 = Math.round(lon * COORD_SCALE)
    flat.push(latE6 - prevLat, lonE6 - prevLon)
    prevLat = latE6
    prevLon = lonE6
  }
  return flat
}

// WF-011: stop_id survives feed updates far more reliably than its meaning
// does (renames, 50m+ moves). A surviving id with drifted coordinates/name
// would silently point the app at the wrong place, so every rebuild checks
// the previous output as a checksum before overwriting it.
const STOP_DRIFT_METERS = 50

function decodePackedStopsForDiff(packedStops) {
  const byId = new Map()
  let lat = 0
  let lon = 0
  for (let i = 0; i < packedStops.id.length; i += 1) {
    lat += packedStops.latE6[i]
    lon += packedStops.lonE6[i]
    byId.set(packedStops.id[i], {
      nameTh: packedStops.nameTh[i],
      lat: lat / COORD_SCALE,
      lon: lon / COORD_SCALE,
    })
  }
  return byId
}

function warnOnStopIdDrift(newStops) {
  if (!existsSync(OUT_FILE)) return
  let previous
  try {
    previous = JSON.parse(readFileSync(OUT_FILE, 'utf-8'))
  } catch {
    return
  }
  if (!previous?.stops?.id) return

  const previousById = decodePackedStopsForDiff(previous.stops)
  let renamed = 0
  let moved = 0
  for (const stop of newStops) {
    const before = previousById.get(stop.id)
    if (!before) continue
    if (before.nameTh !== stop.nameTh) renamed += 1
    const movedMeters = haversineMeters({ lat: before.lat, lon: before.lon }, { lat: stop.lat, lon: stop.lon })
    if (movedMeters > STOP_DRIFT_METERS) moved += 1
  }
  if (renamed > 0 || moved > 0) {
    console.warn(
      `stop_id drift vs previous build: ${renamed} renamed, ${moved} moved >${STOP_DRIFT_METERS}m (same id, changed meaning — verify before shipping)`,
    )
  }
}

function packDirections(directions) {
  return {
    routeIdx: directions.map((d) => d.routeIdx),
    directionId: directions.map((d) => d.directionId),
    headsignTh: directions.map((d) => d.headsignTh),
    headsignEn: directions.map((d) => d.headsignEn),
    headwaySec: directions.map((d) => d.headwaySec),
    stopIdxs: directions.map((d) => d.stopIdxs),
    offsets5s: directions.map((d) => d.offsetsSec.map((s) => Math.round(s / OFFSET_UNIT_SEC))),
    shapeE6: directions.map((d) => packShape(d.shapeCoords)),
  }
}

function build() {
  const feedInfo = readGtfs('feed_info.txt')[0]
  const routesRaw = readGtfs('routes.txt').filter((r) => INCLUDED_AGENCIES.has(r.agency_id))
  const includedRouteIds = new Set(routesRaw.map((r) => r.route_id))

  const tripsRaw = readGtfs('trips.txt').filter((t) => includedRouteIds.has(t.route_id))
  const includedTripIds = new Set(tripsRaw.map((t) => t.trip_id))

  const stopTimesRaw = readGtfs('stop_times.txt').filter((st) => includedTripIds.has(st.trip_id))
  const stopTimesByTrip = new Map()
  for (const st of stopTimesRaw) {
    const list = stopTimesByTrip.get(st.trip_id) ?? []
    list.push(st)
    stopTimesByTrip.set(st.trip_id, list)
  }
  for (const list of stopTimesByTrip.values()) {
    list.sort((a, b) => Number.parseInt(a.stop_sequence, 10) - Number.parseInt(b.stop_sequence, 10))
  }

  const headwaysByTrip = new Map()
  for (const freq of readGtfs('frequencies.txt')) {
    if (!includedTripIds.has(freq.trip_id)) continue
    const list = headwaysByTrip.get(freq.trip_id) ?? []
    list.push(Number.parseInt(freq.headway_secs, 10))
    headwaysByTrip.set(freq.trip_id, list)
  }

  const usedStopIds = new Set()
  for (const list of stopTimesByTrip.values()) {
    for (const st of list) usedStopIds.add(st.stop_id)
  }

  const stopsRaw = readGtfs('stops.txt').filter((s) => usedStopIds.has(s.stop_id))
  const stopIndexById = new Map()
  const stops = stopsRaw.map((s, idx) => {
    stopIndexById.set(s.stop_id, idx)
    const { th, en } = splitBilingual(s.stop_name)
    return {
      id: s.stop_id,
      nameTh: th,
      nameEn: en,
      lat: Number.parseFloat(s.stop_lat),
      lon: Number.parseFloat(s.stop_lon),
    }
  })

  const routeIndexById = new Map()
  const routes = routesRaw.map((r, idx) => {
    routeIndexById.set(r.route_id, idx)
    const { newCode, oldCode } = parseRouteShortName(r.route_short_name)
    const { th: longTh, en: longEn } = splitBilingual(r.route_long_name)
    return {
      id: r.route_id,
      agency: r.agency_id,
      newCode,
      oldCode,
      longNameTh: longTh,
      longNameEn: longEn,
    }
  })

  const tripsByRouteDirection = new Map()
  for (const trip of tripsRaw) {
    const key = `${trip.route_id}::${trip.direction_id}`
    const list = tripsByRouteDirection.get(key) ?? []
    list.push(trip)
    tripsByRouteDirection.set(key, list)
  }

  const directions = []
  for (const [key, trips] of tripsByRouteDirection) {
    const [routeId, directionId] = key.split('::')
    let bestTrip = null
    let bestStopTimes = []
    for (const trip of trips) {
      const stopTimes = stopTimesByTrip.get(trip.trip_id) ?? []
      if (stopTimes.length > bestStopTimes.length) {
        bestTrip = trip
        bestStopTimes = stopTimes
      }
    }
    if (!bestTrip || bestStopTimes.length === 0) continue

    const { th: headsignTh, en: headsignEn } = splitBilingual(bestTrip.trip_headsign)
    const stopIdxs = bestStopTimes.map((st) => stopIndexById.get(st.stop_id))
    const startSec = timeToSeconds(bestStopTimes[0].arrival_time)
    const offsetsSec = bestStopTimes.map((st) => timeToSeconds(st.arrival_time) - startSec)
    const allHeadways = trips.flatMap((t) => headwaysByTrip.get(t.trip_id) ?? [])

    directions.push({
      routeIdx: routeIndexById.get(routeId),
      directionId: Number.parseInt(directionId, 10),
      headsignTh,
      headsignEn,
      stopIdxs,
      offsetsSec,
      headwaySec: median(allHeadways),
      shapeId: bestTrip.shape_id || null,
    })
  }

  const dedupedDirections = dedupeDirections(routes, directions)

  const neededShapeIds = new Set(dedupedDirections.map((d) => d.shapeId).filter(Boolean))
  const shapesById = readShapesForIds(neededShapeIds)
  for (const direction of dedupedDirections) {
    const rawShape = shapesById.get(direction.shapeId)
    direction.shapeCoords =
      rawShape && rawShape.length >= 2
        ? simplifyShape(rawShape.map((p) => ({ lat: p.lat, lon: p.lon }))).map((p) => [p.lat, p.lon])
        : []
    delete direction.shapeId
  }

  warnOnStopIdDrift(stops)

  const data = {
    generatedAt: new Date().toISOString(),
    feedVersion: feedInfo?.feed_version ?? null,
    stops: packStops(stops),
    routes: packRoutes(routes),
    directions: packDirections(dedupedDirections),
  }

  writeFileSync(OUT_FILE, JSON.stringify(data))

  console.log(`routes: ${routes.length}`)
  console.log(`stops: ${stops.length}`)
  console.log(`directions: ${directions.length} (${directions.length - dedupedDirections.length} duplicate route_id records dropped)`)
  console.log(`output: ${OUT_FILE}`)
}

build()
