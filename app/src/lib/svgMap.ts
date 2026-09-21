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

/**
 * Loop routes (วนซ้าย/วนขวา) can pass within meters of the same stop twice, so an
 * unconstrained nearest-point search can snap to the wrong occurrence. `expectedFraction`
 * (how far along the stop sequence we already are, 0..1) narrows the search to a window
 * around where the shape should be at that point, falling back to the full shape when
 * that window turns up nothing.
 */
export function sliceShapeFromNearestPoint(
  shape: [number, number][],
  point: LatLon,
  expectedFraction?: number,
): [number, number][] {
  let searchStart = 0
  let searchEnd = shape.length

  if (expectedFraction !== undefined) {
    const center = expectedFraction * (shape.length - 1)
    const window = shape.length * SEARCH_WINDOW_FRACTION
    searchStart = Math.max(0, Math.floor(center - window))
    searchEnd = Math.min(shape.length, Math.ceil(center + window))
  }

  let bestIndex = -1
  let bestDistance = Infinity
  for (let index = searchStart; index < searchEnd; index += 1) {
    const [lat, lon] = shape[index]
    const distance = haversineMeters(point, { lat, lon })
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex === -1 ? shape : shape.slice(bestIndex)
}

export function filterPlacesForDisplay(places: MapPlace[], bbox: BBox, maxCount: number): MapPlace[] {
  const inBbox = places.filter((p) => pointInBbox(p.lat, p.lon, bbox))
  const sorted = [...inBbox].sort(
    (a, b) => (PLACE_KIND_PRIORITY[a.kind] ?? 5) - (PLACE_KIND_PRIORITY[b.kind] ?? 5),
  )
  return sorted.slice(0, maxCount)
}
