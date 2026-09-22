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

// Note: ถอดรหัสคอลัมน์ที่เข้ารหัสแบบ delta (เก็บผลต่างจากค่าก่อนหน้า แทนค่าจริง)
// กลับเป็นค่าจริงด้วยการบวกสะสม (running sum) — ใช้กับทั้งพิกัดป้าย (lat/lon)
// และรูปร่างเส้นทาง (shape) เพราะพิกัดที่เรียงติดกันมักใกล้เคียงกัน ทำให้ผลต่าง
// เป็นตัวเลขน้อย ๆ ที่บีบอัดเป็น JSON ได้เล็กกว่าค่าพิกัดเต็มมาก (ดู WF-009)
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

// Note: รูปร่างเส้นทาง (shape) เก็บเป็นอาเรย์แบนราบสลับ lat/lon แบบ delta-encoded
// (ต่างจาก decodeDeltaColumn ที่ทำทีละคอลัมน์ ฟังก์ชันนี้ถอดรหัสทั้งคู่ lat/lon
// ไปพร้อมกันในลูปเดียว) แล้วหารด้วย COORD_SCALE กลับเป็นองศาจริง
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
    // Note: offsets5s เก็บเป็นหน่วยละ 5 วินาที (ไม่ใช่วินาทีตรง ๆ) เพื่อให้ตัวเลข
    // มีค่าเล็กลงและบีบอัดเป็น JSON ได้ดีขึ้น คูณกลับด้วย OFFSET_UNIT_SEC ตรงนี้
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
