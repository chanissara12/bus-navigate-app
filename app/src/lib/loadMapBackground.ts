import type { MapBackground } from './types'

// Note: cache แบบเดียวกับ loadBusData — เก็บที่ระดับโมดูลเพื่อ fetch แค่ครั้งเดียว
// และกันการยิงซ้ำเมื่อถูกเรียกพร้อมกันหลายจุดก่อน fetch แรกจะเสร็จ
let cached: Promise<MapBackground> | null = null

export function loadMapBackground(): Promise<MapBackground> {
  if (!cached) {
    cached = fetch('/data/map-background.json').then((res) => {
      if (!res.ok) throw new Error(`Failed to load map background: ${res.status}`)
      return res.json() as Promise<MapBackground>
    })
  }
  return cached
}
