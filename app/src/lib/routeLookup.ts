import { haversineMeters, type LatLon } from './geo'
import type { BusData, Direction, Route, Stop } from './types'

export interface BoardableDirection {
  route: Route
  direction: Direction
  positionInSequence: number
}

export interface NearestStop {
  stop: Stop
  distanceM: number
}

export function findNearestStop(data: BusData, coords: LatLon, maxRadiusM: number): NearestStop | null {
  let best: NearestStop | null = null
  for (const stop of data.stops) {
    const distanceM = haversineMeters(coords, stop)
    if (distanceM > maxRadiusM) continue
    if (!best || distanceM < best.distanceM) best = { stop, distanceM }
  }
  return best
}

export function boardableDirectionsAtStop(data: BusData, stopId: string): BoardableDirection[] {
  const stopIdx = data.stops.findIndex((s) => s.id === stopId)
  if (stopIdx === -1) return []

  const result: BoardableDirection[] = []
  for (const direction of data.directions) {
    const positionInSequence = direction.stopIdxs.indexOf(stopIdx)
    if (positionInSequence === -1) continue
    const isLastStop = positionInSequence === direction.stopIdxs.length - 1
    if (isLastStop) continue
    result.push({ route: data.routes[direction.routeIdx], direction, positionInSequence })
  }
  return result
}

export function stopSequenceFrom(direction: Direction, fromPosition: number): number[] {
  return direction.stopIdxs.slice(fromPosition)
}

export function findCurrentPositionOnDirection(
  data: BusData,
  direction: Direction,
  coords: LatLon,
  maxRadiusM: number,
): number | null {
  let bestPosition: number | null = null
  let bestDistanceM = Infinity
  direction.stopIdxs.forEach((stopIdx, position) => {
    const distanceM = haversineMeters(coords, data.stops[stopIdx])
    if (distanceM > maxRadiusM) return
    if (distanceM < bestDistanceM) {
      bestDistanceM = distanceM
      bestPosition = position
    }
  })
  return bestPosition
}
