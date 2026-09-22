import type { LatLon } from './geo'

const METERS_PER_DEGREE_LAT = 110540

function toLocalMeters(point: LatLon, origin: LatLon): { x: number; y: number } {
  const metersPerDegreeLon = 111320 * Math.cos((origin.lat * Math.PI) / 180)
  return {
    x: (point.lon - origin.lon) * metersPerDegreeLon,
    y: (point.lat - origin.lat) * METERS_PER_DEGREE_LAT,
  }
}

// ระยะตั้งฉากจากจุดหนึ่งไปยังเส้นตรง lineStart-lineEnd โดยแปลงพิกัด lat/lon
// เป็นเมตรในพิกัดท้องถิ่นก่อน (toLocalMeters) แล้วใช้ cross product หารด้วยความยาว
// เส้นฐาน ซึ่งเป็นสูตรมาตรฐานสำหรับระยะจากจุดถึงเส้นตรงในระนาบ 2 มิติ
function perpendicularDistanceMeters(point: LatLon, lineStart: LatLon, lineEnd: LatLon): number {
  const p = toLocalMeters(point, lineStart)
  const b = toLocalMeters(lineEnd, lineStart)
  const lineLengthSq = b.x * b.x + b.y * b.y
  if (lineLengthSq === 0) return Math.hypot(p.x, p.y)
  const cross = p.x * b.y - p.y * b.x
  return Math.abs(cross) / Math.sqrt(lineLengthSq)
}

// อัลกอริทึม Douglas-Peucker: ลดจำนวนจุดของเส้นทาง (เช่น shapeCoords ของแต่ละทิศ)
// โดยยังคงรูปทรงของเส้นไว้ใกล้เคียงเดิม ใช้เพื่อให้ JSON ที่ส่งออกไม่ใหญ่เกินไป
// หลักการ: หาจุดที่ห่างจากเส้นตรงระหว่างจุดต้น-จุดปลายมากที่สุด ถ้าห่างเกิน
// ค่าเผื่อ (toleranceMeters) ให้เก็บจุดนั้นไว้เป็นจุดหักมุม แล้วแบ่งปัญหาออกเป็นสองช่วง
// ทำซ้ำแบบ recursive ทั้งสองฝั่ง — ถ้าไม่มีจุดไหนห่างเกินค่าเผื่อเลย ก็ตัดจุดกลางทั้งหมดทิ้ง
// เหลือแค่จุดต้นกับจุดปลาย
export function douglasPeucker(points: LatLon[], toleranceMeters: number): LatLon[] {
  if (points.length < 3) return points

  let maxDistance = 0
  let maxIndex = 0
  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistanceMeters(points[i], first, last)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }

  if (maxDistance <= toleranceMeters) return [first, last]

  // แบ่งที่จุดห่างที่สุดแล้วเรียกซ้ำทั้งสองฝั่ง จากนั้นตัดจุดปลายของฝั่งซ้าย
  // ทิ้งหนึ่งจุด (slice(0, -1)) เพราะเป็นจุดเดียวกับจุดเริ่มของฝั่งขวา ป้องกันจุดซ้ำ
  const left = douglasPeucker(points.slice(0, maxIndex + 1), toleranceMeters)
  const right = douglasPeucker(points.slice(maxIndex), toleranceMeters)
  return [...left.slice(0, -1), ...right]
}
