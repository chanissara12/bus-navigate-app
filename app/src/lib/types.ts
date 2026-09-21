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
}

export interface BusData {
  generatedAt: string
  feedVersion: string | null
  stops: Stop[]
  routes: Route[]
  directions: Direction[]
}
