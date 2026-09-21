import { useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { panView, zoomViewAt, type ViewBox } from '../lib/panZoom'
import {
  bboxSizeMeters,
  boundingBoxWithMargin,
  filterLabelsForDisplay,
  filterPlacesForDisplay,
  lineIntersectsBbox,
  projectPoint,
  sliceShapeFromNearestPoint,
} from '../lib/svgMap'
import type { BusData, Direction, MapBackground } from '../lib/types'
import { MapAttribution } from './MapAttribution'

const BBOX_MARGIN_RATIO = 0.12
const MAX_LABELS = 6
const MAX_PLACES = 7
const MIN_ZOOM = 1
const MAX_ZOOM = 8
const FIT_VIEW: ViewBox = { zoom: 1, panX: 0, panY: 0 }

interface Props {
  data: BusData
  background: MapBackground
  direction: Direction
  fromPosition: number
}

export function RouteMap({ data, background, direction, fromPosition }: Props) {
  const { bbox, width, height, scale, routePoints, lines, labels, places, stopPoints } = useMemo(() => {
    const upcomingStopIdxs = direction.stopIdxs.slice(fromPosition)
    const currentStop = data.stops[upcomingStopIdxs[0]]
    const expectedFraction = fromPosition / Math.max(1, direction.stopIdxs.length - 1)
    const slicedShape =
      direction.shapeCoords.length > 0
        ? sliceShapeFromNearestPoint(direction.shapeCoords, currentStop, expectedFraction)
        : []

    const stopLatLons = upcomingStopIdxs.map((idx) => data.stops[idx])
    const shapeLatLons = slicedShape.map(([lat, lon]) => ({ lat, lon }))
    const box = boundingBoxWithMargin([...stopLatLons, ...shapeLatLons], BBOX_MARGIN_RATIO)
    const { widthM, heightM } = bboxSizeMeters(box)

    return {
      bbox: box,
      width: widthM,
      height: heightM,
      scale: Math.max(widthM, heightM),
      routePoints: slicedShape.map(([lat, lon]) => projectPoint({ lat, lon }, box)),
      lines: background.lines.filter((line) => lineIntersectsBbox(line, box)),
      labels: filterLabelsForDisplay(background.labels, box, MAX_LABELS),
      places: filterPlacesForDisplay(background.places, box, MAX_PLACES),
      stopPoints: upcomingStopIdxs.map((idx) => ({
        idx,
        stop: data.stops[idx],
        point: projectPoint(data.stops[idx], box),
      })),
    }
  }, [data, background, direction, fromPosition])

  const [view, setView] = useState<ViewBox>(FIT_VIEW)
  const svgRef = useRef<SVGSVGElement>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const lastPinchDistanceRef = useRef<number | null>(null)

  const toUserUnits = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const viewW = width / view.zoom
    const viewH = height / view.zoom
    return {
      x: view.panX + ((clientX - rect.left) / rect.width) * viewW,
      y: view.panY + ((clientY - rect.top) / rect.height) * viewH,
    }
  }

  const pixelsToUserUnits = (pixels: number): number => {
    const svg = svgRef.current
    if (!svg) return pixels
    const rect = svg.getBoundingClientRect()
    return (pixels / rect.width) * (width / view.zoom)
  }

  function handleWheel(e: ReactWheelEvent<SVGSVGElement>) {
    e.preventDefault()
    const point = toUserUnits(e.clientX, e.clientY)
    const zoomFactor = e.deltaY < 0 ? 1.2 : 1 / 1.2
    setView((v) => zoomViewAt(v, { width, height }, point, zoomFactor, MIN_ZOOM, MAX_ZOOM))
  }

  function handlePointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    lastPinchDistanceRef.current = null
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!pointersRef.current.has(e.pointerId)) return
    const previous = pointersRef.current.get(e.pointerId)!
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

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
  }

  function zoomButton(factor: number) {
    const center = { x: view.panX + width / view.zoom / 2, y: view.panY + height / view.zoom / 2 }
    setView((v) => zoomViewAt(v, { width, height }, center, factor, MIN_ZOOM, MAX_ZOOM))
  }

  const viewW = width / view.zoom
  const viewH = height / view.zoom
  const roadWidth = scale * 0.006
  const riverWidth = scale * 0.008
  const routeWidth = scale * 0.005
  const fontSize = scale * 0.024
  const placeDotR = scale * 0.006
  const stopSmallR = scale * 0.006
  const stopBigR = scale * 0.014

  return (
    <div className="route-map">
      <svg
        ref={svgRef}
        viewBox={`${view.panX} ${view.panY} ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="แผนที่เส้นทาง"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {lines.map((line, i) => (
          <polyline
            key={i}
            className={line.kind === 'river' ? 'map-river' : 'map-road'}
            strokeWidth={line.kind === 'river' ? riverWidth : roadWidth}
            points={line.points
              .map(([lat, lon]) => {
                const p = projectPoint({ lat, lon }, bbox)
                return `${p.x},${p.y}`
              })
              .join(' ')}
          />
        ))}

        {routePoints.length > 1 && (
          <polyline
            className="map-route"
            strokeWidth={routeWidth}
            points={routePoints.map((p) => `${p.x},${p.y}`).join(' ')}
          />
        )}

        {places.map((place, i) => {
          const p = projectPoint(place, bbox)
          return (
            <g key={`place-${i}`} className="map-place">
              <circle cx={p.x} cy={p.y} r={placeDotR} />
              <text x={p.x + placeDotR * 1.5} y={p.y + fontSize * 0.3} fontSize={fontSize}>
                {place.name}
              </text>
            </g>
          )
        })}

        {labels.map((label, i) => {
          const p = projectPoint(label, bbox)
          return (
            <text key={`label-${i}`} className="map-street-label" x={p.x} y={p.y} fontSize={fontSize}>
              {label.name}
            </text>
          )
        })}

        {stopPoints.map(({ idx, stop, point }, i) => {
          const isCurrent = i === 0
          const isLast = i === stopPoints.length - 1
          return (
            <g key={idx} className={`map-stop ${isCurrent ? 'current' : ''} ${isLast ? 'last' : ''}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isCurrent || isLast ? stopBigR : stopSmallR}
                strokeWidth={stopSmallR * 0.5}
              />
              {(isCurrent || isLast) && (
                <text x={point.x} y={point.y - stopBigR * 1.6} fontSize={fontSize * 1.1}>
                  {isCurrent ? 'คุณอยู่ที่นี่' : stop.nameTh || stop.nameEn}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className="map-zoom-controls">
        <button type="button" aria-label="ขยาย" onClick={() => zoomButton(1.4)}>
          +
        </button>
        <button type="button" aria-label="ย่อ" onClick={() => zoomButton(1 / 1.4)}>
          −
        </button>
        {view.zoom > MIN_ZOOM && (
          <button type="button" aria-label="รีเซ็ตการซูม" onClick={() => setView(FIT_VIEW)}>
            ⟲
          </button>
        )}
      </div>

      <MapAttribution />
    </div>
  )
}
