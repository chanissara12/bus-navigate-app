import type { Route } from './types'

// Note: ตัดขีด (-), ช่องว่าง และวงเล็บออก แล้วแปลงเป็นตัวพิมพ์ใหญ่ เพื่อให้เลขสาย
// ที่ผู้ใช้พิมพ์มาในรูปแบบต่าง ๆ (เช่น "8", "8 " หรือรูปแบบเลขคู่ "1-12E (107)")
// เทียบตรงกับรหัสสายในข้อมูลได้ ไม่ว่าจะพิมพ์เว้นวรรค/วงเล็บมาหรือไม่ก็ตาม
export function normalizeRouteNumber(raw: string): string {
  return raw.replace(/[-\s()]/g, '').toUpperCase()
}

export function routeMatchesInput(route: Route, input: string): boolean {
  const normalizedInput = normalizeRouteNumber(input)
  if (normalizedInput === '') return false
  if (normalizeRouteNumber(route.newCode) === normalizedInput) return true
  if (route.oldCode && normalizeRouteNumber(route.oldCode) === normalizedInput) return true
  return false
}

export function routeCodeStartsWithInput(route: Route, input: string): boolean {
  const normalizedInput = normalizeRouteNumber(input)
  if (normalizedInput === '') return false
  if (normalizeRouteNumber(route.newCode).startsWith(normalizedInput)) return true
  if (route.oldCode && normalizeRouteNumber(route.oldCode).startsWith(normalizedInput)) return true
  return false
}
