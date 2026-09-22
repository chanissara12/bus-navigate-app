export interface ViewBox {
  zoom: number
  panX: number
  panY: number
}

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// Note: ซูมเข้า/ออกโดยยึดจุดใต้เคอร์เซอร์/นิ้วไว้กับที่ (zoom-to-point) แทนที่จะ
// ซูมจากมุมซ้ายบนหรือกึ่งกลางเฉย ๆ — หาสัดส่วนตำแหน่ง (fx, fy) ของ screenPoint
// เทียบกับพื้นที่ที่มองเห็นอยู่ก่อนซูม (0 ถึง 1) แล้วคำนวณ pan ใหม่หลังซูมให้
// สัดส่วนนั้นยังคงตรงกับ screenPoint เดิม จึงรู้สึกเหมือนซูมเข้าหาจุดที่ชี้จริง ๆ
export function zoomViewAt(
  view: ViewBox,
  base: Size,
  screenPoint: Point,
  zoomFactor: number,
  minZoom: number,
  maxZoom: number,
): ViewBox {
  const oldViewW = base.width / view.zoom
  const oldViewH = base.height / view.zoom
  const fx = oldViewW === 0 ? 0.5 : (screenPoint.x - view.panX) / oldViewW
  const fy = oldViewH === 0 ? 0.5 : (screenPoint.y - view.panY) / oldViewH

  const nextZoom = clamp(view.zoom * zoomFactor, minZoom, maxZoom)
  const viewW = base.width / nextZoom
  const viewH = base.height / nextZoom

  // Note: จำกัด pan ไม่ให้เลยขอบพื้นที่ฐาน (base) กันไม่ให้ผู้ใช้ pan/zoom แล้ว
  // เห็นพื้นที่ว่างนอกแผนที่
  const panX = clamp(screenPoint.x - fx * viewW, 0, Math.max(0, base.width - viewW))
  const panY = clamp(screenPoint.y - fy * viewH, 0, Math.max(0, base.height - viewH))

  return { zoom: nextZoom, panX, panY }
}

export function panView(view: ViewBox, base: Size, deltaX: number, deltaY: number): ViewBox {
  const viewW = base.width / view.zoom
  const viewH = base.height / view.zoom
  return {
    zoom: view.zoom,
    panX: clamp(view.panX - deltaX, 0, Math.max(0, base.width - viewW)),
    panY: clamp(view.panY - deltaY, 0, Math.max(0, base.height - viewH)),
  }
}
