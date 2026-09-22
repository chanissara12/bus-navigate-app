import { haversineMeters, type LatLon } from './geo'
import type { MapLabel, MapLine, MapPlace } from './types'

export interface BBox {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}

const PLACE_KIND_PRIORITY: Record<string, number> = {
  transit: 0,
  mall: 1,
  market: 2,
  hospital: 3,
  university: 4,
  worship: 5,
  school: 5,
  park: 5,
  government: 5,
  // ป้ายรถเมล์ที่มีชื่อคือโครงสร้างพื้นฐานขนส่ง ไม่ใช่สถานที่จริงๆ — มันอยู่ในลิสต์นี้
  // เพราะบางครั้งเป็นจุดสังเกต (landmark) เดียวที่ OSM มีข้อมูลอยู่เท่านั้น
  // (ดู build-map-background.mjs) จึงให้ความสำคัญต่ำกว่าทุกหมวดที่เป็นสถานที่จริง
  landmark: 6,
}

export function boundingBoxWithMargin(points: LatLon[], marginRatio: number): BBox {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lon < minLon) minLon = p.lon
    if (p.lon > maxLon) maxLon = p.lon
  }

  const latSpan = maxLat - minLat || 0.002
  const lonSpan = maxLon - minLon || 0.002
  const latMargin = latSpan * marginRatio
  const lonMargin = lonSpan * marginRatio

  return {
    minLat: minLat - latMargin,
    maxLat: maxLat + latMargin,
    minLon: minLon - lonMargin,
    maxLon: maxLon + lonMargin,
  }
}

export function bboxAroundCenter(center: LatLon, radiusM: number): BBox {
  const metersPerDegreeLon = 111320 * Math.cos((center.lat * Math.PI) / 180)
  const metersPerDegreeLat = 110540
  const latDelta = radiusM / metersPerDegreeLat
  const lonDelta = radiusM / metersPerDegreeLon
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLon: center.lon - lonDelta,
    maxLon: center.lon + lonDelta,
  }
}

export function bboxSizeMeters(bbox: BBox): { widthM: number; heightM: number } {
  const centerLat = (bbox.minLat + bbox.maxLat) / 2
  const metersPerDegreeLon = 111320 * Math.cos((centerLat * Math.PI) / 180)
  const metersPerDegreeLat = 110540
  return {
    widthM: (bbox.maxLon - bbox.minLon) * metersPerDegreeLon,
    heightM: (bbox.maxLat - bbox.minLat) * metersPerDegreeLat,
  }
}

export function projectPoint(point: LatLon, bbox: BBox): { x: number; y: number } {
  const centerLat = (bbox.minLat + bbox.maxLat) / 2
  const metersPerDegreeLon = 111320 * Math.cos((centerLat * Math.PI) / 180)
  const metersPerDegreeLat = 110540
  return {
    x: (point.lon - bbox.minLon) * metersPerDegreeLon,
    y: (bbox.maxLat - point.lat) * metersPerDegreeLat,
  }
}

export function unprojectPoint(point: { x: number; y: number }, bbox: BBox): LatLon {
  const centerLat = (bbox.minLat + bbox.maxLat) / 2
  const metersPerDegreeLon = 111320 * Math.cos((centerLat * Math.PI) / 180)
  const metersPerDegreeLat = 110540
  return {
    lon: bbox.minLon + point.x / metersPerDegreeLon,
    lat: bbox.maxLat - point.y / metersPerDegreeLat,
  }
}

/**
 * แปลงหน้าต่างมุมมองปัจจุบัน (pan/zoom) ซึ่งอยู่ในพิกัดเมตรแบบเดียวกับที่ `projectPoint`
 * ให้ค่ามา (สัมพัทธ์กับ `base`) กลับเป็น bbox แบบ lat/lon เพื่อให้การกรองเนื้อหา
 * (ว่าจะแสดงป้ายชื่อ/สถานที่/เส้นไหนบ้าง) ตามทันสิ่งที่มองเห็นจริงขณะผู้ใช้ซูมและเลื่อนแผนที่
 * แทนที่จะค้างอยู่กับกรอบที่แผนที่ fit ไว้ตอนเริ่มต้น
 */
export function bboxFromView(
  base: BBox,
  view: { zoom: number; panX: number; panY: number },
  baseSize: { width: number; height: number },
): BBox {
  const viewW = baseSize.width / view.zoom
  const viewH = baseSize.height / view.zoom
  const topLeft = unprojectPoint({ x: view.panX, y: view.panY }, base)
  const bottomRight = unprojectPoint({ x: view.panX + viewW, y: view.panY + viewH }, base)
  return {
    minLat: bottomRight.lat,
    maxLat: topLeft.lat,
    minLon: topLeft.lon,
    maxLon: bottomRight.lon,
  }
}

function pointInBbox(lat: number, lon: number, bbox: BBox): boolean {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lon >= bbox.minLon && lon <= bbox.maxLon
}

export interface WalkPath {
  points: LatLon[]
  meters: number
  viaFootbridge: boolean
}

const FOOTBRIDGE_SEARCH_RADIUS_M = 500
const FOOTBRIDGE_DETOUR_FACTOR = 1.6
const ROAD_SNAP_MAX_DISTANCE_M = 40

// ช่วงเดิน (leg) ที่ snap เข้ากับถนนไม่ได้เลย คือเส้นตรงที่ตัดผ่านสิ่งที่มีอยู่จริง
// (ตึก, ที่ดิน) — ถ้าเป็นช่วงสั้นๆ แค่เดินจากถนนที่มีในแผนที่เข้าประตูบ้านก็ไม่เป็นไร
// แต่ถ้ายาวเกินระยะนี้ มันกำลังทำหน้าที่แทนเส้นทางเดินจริงที่เราไม่รู้ว่าเป็นอย่างไร
// และเส้นตรงจะประเมินระยะทางต่ำกว่าความเป็นจริง
// เคสที่ยืนยันแล้ว: ทางลัดไปสะพานลอยจาก "ตรงข้ามโรงแรมมณเฑียร
// ริเวอร์ไซด์" คำนวณได้ 203 เมตรผ่านช่วงเส้นตรงที่ไม่ได้ snap ยาว 154 เมตร
// ทั้งที่ระยะทางจริงตามเส้นทางของ Google Maps ยาวกว่านั้น — บัฟเฟอร์นี้ป้องกันไม่ให้
// ช่วงที่ไม่มีในแผนที่ถูกรายงานราวกับเป็นเส้นทางเดินได้จริง
const UNSNAPPED_WALK_BUFFER = 1.4
const UNSNAPPED_BUFFER_MIN_M = 60

interface RoadSnapResult {
  points: LatLon[]
  snapped: boolean
}

// เส้นตรงระหว่างสองจุดที่ห่างกันหนึ่งช่วงตึกจะตัดผ่านตัวตึกไปเลย — มันดูเหมือน
// เวกเตอร์บอกทิศทางการกระจัด ไม่ใช่เส้นทางเดินจริง ถ้ามีถนนที่วิ่งใกล้ทั้งสองปลายของ
// ช่วงนี้ ให้เดินตามจุดหักมุมของถนนเส้นนั้นแทน โดยมีแค่ช่วงสั้นๆ ที่ตั้งฉากกับถนน
// เชื่อมจุดจริงเข้ากับถนนที่ปลายทั้งสองข้าง หากไม่มีถนนที่อยู่ใกล้พอทั้งสองปลาย
// (เช่น กรณีข้ามสะพานลอยเอง) จะตกกลับไปใช้เส้นตรงแทน
function snapToNearestRoad(from: LatLon, to: LatLon, lines: MapLine[]): RoadSnapResult {
  let best: { path: LatLon[]; score: number } | null = null

  for (const line of lines) {
    if (line.kind !== 'road' || line.points.length < 2) continue
    const fromProj = nearestSegmentProjection(line.points, from)
    const toProj = nearestSegmentProjection(line.points, to)
    if (!fromProj || !toProj) continue
    if (fromProj.distanceM > ROAD_SNAP_MAX_DISTANCE_M || toProj.distanceM > ROAD_SNAP_MAX_DISTANCE_M) continue

    const score = fromProj.distanceM + toProj.distanceM
    if (best && score >= best.score) continue

    const forward = fromProj.segmentIndex <= toProj.segmentIndex
    const [loProj, hiProj] = forward ? [fromProj, toProj] : [toProj, fromProj]
    const middle = line.points
      .slice(loProj.segmentIndex + 1, hiProj.segmentIndex + 1)
      .map(([lat, lon]): LatLon => ({ lat, lon }))
    const onRoad = [
      { lat: loProj.point[0], lon: loProj.point[1] },
      ...middle,
      { lat: hiProj.point[0], lon: hiProj.point[1] },
    ]
    best = { path: forward ? onRoad : onRoad.reverse(), score }
  }

  return best ? { points: [from, ...best.path, to], snapped: true } : { points: [from, to], snapped: false }
}

function snapWalkToRoads(points: LatLon[], lines: MapLine[]): { points: LatLon[]; meters: number } {
  const snapped: LatLon[] = [points[0]]
  let meters = 0
  for (let i = 0; i < points.length - 1; i += 1) {
    const segment = snapToNearestRoad(points[i], points[i + 1], lines)
    snapped.push(...segment.points.slice(1))

    let segmentMeters = 0
    for (let j = 1; j < segment.points.length; j += 1) segmentMeters += haversineMeters(segment.points[j - 1], segment.points[j])
    if (!segment.snapped && segmentMeters > UNSNAPPED_BUFFER_MIN_M) segmentMeters *= UNSNAPPED_WALK_BUFFER
    meters += segmentMeters
  }
  return { points: snapped, meters }
}

// เป็นฮิวริสติกเชิงปฏิบัติ ไม่ใช่การหาเส้นทางเดินเท้าจริง: ถ้าปลายทั้งสองข้างของ
// สะพานลอยที่อยู่ใกล้เคียงพาไปถึงจุดหมายได้โดยเดินไม่ไกลไปกว่าเส้นตรงมากนัก
// ให้ถือว่านั่นคือทางที่ใช้ข้ามถนนที่คั่นระหว่างป้ายลงกับจุดหมาย ฟังก์ชันนี้ไม่เคย
// เดาว่าผู้ใช้ยืนอยู่ฝั่งไหนของถนน (WF-003) — จุดทั้งสองข้างในที่นี้เป็นพิกัดคงที่ที่รู้
// ล่วงหน้า (ป้ายลงรถกับจุดหมาย) ไม่ใช่ตำแหน่งผู้โดยสารแบบเรียลไทม์
export function findWalkingPath(from: LatLon, to: LatLon, lines: MapLine[]): WalkPath {
  const directMeters = haversineMeters(from, to)
  let best: { points: LatLon[]; totalMeters: number } | null = null

  for (const line of lines) {
    if (line.kind !== 'footbridge' || line.points.length < 2) continue
    const start: LatLon = { lat: line.points[0][0], lon: line.points[0][1] }
    const end: LatLon = { lat: line.points[line.points.length - 1][0], lon: line.points[line.points.length - 1][1] }

    for (const [near, far] of [
      [start, end],
      [end, start],
    ] as const) {
      if (haversineMeters(from, near) > FOOTBRIDGE_SEARCH_RADIUS_M) continue
      const totalMeters = haversineMeters(from, near) + haversineMeters(near, far) + haversineMeters(far, to)
      if (totalMeters > directMeters * FOOTBRIDGE_DETOUR_FACTOR) continue
      if (!best || totalMeters < best.totalMeters) best = { points: [from, near, far, to], totalMeters }
    }
  }

  const rawPoints = best ? best.points : [from, to]
  const snapped = snapWalkToRoads(rawPoints, lines)
  return { points: snapped.points, meters: snapped.meters, viaFootbridge: !!best }
}

// motorway/trunk/primary — ตรงกับ ROAD_PRIORITY ใน build-map-background.mjs
// ถนนระดับ secondary/tertiary ไม่นับรวม: ความยากลำบากจริงๆ ในการข้าม (ไม่มีสัญญาณไฟ
// ต้องหลบรถหลายเลนที่วิ่งเร็ว) ส่วนใหญ่มาจากถนนสายใหญ่เท่านั้น
const MAJOR_ROAD_MAX_PRIORITY = 2

function crossProduct(o: LatLon, a: LatLon, b: LatLon): number {
  return (a.lon - o.lon) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lon - o.lon)
}

// จงใจเปรียบเทียบด้วยผลคูณ (ไม่ใช่ sign-XOR): จุดที่ตกอยู่บนอีกเส้นพอดีจะให้ค่า
// cross product เป็น 0 และ 0 คูณกับอะไรก็ไม่มีทาง < 0 — ดังนั้นการแค่แตะที่ปลายจุด
// (เช่น จุดหมายที่อยู่พอดีบนจุดหักมุมของถนน ซึ่งเกิดขึ้นได้จริงกับพิกัดที่มาจาก OSM)
// จะถูกตีความว่า "ไม่ได้ตัดผ่าน" มีแต่กรณีที่คร่อมเส้นกันจริงๆ เท่านั้นที่จะนับว่าตัดผ่าน
function segmentsIntersect(p1: LatLon, p2: LatLon, p3: LatLon, p4: LatLon): boolean {
  const d1 = crossProduct(p3, p4, p1)
  const d2 = crossProduct(p3, p4, p2)
  const d3 = crossProduct(p1, p2, p3)
  const d4 = crossProduct(p1, p2, p4)
  return d1 * d2 < 0 && d3 * d4 < 0
}

// ตรวจว่าเดินเป็นเส้นตรงจากจุดหนึ่งไปอีกจุดหนึ่งจะตัดผ่านถนนสายใหญ่หรือไม่ —
// เป็นข้อเท็จจริงที่รู้ล่วงหน้าได้แน่นอนของจุดคงที่สองจุด (ป้ายลงรถหรือจุดต้นทาง
// กับจุดหมายหรือป้ายขึ้นรถ) ไม่ใช่การเดาว่าผู้โดยสารแบบเรียลไทม์ยืนอยู่ตรงไหน
// เทียบกับถนน (WF-003 ไม่เกี่ยวข้องกับส่วนนี้ เป็นคนละคำถามกัน)
export function crossesMajorRoad(from: LatLon, to: LatLon, lines: MapLine[]): boolean {
  for (const line of lines) {
    if (line.kind !== 'road' || line.priority > MAJOR_ROAD_MAX_PRIORITY) continue
    for (let i = 0; i < line.points.length - 1; i += 1) {
      const a: LatLon = { lat: line.points[i][0], lon: line.points[i][1] }
      const b: LatLon = { lat: line.points[i + 1][0], lon: line.points[i + 1][1] }
      if (segmentsIntersect(from, to, a, b)) return true
    }
  }
  return false
}

export function lineClassName(line: MapLine): string {
  if (line.kind === 'river') return 'map-river'
  if (line.kind === 'footbridge') return 'map-footbridge'
  const isMinorRoad = line.kind === 'road' && line.priority >= 3
  return isMinorRoad ? 'map-road map-road-minor' : 'map-road'
}

export function lineIntersectsBbox(line: MapLine, bbox: BBox): boolean {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  for (const [lat, lon] of line.points) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
  }
  return maxLat >= bbox.minLat && minLat <= bbox.maxLat && maxLon >= bbox.minLon && minLon <= bbox.maxLon
}

export function filterLabelsForDisplay(labels: MapLabel[], bbox: BBox, maxCount: number): MapLabel[] {
  const inBbox = labels.filter((l) => pointInBbox(l.lat, l.lon, bbox))
  const sorted = [...inBbox].sort((a, b) => a.priority - b.priority)

  const seenNames = new Set<string>()
  const result: MapLabel[] = []
  for (const label of sorted) {
    if (seenNames.has(label.name)) continue
    seenNames.add(label.name)
    result.push(label)
    if (result.length >= maxCount) break
  }
  return result
}

const SEARCH_WINDOW_FRACTION = 0.25
const METERS_PER_DEGREE_LAT = 110540

function toLocalMeters(point: LatLon, origin: LatLon): { x: number; y: number } {
  const metersPerDegreeLon = 111320 * Math.cos((origin.lat * Math.PI) / 180)
  return { x: (point.lon - origin.lon) * metersPerDegreeLon, y: (point.lat - origin.lat) * METERS_PER_DEGREE_LAT }
}

interface SegmentProjection {
  segmentIndex: number
  point: [number, number]
  distanceM: number
}

/**
 * หลังจากลดจุดของเส้นทางด้วย Douglas-Peucker แล้ว จุดที่ป้ายเข้าใกล้เส้นทางที่สุดจริงๆ
 * มักอยู่ *บนช่วงเส้น (segment)* ระหว่างจุดหักมุมสองจุดที่เหลืออยู่ ไม่ใช่ที่จุดหักมุมจุดใดจุดหนึ่ง —
 * การลดจุดรับประกันแค่ว่าจุดที่ถูกตัดออกยังอยู่ในระยะเผื่อของเส้นที่ลดแล้ว แต่ไม่ได้รับประกันว่า
 * ป้ายจะอยู่ใกล้จุดหักมุมที่เหลือรอด การโปรเจกต์ลงบนช่วงเส้น (ไม่ใช่แค่เทียบกับจุดหักมุม)
 * คือสิ่งที่ทำให้เส้นที่วาดออกมาไม่หลุดออกจากหมุดป้ายให้เห็นชัดๆ
 *
 * สายที่วนรอบ (วนซ้าย/วนขวา) ก็อาจผ่านใกล้ป้ายเดียวกันสองครั้งในระยะไม่กี่เมตรได้เช่นกัน
 * ถ้าค้นหาแบบไม่จำกัดขอบเขตก็อาจ snap ผิดจุดได้ `expectedFraction` (บอกว่าตอนนี้อยู่ไกล
 * แค่ไหนแล้วในลำดับป้าย ค่า 0..1) จะจำกัดขอบเขตการค้นหาให้อยู่ในช่วงที่คาดว่ารูปเส้นทาง
 * ควรจะอยู่ ณ จุดนั้น และจะย้อนกลับไปค้นทั้งเส้นทางถ้าช่วงที่จำกัดไว้นั้นว่างเปล่า
 */
function nearestSegmentProjection(
  shape: [number, number][],
  point: LatLon,
  expectedFraction?: number,
): SegmentProjection | null {
  const segmentCount = shape.length - 1
  if (segmentCount < 1) return null

  let searchStart = 0
  let searchEnd = segmentCount

  if (expectedFraction !== undefined) {
    const center = expectedFraction * (segmentCount - 1)
    const window = segmentCount * SEARCH_WINDOW_FRACTION
    searchStart = Math.max(0, Math.floor(center - window))
    searchEnd = Math.min(segmentCount, Math.ceil(center + window))
  }

  let best: SegmentProjection | null = null
  for (let i = searchStart; i < searchEnd; i += 1) {
    const a: LatLon = { lat: shape[i][0], lon: shape[i][1] }
    const b: LatLon = { lat: shape[i + 1][0], lon: shape[i + 1][1] }
    const pLocal = toLocalMeters(point, a)
    const bLocal = toLocalMeters(b, a)
    const lengthSq = bLocal.x * bLocal.x + bLocal.y * bLocal.y
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (pLocal.x * bLocal.x + pLocal.y * bLocal.y) / lengthSq))
    const projected: [number, number] = [a.lat + t * (b.lat - a.lat), a.lon + t * (b.lon - a.lon)]
    const distanceM = haversineMeters(point, { lat: projected[0], lon: projected[1] })
    if (!best || distanceM < best.distanceM) best = { segmentIndex: i, point: projected, distanceM }
  }
  return best
}

export function sliceShapeFromNearestPoint(
  shape: [number, number][],
  point: LatLon,
  expectedFraction?: number,
): [number, number][] {
  const nearest = nearestSegmentProjection(shape, point, expectedFraction)
  return nearest === null ? shape : [nearest.point, ...shape.slice(nearest.segmentIndex + 1)]
}

export function sliceShapeToNearestPoint(
  shape: [number, number][],
  point: LatLon,
  expectedFraction?: number,
): [number, number][] {
  const nearest = nearestSegmentProjection(shape, point, expectedFraction)
  return nearest === null ? shape : [...shape.slice(0, nearest.segmentIndex + 1), nearest.point]
}

export function filterPlacesForDisplay(places: MapPlace[], bbox: BBox, maxCount: number): MapPlace[] {
  const inBbox = places.filter((p) => pointInBbox(p.lat, p.lon, bbox))
  const sorted = [...inBbox].sort(
    (a, b) => (PLACE_KIND_PRIORITY[a.kind] ?? 5) - (PLACE_KIND_PRIORITY[b.kind] ?? 5),
  )
  return sorted.slice(0, maxCount)
}
