import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { panView, zoomViewAt, type ViewBox } from './panZoom'

const MIN_ZOOM = 1
const MAX_ZOOM = 8
const TAP_THRESHOLD_PX = 8
const FIT_VIEW: ViewBox = { zoom: 1, panX: 0, panY: 0 }

interface Options {
  /** Fired when a single pointer is pressed and released without dragging or pinching. */
  onTap?: (userPoint: { x: number; y: number }) => void
}

export function useMapPanZoom(width: number, height: number, options: Options = {}) {
  const [view, setView] = useState<ViewBox>(FIT_VIEW)
  const svgRef = useRef<SVGSVGElement>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const lastPinchDistanceRef = useRef<number | null>(null)
  const gestureRef = useRef<{ startX: number; startY: number; moved: boolean; hadSecondPointer: boolean } | null>(
    null,
  )
  const viewRef = useRef(view)
  viewRef.current = view
  const onTapRef = useRef(options.onTap)
  onTapRef.current = options.onTap

  const toUserUnits = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const viewW = width / viewRef.current.zoom
    const viewH = height / viewRef.current.zoom
    return {
      x: viewRef.current.panX + ((clientX - rect.left) / rect.width) * viewW,
      y: viewRef.current.panY + ((clientY - rect.top) / rect.height) * viewH,
    }
  }

  const pixelsToUserUnits = (pixels: number): number => {
    const svg = svgRef.current
    if (!svg) return pixels
    const rect = svg.getBoundingClientRect()
    return (pixels / rect.width) * (width / viewRef.current.zoom)
  }

  // React attaches onWheel as a passive listener, so preventDefault() inside a JSX
  // handler is silently ignored and the page scrolls underneath while zooming with a
  // mouse wheel or trackpad. A native, non-passive listener is required to block it.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const point = toUserUnits(e.clientX, e.clientY)
      const zoomFactor = e.deltaY < 0 ? 1.2 : 1 / 1.2
      setView((v) => zoomViewAt(v, { width, height }, point, zoomFactor, MIN_ZOOM, MAX_ZOOM))
    }

    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])

  function handlePointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    lastPinchDistanceRef.current = null

    if (pointersRef.current.size === 1) {
      gestureRef.current = { startX: e.clientX, startY: e.clientY, moved: false, hadSecondPointer: false }
    } else if (gestureRef.current) {
      gestureRef.current.hadSecondPointer = true
    }
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!pointersRef.current.has(e.pointerId)) return
    const previous = pointersRef.current.get(e.pointerId)!
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (gestureRef.current && !gestureRef.current.moved) {
      const dx = e.clientX - gestureRef.current.startX
      const dy = e.clientY - gestureRef.current.startY
      if (Math.hypot(dx, dy) > TAP_THRESHOLD_PX) gestureRef.current.moved = true
    }

    const active = [...pointersRef.current.values()]
    if (active.length === 2) {
      const [a, b] = active
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      if (lastPinchDistanceRef.current !== null && lastPinchDistanceRef.current > 0) {
        const zoomFactor = distance / lastPinchDistanceRef.current
        const point = toUserUnits(midpoint.x, midpoint.y)
        setView((v) => zoomViewAt(v, { width, height }, point, zoomFactor, MIN_ZOOM, MAX_ZOOM))
      }
      lastPinchDistanceRef.current = distance
    } else if (active.length === 1) {
      const dx = pixelsToUserUnits(e.clientX - previous.x)
      const dy = pixelsToUserUnits(e.clientY - previous.y)
      setView((v) => panView(v, { width, height }, dx, dy))
    }
  }

  function handlePointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(e.pointerId)
    lastPinchDistanceRef.current = null

    if (pointersRef.current.size === 0 && gestureRef.current) {
      const { moved, hadSecondPointer } = gestureRef.current
      if (!moved && !hadSecondPointer) onTapRef.current?.(toUserUnits(e.clientX, e.clientY))
      gestureRef.current = null
    }
  }

  function zoomButton(factor: number) {
    const center = { x: view.panX + width / view.zoom / 2, y: view.panY + height / view.zoom / 2 }
    setView((v) => zoomViewAt(v, { width, height }, center, factor, MIN_ZOOM, MAX_ZOOM))
  }

  return {
    view,
    setView,
    fitView: FIT_VIEW,
    minZoom: MIN_ZOOM,
    svgRef,
    viewW: width / view.zoom,
    viewH: height / view.zoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomButton,
  }
}
