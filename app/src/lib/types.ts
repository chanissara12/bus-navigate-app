export interface Stop {
  id: string
  nameTh: string
  nameEn: string
  lat: number
  lon: number
}

export interface Route {
  id: string
  agency: string
  newCode: string
  oldCode: string | null
  longNameTh: string
  longNameEn: string
}

export interface Direction {
  routeIdx: number
  directionId: number
  headsignTh: string
  headsignEn: string
  stopIdxs: number[]
  offsetsSec: number[]
  headwaySec: number | null
  shapeCoords: [number, number][]
}

export interface BusData {
  generatedAt: string
  feedVersion: string | null
  stops: Stop[]
  routes: Route[]
  directions: Direction[]
}

// On-disk format: columnar (struct-of-arrays) instead of array-of-objects,
// coordinates delta-encoded as 1e6-scaled integers, offsets in 5-second units.
// See WF-009's resolution for why: repeated JSON keys and float precision were
// most of the shipped bytes.
export interface PackedStops {
  id: string[]
  nameTh: string[]
  nameEn: string[]
  latE6: number[]
  lonE6: number[]
}

export interface PackedRoutes {
  id: string[]
  agency: string[]
  newCode: string[]
  oldCode: (string | null)[]
  longNameTh: string[]
  longNameEn: string[]
}

export interface PackedDirections {
  routeIdx: number[]
  directionId: number[]
  headsignTh: string[]
  headsignEn: string[]
  headwaySec: (number | null)[]
  stopIdxs: number[][]
  offsets5s: number[][]
  shapeE6: number[][]
}

export interface PackedBusData {
  generatedAt: string
  feedVersion: string | null
  stops: PackedStops
  routes: PackedRoutes
  directions: PackedDirections
}

export interface MapLine {
  kind: 'road' | 'river' | 'footbridge'
  points: [number, number][]
  name: string | null
  priority: number
}

export interface MapLabel {
  lat: number
  lon: number
  name: string
  priority: number
}

export interface MapPlace {
  lat: number
  lon: number
  name: string
  kind: string
}

export interface MapBackground {
  generatedAt: string
  lines: MapLine[]
  labels: MapLabel[]
  places: MapPlace[]
}
