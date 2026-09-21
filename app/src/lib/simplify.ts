import type { LatLon } from './geo'

const METERS_PER_DEGREE_LAT = 110540

function toLocalMeters(point: LatLon, origin: LatLon): { x: number; y: number } {
  const metersPerDegreeLon = 111320 * Math.cos((origin.lat * Math.PI) / 180)
  return {
    x: (point.lon - origin.lon) * metersPerDegreeLon,
    y: (point.lat - origin.lat) * METERS_PER_DEGREE_LAT,
  }
}

function perpendicularDistanceMeters(point: LatLon, lineStart: LatLon, lineEnd: LatLon): number {
  const p = toLocalMeters(point, lineStart)
  const b = toLocalMeters(lineEnd, lineStart)
  const lineLengthSq = b.x * b.x + b.y * b.y
  if (lineLengthSq === 0) return Math.hypot(p.x, p.y)
  const cross = p.x * b.y - p.y * b.x
  return Math.abs(cross) / Math.sqrt(lineLengthSq)
}

export function douglasPeucker(points: LatLon[], toleranceMeters: number): LatLon[] {
  if (points.length < 3) return points

  let maxDistance = 0
  let maxIndex = 0
  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistanceMeters(points[i], first, last)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }

  if (maxDistance <= toleranceMeters) return [first, last]

  const left = douglasPeucker(points.slice(0, maxIndex + 1), toleranceMeters)
  const right = douglasPeucker(points.slice(maxIndex), toleranceMeters)
  return [...left.slice(0, -1), ...right]
}
