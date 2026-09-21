import type {
  BusData,
  Direction,
  PackedBusData,
  PackedDirections,
  Route,
  Stop,
} from './types'

const COORD_SCALE = 1e6
const OFFSET_UNIT_SEC = 5

function decodeDeltaColumn(deltas: number[]): number[] {
  const out: number[] = []
  let running = 0
  for (const d of deltas) {
    running += d
    out.push(running)
  }
  return out
}

function decodeStops(id: string[], nameTh: string[], nameEn: string[], latE6: number[], lonE6: number[]): Stop[] {
  const lats = decodeDeltaColumn(latE6)
  const lons = decodeDeltaColumn(lonE6)
  return id.map((stopId, i) => ({
    id: stopId,
    nameTh: nameTh[i],
    nameEn: nameEn[i],
    lat: lats[i] / COORD_SCALE,
    lon: lons[i] / COORD_SCALE,
  }))
}

function decodeRoutes(packed: PackedBusData['routes']): Route[] {
  return packed.id.map((id, i) => ({
    id,
    agency: packed.agency[i],
    newCode: packed.newCode[i],
    oldCode: packed.oldCode[i],
    longNameTh: packed.longNameTh[i],
    longNameEn: packed.longNameEn[i],
  }))
}

function decodeShape(flat: number[]): [number, number][] {
  const points: [number, number][] = []
  let lat = 0
  let lon = 0
  for (let i = 0; i < flat.length; i += 2) {
    lat += flat[i]
    lon += flat[i + 1]
    points.push([lat / COORD_SCALE, lon / COORD_SCALE])
  }
  return points
}

function decodeDirections(packed: PackedDirections): Direction[] {
  return packed.routeIdx.map((routeIdx, i) => ({
    routeIdx,
    directionId: packed.directionId[i],
    headsignTh: packed.headsignTh[i],
    headsignEn: packed.headsignEn[i],
    stopIdxs: packed.stopIdxs[i],
    offsetsSec: packed.offsets5s[i].map((u) => u * OFFSET_UNIT_SEC),
    headwaySec: packed.headwaySec[i],
    shapeCoords: decodeShape(packed.shapeE6[i]),
  }))
}

export function decodePackedBusData(packed: PackedBusData): BusData {
  return {
    generatedAt: packed.generatedAt,
    feedVersion: packed.feedVersion,
    stops: decodeStops(packed.stops.id, packed.stops.nameTh, packed.stops.nameEn, packed.stops.latE6, packed.stops.lonE6),
    routes: decodeRoutes(packed.routes),
    directions: decodeDirections(packed.directions),
  }
}
