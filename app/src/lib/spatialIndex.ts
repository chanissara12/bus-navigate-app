import { haversineMeters, type LatLon } from './geo'
import type { BusData, Direction } from './types'

const CELL_SIZE_DEG = 0.005

export interface DirectionAtStop {
  direction: Direction
  position: number
}

export interface SpatialIndex {
  stopsNear(center: LatLon, radiusM: number): number[]
  directionsByStopIdx: Map<number, DirectionAtStop[]>
}

function cellKey(lat: number, lon: number): string {
  return `${Math.floor(lat / CELL_SIZE_DEG)},${Math.floor(lon / CELL_SIZE_DEG)}`
}

export function buildSpatialIndex(data: BusData): SpatialIndex {
  const grid = new Map<string, number[]>()
  data.stops.forEach((stop, idx) => {
    const key = cellKey(stop.lat, stop.lon)
    const bucket = grid.get(key)
    if (bucket) bucket.push(idx)
    else grid.set(key, [idx])
  })

  const directionsByStopIdx = new Map<number, DirectionAtStop[]>()
  for (const direction of data.directions) {
    direction.stopIdxs.forEach((stopIdx, position) => {
      const list = directionsByStopIdx.get(stopIdx)
      const entry = { direction, position }
      if (list) list.push(entry)
      else directionsByStopIdx.set(stopIdx, [entry])
    })
  }

  function stopsNear(center: LatLon, radiusM: number): number[] {
    const cellRadius = Math.ceil(radiusM / (CELL_SIZE_DEG * 111000)) + 1
    const centerCellLat = Math.floor(center.lat / CELL_SIZE_DEG)
    const centerCellLon = Math.floor(center.lon / CELL_SIZE_DEG)
    const result: number[] = []

    for (let dLat = -cellRadius; dLat <= cellRadius; dLat += 1) {
      for (let dLon = -cellRadius; dLon <= cellRadius; dLon += 1) {
        const bucket = grid.get(`${centerCellLat + dLat},${centerCellLon + dLon}`)
        if (!bucket) continue
        for (const stopIdx of bucket) {
          if (haversineMeters(center, data.stops[stopIdx]) <= radiusM) result.push(stopIdx)
        }
      }
    }
    return result
  }

  return { stopsNear, directionsByStopIdx }
}
