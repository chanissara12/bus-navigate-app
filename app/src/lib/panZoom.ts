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
