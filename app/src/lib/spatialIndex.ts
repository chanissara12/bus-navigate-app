import { haversineMeters, type LatLon } from './geo'
import type { BusData, Direction } from './types'

// ขนาดหนึ่งช่องของกริด (เป็นองศา) ที่ใช้แบ่งป้ายออกเป็นถังๆ เพื่อค้นหาป้ายใกล้เคียง
// ได้เร็วกว่าไล่เช็คทีละป้ายทั้งหมด (0.005 องศา ~ 550 เมตร ที่ละติจูดกรุงเทพฯ)
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
  // จัดกลุ่มป้ายทั้งหมดลงกริดตามพิกัด (grid) เตรียมไว้ล่วงหน้าครั้งเดียว
  // เพื่อให้ stopsNear() ค้นเฉพาะช่องกริดที่อยู่ในรัศมีแทนที่จะวนทุกป้าย
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
    // แปลงรัศมีที่ค้นหา (เมตร) เป็นจำนวนช่องกริดที่ต้องตรวจสอบรอบจุดศูนย์กลาง
    // บวกเผื่อไว้ 1 ช่อง เพราะจุดศูนย์กลางอาจอยู่ชิดขอบช่องของตัวเอง ทำให้ป้ายที่
    // อยู่ในรัศมีจริงไปตกอยู่ในช่องถัดไปได้
    const cellRadius = Math.ceil(radiusM / (CELL_SIZE_DEG * 111000)) + 1
    const centerCellLat = Math.floor(center.lat / CELL_SIZE_DEG)
    const centerCellLon = Math.floor(center.lon / CELL_SIZE_DEG)
    const result: number[] = []

    for (let dLat = -cellRadius; dLat <= cellRadius; dLat += 1) {
      for (let dLon = -cellRadius; dLon <= cellRadius; dLon += 1) {
        const bucket = grid.get(`${centerCellLat + dLat},${centerCellLon + dLon}`)
        if (!bucket) continue
        for (const stopIdx of bucket) {
          // กริดกรองเฉพาะผู้สมัครคร่าวๆ (เป็นสี่เหลี่ยม) ยังต้องเช็คระยะจริงแบบวงกลม
          // ด้วย haversine อีกชั้น เพื่อตัดป้ายที่อยู่ในช่องกริดแต่จริงๆ ห่างเกินรัศมี
          if (haversineMeters(center, data.stops[stopIdx]) <= radiusM) result.push(stopIdx)
        }
      }
    }
    return result
  }

  return { stopsNear, directionsByStopIdx }
}
