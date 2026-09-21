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

export interface MapLine {
  kind: 'road' | 'river'
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
