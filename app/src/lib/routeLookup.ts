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
    // ป้ายสุดท้ายของทิศคือปลายทาง ไม่ใช่จุดขึ้นรถ — ขึ้นตรงนี้แล้วรถก็จบเที่ยวพอดี
    // จึงตัดออกจากรายการทิศที่ขึ้นได้
    const isLastStop = positionInSequence === direction.stopIdxs.length - 1
    if (isLastStop) continue
    result.push({ route: data.routes[direction.routeIdx], direction, positionInSequence })
  }
  return result
}

export function stopSequenceFrom(direction: Direction, fromPosition: number): number[] {
  return direction.stopIdxs.slice(fromPosition)
}

// WF-006: 15.6% ของสายทั้งหมดมีข้อมูลในฟีดแค่ทิศเดียว และสายที่ขึ้นต้นด้วย `M`
// บางส่วนมีเที่ยววิ่งที่สั้นผิดปกติ (<5 ป้าย) — กรณีเหล่านี้อาจเป็นสายวนรอบจริง
// หรือข้อมูลขาดหายก็ได้ แนวทางแก้ของทิคเก็ตนี้คือแสดงสายเหล่านี้ต่อไปพร้อมคำเตือน
// ชัดเจน แทนที่จะซ่อนไว้ (ผู้ใช้จะรอสายที่ไม่รู้ด้วยซ้ำว่ามีอยู่) หรือแสดงเฉยๆ
// โดยไม่เตือน (ผู้ใช้จะเข้าใจผิดว่าไม่มีทางกลับ)
const SHORT_TRIP_STOP_COUNT = 5

export function hasNoReturnData(data: BusData, direction: Direction): boolean {
  if (direction.stopIdxs.length < SHORT_TRIP_STOP_COUNT) return true
  const directionsForRoute = data.directions.filter((d) => d.routeIdx === direction.routeIdx)
  return directionsForRoute.length < 2
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
