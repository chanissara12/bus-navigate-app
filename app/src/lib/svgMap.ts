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
