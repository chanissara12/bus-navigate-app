import { haversineMeters, type LatLon } from './geo'
import type { MapLabel, MapLine, MapPlace } from './types'

export interface BBox {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}

const PLACE_KIND_PRIORITY: Record<string, number> = {
  transit: 0,
  mall: 1,
  market: 2,
  hospital: 3,
  university: 4,
  worship: 5,
  school: 5,
  park: 5,
  government: 5,
  // A named bus stop is transit infrastructure, not a real amenity — it
  // only exists in this list for the rare landmark OSM has no other record
  // of (see build-map-background.mjs). Keep it below every real category.
  landmark: 6,
}

export function boundingBoxWithMargin(points: LatLon[], marginRatio: number): BBox {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lon < minLon) minLon = p.lon
    if (p.lon > maxLon) maxLon = p.lon
  }

  const latSpan = maxLat - minLat || 0.002
  const lonSpan = maxLon - minLon || 0.002
  const latMargin = latSpan * marginRatio
  const lonMargin = lonSpan * marginRatio

  return {
    minLat: minLat - latMargin,
    maxLat: maxLat + latMargin,
    minLon: minLon - lonMargin,
    maxLon: maxLon + lonMargin,
  }
}

export function bboxAroundCenter(center: LatLon, radiusM: number): BBox {
  const metersPerDegreeLon = 111320 * Math.cos((center.lat * Math.PI) / 180)
  const metersPerDegreeLat = 110540
  const latDelta = radiusM / metersPerDegreeLat
  const lonDelta = radiusM / metersPerDegreeLon
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLon: center.lon - lonDelta,
    maxLon: center.lon + lonDelta,
  }
}

export function bboxSizeMeters(bbox: BBox): { widthM: number; heightM: number } {
  const centerLat = (bbox.minLat + bbox.maxLat) / 2
  const metersPerDegreeLon = 111320 * Math.cos((centerLat * Math.PI) / 180)
  const metersPerDegreeLat = 110540
  return {
    widthM: (bbox.maxLon - bbox.minLon) * metersPerDegreeLon,
    heightM: (bbox.maxLat - bbox.minLat) * metersPerDegreeLat,
  }
}

export function projectPoint(point: LatLon, bbox: BBox): { x: number; y: number } {
  const centerLat = (bbox.minLat + bbox.maxLat) / 2
  const metersPerDegreeLon = 111320 * Math.cos((centerLat * Math.PI) / 180)
  const metersPerDegreeLat = 110540
  return {
    x: (point.lon - bbox.minLon) * metersPerDegreeLon,
    y: (bbox.maxLat - point.lat) * metersPerDegreeLat,
  }
}

export function unprojectPoint(point: { x: number; y: number }, bbox: BBox): LatLon {
  const centerLat = (bbox.minLat + bbox.maxLat) / 2
  const metersPerDegreeLon = 111320 * Math.cos((centerLat * Math.PI) / 180)
  const metersPerDegreeLat = 110540
  return {
    lon: bbox.minLon + point.x / metersPerDegreeLon,
    lat: bbox.maxLat - point.y / metersPerDegreeLat,
  }
}

/**
 * Converts the current pan/zoom window (in the same meter-offset space `projectPoint`
 * produces, relative to `base`) back into a lat/lon bbox, so content filtering
 * (which labels/places/lines to show) can track what's actually visible as the user
 * zooms and pans, instead of staying fixed to the box the map first fit to.
 */
export function bboxFromView(
  base: BBox,
  view: { zoom: number; panX: number; panY: number },
  baseSize: { width: number; height: number },
): BBox {
  const viewW = baseSize.width / view.zoom
  const viewH = baseSize.height / view.zoom
  const topLeft = unprojectPoint({ x: view.panX, y: view.panY }, base)
  const bottomRight = unprojectPoint({ x: view.panX + viewW, y: view.panY + viewH }, base)
  return {
    minLat: bottomRight.lat,
    maxLat: topLeft.lat,
    minLon: topLeft.lon,
    maxLon: bottomRight.lon,
  }
}

function pointInBbox(lat: number, lon: number, bbox: BBox): boolean {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lon >= bbox.minLon && lon <= bbox.maxLon
}

export interface WalkPath {
  points: LatLon[]
  meters: number
  viaFootbridge: boolean
}

const FOOTBRIDGE_SEARCH_RADIUS_M = 500
const FOOTBRIDGE_DETOUR_FACTOR = 1.6
const ROAD_SNAP_MAX_DISTANCE_M = 40

// A leg that couldn't be snapped to any road is a straight line cutting
// across whatever's actually there (buildings, lots) — fine for a short hop
// off a mapped road onto a doorway, but past this length it's standing in
// for a real route we don't know, and a straight line understates it.
// Confirmed case: the "shortcut" to a footbridge from "ตรงข้ามโรงแรมมณเฑียร
// ริเวอร์ไซด์" read as 203m via a 154m unsnapped straight leg, while
// Google Maps' actual routed distance is longer — this buffer keeps that
// unmapped leg from being reported as if it were a real, walkable line.
const UNSNAPPED_WALK_BUFFER = 1.4
const UNSNAPPED_BUFFER_MIN_M = 60

interface RoadSnapResult {
  points: LatLon[]
  snapped: boolean
}

// A straight line between two points a block apart cuts across buildings —
// it reads as a displacement vector, not a walk. Where a road runs close to
// both ends of a leg, follow that road's own vertices between them instead,
// with only a short perpendicular hop at each end connecting the real point
// to the road. Falls back to a straight line where no road is close enough
// to both ends (e.g. crossing a footbridge itself).
function snapToNearestRoad(from: LatLon, to: LatLon, lines: MapLine[]): RoadSnapResult {
  let best: { path: LatLon[]; score: number } | null = null

  for (const line of lines) {
    if (line.kind !== 'road' || line.points.length < 2) continue
    const fromProj = nearestSegmentProjection(line.points, from)
    const toProj = nearestSegmentProjection(line.points, to)
    if (!fromProj || !toProj) continue
    if (fromProj.distanceM > ROAD_SNAP_MAX_DISTANCE_M || toProj.distanceM > ROAD_SNAP_MAX_DISTANCE_M) continue

    const score = fromProj.distanceM + toProj.distanceM
    if (best && score >= best.score) continue

    const forward = fromProj.segmentIndex <= toProj.segmentIndex
    const [loProj, hiProj] = forward ? [fromProj, toProj] : [toProj, fromProj]
    const middle = line.points
      .slice(loProj.segmentIndex + 1, hiProj.segmentIndex + 1)
      .map(([lat, lon]): LatLon => ({ lat, lon }))
    const onRoad = [
      { lat: loProj.point[0], lon: loProj.point[1] },
      ...middle,
      { lat: hiProj.point[0], lon: hiProj.point[1] },
    ]
    best = { path: forward ? onRoad : onRoad.reverse(), score }
  }

  return best ? { points: [from, ...best.path, to], snapped: true } : { points: [from, to], snapped: false }
}

function snapWalkToRoads(points: LatLon[], lines: MapLine[]): { points: LatLon[]; meters: number } {
  const snapped: LatLon[] = [points[0]]
  let meters = 0
  for (let i = 0; i < points.length - 1; i += 1) {
    const segment = snapToNearestRoad(points[i], points[i + 1], lines)
    snapped.push(...segment.points.slice(1))

    let segmentMeters = 0
    for (let j = 1; j < segment.points.length; j += 1) segmentMeters += haversineMeters(segment.points[j - 1], segment.points[j])
    if (!segment.snapped && segmentMeters > UNSNAPPED_BUFFER_MIN_M) segmentMeters *= UNSNAPPED_WALK_BUFFER
    meters += segmentMeters
  }
  return { points: snapped, meters }
}

// A pragmatic heuristic, not real pedestrian routing: if a nearby footbridge's
// endpoints let you reach the destination without much more walking than a
// straight line would take, assume that's the sanctioned way to cross
// whatever road sits between the alight stop and the destination. This never
// guesses which side of a road anyone is standing on (WF-003) — both ends
// here are fixed, known coordinates (an alight stop and a destination), not
// a live rider position.
export function findWalkingPath(from: LatLon, to: LatLon, lines: MapLine[]): WalkPath {
  const directMeters = haversineMeters(from, to)
  let best: { points: LatLon[]; totalMeters: number } | null = null

  for (const line of lines) {
    if (line.kind !== 'footbridge' || line.points.length < 2) continue
    const start: LatLon = { lat: line.points[0][0], lon: line.points[0][1] }
    const end: LatLon = { lat: line.points[line.points.length - 1][0], lon: line.points[line.points.length - 1][1] }

    for (const [near, far] of [
      [start, end],
      [end, start],
    ] as const) {
      if (haversineMeters(from, near) > FOOTBRIDGE_SEARCH_RADIUS_M) continue
      const totalMeters = haversineMeters(from, near) + haversineMeters(near, far) + haversineMeters(far, to)
      if (totalMeters > directMeters * FOOTBRIDGE_DETOUR_FACTOR) continue
      if (!best || totalMeters < best.totalMeters) best = { points: [from, near, far, to], totalMeters }
    }
  }

  const rawPoints = best ? best.points : [from, to]
  const snapped = snapWalkToRoads(rawPoints, lines)
  return { points: snapped.points, meters: snapped.meters, viaFootbridge: !!best }
}

// motorway/trunk/primary — matches ROAD_PRIORITY in build-map-background.mjs.
// Secondary/tertiary roads are excluded: real friction (crossing without a
// signal, dodging fast multi-lane traffic) mainly comes from the big ones.
const MAJOR_ROAD_MAX_PRIORITY = 2

function crossProduct(o: LatLon, a: LatLon, b: LatLon): number {
  return (a.lon - o.lon) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lon - o.lon)
}

// Product-based (not sign-XOR) on purpose: a point that lands exactly on the
// other segment gives a cross product of 0, and 0 * anything is never < 0 —
// so merely touching an endpoint (e.g. a destination that sits right at a
// road vertex, which happens with real OSM-derived coordinates) reads as
// "not crossing", only a genuine straddle does.
function segmentsIntersect(p1: LatLon, p2: LatLon, p3: LatLon, p4: LatLon): boolean {
  const d1 = crossProduct(p3, p4, p1)
  const d2 = crossProduct(p3, p4, p2)
  const d3 = crossProduct(p1, p2, p3)
  const d4 = crossProduct(p1, p2, p4)
  return d1 * d2 < 0 && d3 * d4 < 0
}

// Whether walking straight from one point to the other crosses a major
// road — a real, known-in-advance fact about two fixed points (an alight
// stop or origin, and a destination or board stop), not a guess about
// where a live rider is standing relative to a road (WF-003 stays
// untouched by this: it's a different question).
export function crossesMajorRoad(from: LatLon, to: LatLon, lines: MapLine[]): boolean {
  for (const line of lines) {
    if (line.kind !== 'road' || line.priority > MAJOR_ROAD_MAX_PRIORITY) continue
    for (let i = 0; i < line.points.length - 1; i += 1) {
      const a: LatLon = { lat: line.points[i][0], lon: line.points[i][1] }
      const b: LatLon = { lat: line.points[i + 1][0], lon: line.points[i + 1][1] }
      if (segmentsIntersect(from, to, a, b)) return true
    }
  }
  return false
}

export function lineClassName(line: MapLine): string {
  if (line.kind === 'river') return 'map-river'
  if (line.kind === 'footbridge') return 'map-footbridge'
  const isMinorRoad = line.kind === 'road' && line.priority >= 3
  return isMinorRoad ? 'map-road map-road-minor' : 'map-road'
}

export function lineIntersectsBbox(line: MapLine, bbox: BBox): boolean {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  for (const [lat, lon] of line.points) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
  }
  return maxLat >= bbox.minLat && minLat <= bbox.maxLat && maxLon >= bbox.minLon && minLon <= bbox.maxLon
}

export function filterLabelsForDisplay(labels: MapLabel[], bbox: BBox, maxCount: number): MapLabel[] {
  const inBbox = labels.filter((l) => pointInBbox(l.lat, l.lon, bbox))
  const sorted = [...inBbox].sort((a, b) => a.priority - b.priority)

  const seenNames = new Set<string>()
  const result: MapLabel[] = []
  for (const label of sorted) {
    if (seenNames.has(label.name)) continue
    seenNames.add(label.name)
    result.push(label)
    if (result.length >= maxCount) break
  }
  return result
}

const SEARCH_WINDOW_FRACTION = 0.25
const METERS_PER_DEGREE_LAT = 110540

function toLocalMeters(point: LatLon, origin: LatLon): { x: number; y: number } {
  const metersPerDegreeLon = 111320 * Math.cos((origin.lat * Math.PI) / 180)
  return { x: (point.lon - origin.lon) * metersPerDegreeLon, y: (point.lat - origin.lat) * METERS_PER_DEGREE_LAT }
}

interface SegmentProjection {
  segmentIndex: number
  point: [number, number]
  distanceM: number
}

/**
 * After Douglas-Peucker simplification, a stop's true closest approach to the route
 * is often *along a segment* between two kept vertices, not at either vertex — simplification
 * only guarantees the removed points stay within tolerance of the simplified line, not that a
 * stop lands near a surviving vertex. Projecting onto segments (not just comparing to
 * vertices) is what keeps the rendered line from visibly detaching from the stop marker.
 *
 * Loop routes (วนซ้าย/วนขวา) can also pass within meters of the same stop twice, so an
 * unconstrained search can snap to the wrong occurrence. `expectedFraction` (how far along
 * the stop sequence we already are, 0..1) narrows the search to a window around where the
 * shape should be at that point, falling back to the full shape when that window is empty.
 */
function nearestSegmentProjection(
  shape: [number, number][],
  point: LatLon,
  expectedFraction?: number,
): SegmentProjection | null {
  const segmentCount = shape.length - 1
  if (segmentCount < 1) return null

  let searchStart = 0
  let searchEnd = segmentCount

  if (expectedFraction !== undefined) {
    const center = expectedFraction * (segmentCount - 1)
    const window = segmentCount * SEARCH_WINDOW_FRACTION
    searchStart = Math.max(0, Math.floor(center - window))
    searchEnd = Math.min(segmentCount, Math.ceil(center + window))
  }

  let best: SegmentProjection | null = null
  for (let i = searchStart; i < searchEnd; i += 1) {
    const a: LatLon = { lat: shape[i][0], lon: shape[i][1] }
    const b: LatLon = { lat: shape[i + 1][0], lon: shape[i + 1][1] }
    const pLocal = toLocalMeters(point, a)
    const bLocal = toLocalMeters(b, a)
    const lengthSq = bLocal.x * bLocal.x + bLocal.y * bLocal.y
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (pLocal.x * bLocal.x + pLocal.y * bLocal.y) / lengthSq))
    const projected: [number, number] = [a.lat + t * (b.lat - a.lat), a.lon + t * (b.lon - a.lon)]
    const distanceM = haversineMeters(point, { lat: projected[0], lon: projected[1] })
    if (!best || distanceM < best.distanceM) best = { segmentIndex: i, point: projected, distanceM }
  }
  return best
}

export function sliceShapeFromNearestPoint(
  shape: [number, number][],
  point: LatLon,
  expectedFraction?: number,
): [number, number][] {
  const nearest = nearestSegmentProjection(shape, point, expectedFraction)
  return nearest === null ? shape : [nearest.point, ...shape.slice(nearest.segmentIndex + 1)]
}

export function sliceShapeToNearestPoint(
  shape: [number, number][],
  point: LatLon,
  expectedFraction?: number,
): [number, number][] {
  const nearest = nearestSegmentProjection(shape, point, expectedFraction)
  return nearest === null ? shape : [...shape.slice(0, nearest.segmentIndex + 1), nearest.point]
}

export function filterPlacesForDisplay(places: MapPlace[], bbox: BBox, maxCount: number): MapPlace[] {
  const inBbox = places.filter((p) => pointInBbox(p.lat, p.lon, bbox))
  const sorted = [...inBbox].sort(
    (a, b) => (PLACE_KIND_PRIORITY[a.kind] ?? 5) - (PLACE_KIND_PRIORITY[b.kind] ?? 5),
  )
  return sorted.slice(0, maxCount)
}
