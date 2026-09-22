import type { MapBackground, MapPlace } from './types'

export function searchPlaces(background: MapBackground, query: string, maxResults: number): MapPlace[] {
  const normalized = query.trim().toLowerCase()
  if (normalized === '') return []

  const matches = background.places.filter((p) => p.name.toLowerCase().includes(normalized))
  // เรียงชื่อที่ "ขึ้นต้นด้วย" คำค้นไว้ก่อนชื่อที่แค่มีคำค้นแทรกอยู่ตรงไหนก็ได้
  // แล้วในกลุ่มความสำคัญเดียวกัน ให้ชื่อสั้นกว่าขึ้นก่อน เพราะชื่อสั้นมักตรงกับ
  // ความตั้งใจของผู้ใช้มากกว่าชื่อยาวที่บังเอิญมีคำค้นแทรกอยู่
  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(normalized) ? 0 : 1
    const bStarts = b.name.toLowerCase().startsWith(normalized) ? 0 : 1
    if (aStarts !== bStarts) return aStarts - bStarts
    return a.name.length - b.name.length
  })
  return matches.slice(0, maxResults)
}
