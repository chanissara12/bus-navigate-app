import { useMemo, useRef, useState } from 'react'
import { haversineMeters, type LatLon } from '../lib/geo'
import {
  bboxAroundCenter,
  bboxFromView,
  bboxSizeMeters,
  filterLabelsForDisplay,
  filterPlacesForDisplay,
  lineClassName,
  lineIntersectsBbox,
  projectPoint,
  unprojectPoint,
} from '../lib/svgMap'
import { useMapPanZoom } from '../lib/useMapPanZoom'
import type { MapBackground, MapPlace } from '../lib/types'
import { MapAttribution } from './MapAttribution'

const INITIAL_RADIUS_M = 3000
const MAX_LABELS = 6
const MAX_PLACES = 7
const PLACE_HIT_RADIUS_M = 150
const FONT_SIZE_RATIO = 0.02
const DOT_RADIUS_RATIO = 0.005

export interface PickedDestination {
  name: string
  lat: number
  lon: number
}

interface Props {
  background: MapBackground
  center: LatLon
  onConfirm: (destination: PickedDestination) => void
  onClose: () => void
}

export function DestinationPicker({ background, center, onConfirm, onClose }: Props) {
  // useGeolocation emits a fresh {lat, lon} object on every watchPosition update, so
  // capture the center once at open time — otherwise the view re-centers under the
  // user's fingers on every GPS tick while they're trying to pan or tap a destination.
  const [frozenCenter] = useState(center)
  const base = useMemo(() => bboxAroundCenter(frozenCenter, INITIAL_RADIUS_M), [frozenCenter])
  const baseSize = useMemo(() => bboxSizeMeters(base), [base])
  const visiblePlacesRef = useRef<MapPlace[]>([])
  const [selected, setSelected] = useState<PickedDestination | null>(null)

  const {
    view,
    setView,
    fitView,
    minZoom,
    svgRef,
    viewW,
    viewH,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomButton,
  } = useMapPanZoom(baseSize.widthM, baseSize.heightM, {
    onTap: (point) => {
      const tapped = unprojectPoint(point, base)
      let nearest: MapPlace | null = null
      let nearestDistanceM = Infinity
      for (const place of visiblePlacesRef.current) {
        const distanceM = haversineMeters(tapped, place)
        if (distanceM < nearestDistanceM) {
          nearestDistanceM = distanceM
          nearest = place
        }
      }
      setSelected(
        nearest && nearestDistanceM <= PLACE_HIT_RADIUS_M
          ? { name: nearest.name, lat: nearest.lat, lon: nearest.lon }
          : { name: 'ตำแหน่งที่เลือก', lat: tapped.lat, lon: tapped.lon },
      )
    },
  })

  const currentBbox = useMemo(
    () => bboxFromView(base, view, { width: baseSize.widthM, height: baseSize.heightM }),
    [base, baseSize, view],
  )
  const visibleLines = useMemo(
    () => background.lines.filter((line) => lineIntersectsBbox(line, currentBbox)),
    [background, currentBbox],
  )
  const visibleLabels = useMemo(
    () => filterLabelsForDisplay(background.labels, currentBbox, MAX_LABELS),
    [background, currentBbox],
  )
  const visiblePlaces = useMemo(
    () => filterPlacesForDisplay(background.places, currentBbox, MAX_PLACES),
    [background, currentBbox],
  )
  // Writing (never reading) a ref during render to hand its latest value to a
  // later event handler is the documented-safe pattern — same as onTapRef in
  // useMapPanZoom.ts. oxlint's react/refs rule can't tell writes from reads.
  // eslint-disable-next-line react-hooks/refs
  visiblePlacesRef.current = visiblePlaces

  const scale = Math.min(baseSize.widthM, baseSize.heightM) / view.zoom
  const fontSize = scale * FONT_SIZE_RATIO
  const dotR = scale * DOT_RADIUS_RATIO

  return (
    <div className="destination-picker" role="dialog" aria-modal="true">
      <div className="leg-map-overlay-header">
        <span>แตะบนแผนที่เพื่อเลือกปลายทาง</span>
        <button type="button" aria-label="ปิด" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="route-map">
        <svg
          ref={svgRef}
          viewBox={`${view.panX} ${view.panY} ${viewW} ${viewH}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="แผนที่เลือกปลายทาง"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {visibleLines.map((line, i) => {
            const isMinorRoad = line.kind === 'road' && line.priority >= 3
            const widthFactor = line.kind === 'river' ? 1.3 : line.kind === 'footbridge' ? 0.4 : isMinorRoad ? 0.55 : 1
            return (
              <polyline
                key={i}
                className={lineClassName(line)}
                strokeWidth={widthFactor * scale * 0.004}
                points={line.points
                  .map(([lat, lon]) => {
                    const p = projectPoint({ lat, lon }, base)
                    return `${p.x},${p.y}`
                  })
                  .join(' ')}
              />
            )
          })}

          {visiblePlaces.map((place, i) => {
            const p = projectPoint(place, base)
            return (
              <g key={`place-${i}`} className="map-place">
                <circle cx={p.x} cy={p.y} r={dotR} />
                <text x={p.x + dotR * 1.5} y={p.y + fontSize * 0.3} fontSize={fontSize}>
                  {place.name}
                </text>
              </g>
            )
          })}

          {visibleLabels.map((label, i) => {
            const p = projectPoint(label, base)
            return (
              <text key={`label-${i}`} className="map-street-label" x={p.x} y={p.y} fontSize={fontSize}>
                {label.name}
              </text>
            )
          })}

          {selected &&
            (() => {
              const p = projectPoint(selected, base)
              return (
                <g className="map-stop current">
                  <circle cx={p.x} cy={p.y} r={dotR * 2.4} />
                  <text x={p.x} y={p.y - dotR * 3.4} fontSize={fontSize * 1.1}>
                    {selected.name}
                  </text>
                </g>
              )
            })()}
        </svg>

        <div className="map-zoom-controls">
          <button type="button" aria-label="ขยาย" onClick={() => zoomButton(1.4)}>
            +
          </button>
          <button type="button" aria-label="ย่อ" onClick={() => zoomButton(1 / 1.4)}>
            −
          </button>
          {view.zoom > minZoom && (
            <button type="button" aria-label="รีเซ็ตการซูม" onClick={() => setView(fitView)}>
              ⟲
            </button>
          )}
        </div>

        <MapAttribution />
      </div>

      <div className="picker-confirm-bar">
        <span>{selected ? selected.name : 'แตะจุดบนแผนที่'}</span>
        <button type="button" disabled={!selected} onClick={() => selected && onConfirm(selected)}>
          ยืนยันจุดนี้
        </button>
      </div>
    </div>
  )
}
