import { decodePackedBusData } from './packedCodec'
import type { BusData, PackedBusData } from './types'

// Note: cache ไว้ที่ระดับโมดูล ไม่ใช่ใน state ของ React — ข้อมูลรถเมล์ถูก fetch
// แค่ครั้งเดียวต่อการโหลดแอปและเก็บไว้ในหน่วยความจำตลอดอายุของแอป (ดูคอมเมนต์
// เรื่อง architecture ใน CLAUDE.md) การ cache แบบ Promise ยังกันไม่ให้ยิง fetch
// ซ้ำถ้ามีการเรียก loadBusData() พร้อมกันหลายจุดก่อนที่ fetch แรกจะเสร็จ
let cached: Promise<BusData> | null = null

export function loadBusData(): Promise<BusData> {
  if (!cached) {
    cached = fetch('/data/bus-data.json').then((res) => {
      if (!res.ok) throw new Error(`Failed to load bus data: ${res.status}`)
      return res.json() as Promise<PackedBusData>
    }).then(decodePackedBusData)
  }
  return cached
}
