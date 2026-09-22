import { useSyncExternalStore } from 'react'
import type { LatLon } from './geo'

export interface FavoriteDestination extends LatLon {
  name: string
}

const STORAGE_KEY = 'busNavigateApp.favoriteDestinations'

export const DEFAULT_FAVORITE_DESTINATIONS: FavoriteDestination[] = [
  { name: 'สยาม', lat: 13.746, lon: 100.534 },
  { name: 'อนุสาวรีย์ชัยสมรภูมิ', lat: 13.7648, lon: 100.5378 },
  { name: 'หมอชิต', lat: 13.8022, lon: 100.5535 },
  { name: 'เซ็นทรัลเวิลด์', lat: 13.7466, lon: 100.5393 },
]

function isFavoriteDestinationArray(value: unknown): value is FavoriteDestination[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as FavoriteDestination).name === 'string' &&
        typeof (v as FavoriteDestination).lat === 'number' &&
        typeof (v as FavoriteDestination).lon === 'number',
    )
  )
}

// อ่านครั้งเดียวตอนโหลดโมดูล ไม่ใช่ทุกครั้งที่มีคนเรียก useFavoriteDestinations —
// รายการที่แก้ไขแล้วถืออยู่ในตัวแปร favorites เอง (ดูด้านล่าง) localStorage มีไว้
// แค่จำข้ามเซสชันเท่านั้น
function readFromStorage(): FavoriteDestination[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_FAVORITE_DESTINATIONS
    const parsed: unknown = JSON.parse(raw)
    return isFavoriteDestinationArray(parsed) ? parsed : DEFAULT_FAVORITE_DESTINATIONS
  } catch {
    // localStorage ใช้ไม่ได้ (private mode บางเบราว์เซอร์) หรือข้อมูลที่เก็บไว้เสีย —
    // ใช้ค่าเริ่มต้นแทน แอปยังทำงานได้ปกติ แค่จะไม่จำรายการที่เคยแก้ไว้
    return DEFAULT_FAVORITE_DESTINATIONS
  }
}

// เก็บ state ไว้เป็นตัวแปรระดับโมดูล (ไม่ใช่ useState ในตัว hook เอง) พร้อมกลไก
// subscribe/notify แบบง่ายๆ เพื่อให้ทุกที่ที่เรียก useFavoriteDestinations() เห็นการ
// เปลี่ยนแปลงพร้อมกันทันที ไม่ว่าจะแก้จากหน้าจัดการที่เปิดจากหน้าไหนก็ตาม
let favorites = readFromStorage()
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch {
    // เก็บไม่ได้ก็ปล่อยผ่าน — รายการปัจจุบันในหน่วยความจำยังใช้งานได้ตามปกติ
  }
}

// คืนค่า false เมื่อชื่อซ้ำกับปลายทางโปรดที่มีอยู่แล้ว (ไม่เพิ่มซ้ำ) — ผู้เรียกใช้ค่านี้
// บอกผู้ใช้ว่าเพิ่มสำเร็จหรือมีอยู่แล้ว แทนที่จะเงียบแล้วดูเหมือนกดไม่ติด
export function addFavoriteDestination(destination: FavoriteDestination): boolean {
  if (favorites.some((d) => d.name === destination.name)) return false
  // เก็บเฉพาะ {name, lat, lon} — ที่มาของ destination อาจเป็นผลค้นหา (MapPlace ที่มี
  // field อื่นติดมาด้วย เช่น kind) หรือจุดที่แตะบนแผนที่ ไม่ควรพ่วง field ที่ไม่เกี่ยวเข้ามาเก็บ
  favorites = [...favorites, { name: destination.name, lat: destination.lat, lon: destination.lon }]
  persist()
  notify()
  return true
}

export function removeFavoriteDestination(name: string): void {
  favorites = favorites.filter((d) => d.name !== name)
  persist()
  notify()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): FavoriteDestination[] {
  return favorites
}

export function useFavoriteDestinations(): FavoriteDestination[] {
  return useSyncExternalStore(subscribe, getSnapshot)
}
