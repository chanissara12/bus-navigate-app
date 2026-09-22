const EARTH_RADIUS_M = 6371000

export interface LatLon {
  lat: number
  lon: number
}

// Note: สูตร haversine คำนวณระยะทางตรงบนผิวโลก (great-circle distance) จาก
// พิกัดละติจูด/ลองจิจูด สมมติโลกเป็นทรงกลม ซึ่งแม่นยำพอสำหรับระยะทางระดับ
// เมือง/ตำบลอย่างการหาป้ายรถเมล์ใกล้เคียง
export function haversineMeters(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

// Note: ความเร็วเดินเท้าโดยประมาณ 1.2 m/s (~4.3 กม./ชม.) ซึ่งช้ากว่าความเร็ว
// เดินปกติของคนทั่วไปเล็กน้อย เผื่อไว้สำหรับการเดินจริงที่ต้องรอไฟแดง
// ข้ามถนน หรือเดินอ้อมสิ่งกีดขวาง
export function walkSeconds(meters: number): number {
  const WALK_SPEED_M_PER_S = 1.2
  return meters / WALK_SPEED_M_PER_S
}
