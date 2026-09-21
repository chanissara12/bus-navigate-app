import { useMemo } from 'react'
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

  const roadWidth = scale * 0.006
  const riverWidth = scale * 0.008
  const routeWidth = scale * 0.005
  const fontSize = scale * 0.024
  const placeDotR = scale * 0.006
  const stopSmallR = scale * 0.006
  const stopBigR = scale * 0.014

  return (
    <div className="route-map">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="แผนที่เส้นทาง">
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
      <MapAttribution />
    </div>
  )
}
