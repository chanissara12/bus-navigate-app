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

// รูปแบบข้อมูลบนดิสก์: เป็นแบบ columnar (struct-of-arrays คือแยกเก็บเป็นอาเรย์ของ
// แต่ละฟิลด์) แทนที่จะเป็น array-of-objects (อาเรย์ของอ็อบเจ็กต์ทีละรายการ),
// พิกัดเข้ารหัสแบบ delta-encoded เป็นจำนวนเต็มที่คูณด้วย 1e6, ค่า offset เก็บเป็น
// หน่วยละ 5 วินาที ดูเหตุผลได้จากข้อสรุปของ WF-009: คีย์ JSON ที่ซ้ำกันซ้ำๆ
// และความละเอียดของเลขทศนิยม (float) คือส่วนใหญ่ของขนาดไฟล์ที่ส่งออกไป
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
