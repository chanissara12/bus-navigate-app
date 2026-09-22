import { useMemo } from 'react'
import { useMapPanZoom } from '../lib/useMapPanZoom'
import {
  bboxSizeMeters,
  boundingBoxWithMargin,
  filterLabelsForDisplay,
  filterPlacesForDisplay,
  findWalkingPath,
  lineClassName,
  lineIntersectsBbox,
  projectPoint,
  sliceShapeFromNearestPoint,
  sliceShapeToNearestPoint,
} from '../lib/svgMap'
import type { BusData, Direction, MapBackground } from '../lib/types'
import { MapAttribution } from './MapAttribution'

const BBOX_MARGIN_RATIO = 0.12
const MAX_LABELS = 6
const MAX_PLACES = 7

export interface MapDestination {
  name: string
  lat: number
  lon: number
}

export interface RouteMapLeg {
  direction: Direction
  fromPosition: number
  /** ป้ายสุดท้ายที่จะรวมด้วย (รวมป้ายนี้เอง) ถ้าไม่ระบุจะใช้ป้ายสุดท้ายของทิศนี้ */
  toPosition?: number
}

interface Props {
  data: BusData
  background: MapBackground
  /** ปกติมีช่วงเดียว — สองช่วงเมื่ออยากแสดงทั้งสองขาของการต่อรถในแผนที่เดียวกัน */
  legs: RouteMapLeg[]
  /** จุดที่ผู้โดยสารตั้งใจจะไปจริงๆ — วาดต่อจากป้ายที่ลงของช่วงสุดท้าย พร้อมเส้นทางเดินไปให้ถึง */
  destination?: MapDestination
}

export function RouteMap({ data, background, legs, destination }: Props) {
  // คำนวณทุกอย่างที่ต้องใช้วาดแผนที่ในรอบเดียว (ขอบเขตพื้นที่, เส้นทางที่ตัดมาแล้วของทุกช่วง,
  // ป้ายที่จะแสดง, เส้นทางเดินต่อรถและเดินไปปลายทาง ฯลฯ) เพื่อไม่ต้องคำนวณ bbox ซ้ำหลายรอบต่อ render
  const { bbox, width, height, scale, legRoutePoints, lines, labels, places, stopPoints, transferWalkPoints, walkPoints } =
    useMemo(() => {
      const legStops = legs.map(({ direction, fromPosition, toPosition }) => {
        const lastPosition = toPosition ?? direction.stopIdxs.length - 1
        const upcomingStopIdxs = direction.stopIdxs.slice(fromPosition, lastPosition + 1)
        const currentStop = data.stops[upcomingStopIdxs[0]]
        const lastStop = data.stops[upcomingStopIdxs[upcomingStopIdxs.length - 1]]
        const totalPositions = Math.max(1, direction.stopIdxs.length - 1)
        const fromFraction = fromPosition / totalPositions
        const toFraction = lastPosition / totalPositions

        let slicedShape: [number, number][] = []
        if (direction.shapeCoords.length > 0) {
          slicedShape = sliceShapeFromNearestPoint(direction.shapeCoords, currentStop, fromFraction)
          if (toPosition !== undefined) {
            // ปรับสัดส่วน (fraction) ใหม่ให้อ้างอิงกับรูปทรงที่ถูกตัดหัวไปแล้ว ก่อนจะตัดท้ายต่อ
            const remainingFraction = (toFraction - fromFraction) / Math.max(1e-6, 1 - fromFraction)
            slicedShape = sliceShapeToNearestPoint(slicedShape, lastStop, remainingFraction)
          }
        }

        return { upcomingStopIdxs, currentStop, lastStop, slicedShape }
      })

      const lastLeg = legStops[legStops.length - 1]
      const walk = destination ? findWalkingPath(lastLeg.lastStop, destination, background.lines) : null

      // ช่วงต่อรถ (มีมากกว่า 1 leg) เดินจากป้ายที่ลงของช่วงแรกไปป้ายที่ขึ้นของช่วงถัดไป —
      // วาดเป็นเส้นเดินแบบเดียวกับเส้นเดินไปปลายทาง เพื่อให้เห็นว่าเป็นการเดินทางเดียวกันต่อเนื่องกัน
      const transferWalk =
        legStops.length > 1
          ? findWalkingPath(legStops[0].lastStop, legStops[1].currentStop, background.lines)
          : null

      const stopLatLons = legStops.flatMap((leg) => leg.upcomingStopIdxs.map((idx) => data.stops[idx]))
      const shapeLatLons = legStops.flatMap((leg) => leg.slicedShape.map(([lat, lon]) => ({ lat, lon })))
      const box = boundingBoxWithMargin(
        [...stopLatLons, ...shapeLatLons, ...(transferWalk?.points ?? []), ...(walk?.points ?? [])],
        BBOX_MARGIN_RATIO,
      )
      const { widthM, heightM } = bboxSizeMeters(box)

      return {
        bbox: box,
        width: widthM,
        height: heightM,
        scale: Math.max(widthM, heightM),
        legRoutePoints: legStops.map((leg) => leg.slicedShape.map(([lat, lon]) => projectPoint({ lat, lon }, box))),
        lines: background.lines.filter((line) => lineIntersectsBbox(line, box)),
        labels: filterLabelsForDisplay(background.labels, box, MAX_LABELS),
        places: filterPlacesForDisplay(background.places, box, MAX_PLACES),
        // จุดใหญ่ + ป้ายชื่อ เฉพาะป้ายแรกสุด (คุณอยู่ที่นี่), ป้ายสุดท้ายของแต่ละช่วง
        // (จุดลง/จุดต่อรถ), และป้ายแรกของช่วงถัดไป (จุดขึ้นต่อ) — ป้ายระหว่างทางเป็นจุดเล็กเฉยๆ
        // สีแดง (current=false, last=true) สงวนไว้เฉพาะจุดลงสุดท้ายจริงๆ ไม่ใช่ทุกจุดต่อรถ
        // เพื่อไม่ให้จุดต่อรถกลางทางถูกเข้าใจผิดว่าเป็นจุดหมายปลายทาง
        stopPoints: legStops.flatMap((leg, legIndex) =>
          leg.upcomingStopIdxs.map((idx, posIndex) => {
            const isCurrent = legIndex === 0 && posIndex === 0
            const isOverallLast = legIndex === legStops.length - 1 && posIndex === leg.upcomingStopIdxs.length - 1
            const isTransferPoint = posIndex === 0 || posIndex === leg.upcomingStopIdxs.length - 1
            const big = isCurrent || isOverallLast || isTransferPoint
            return {
              key: `${legIndex}-${idx}-${posIndex}`,
              stop: data.stops[idx],
              point: projectPoint(data.stops[idx], box),
              big,
              current: isCurrent,
              last: isOverallLast,
              label: big ? (isCurrent ? 'คุณอยู่ที่นี่' : data.stops[idx].nameTh || data.stops[idx].nameEn) : null,
            }
          }),
        ),
        transferWalkPoints: transferWalk?.points.map((p) => projectPoint(p, box)) ?? null,
        walkPoints: walk?.points.map((p) => projectPoint(p, box)) ?? null,
      }
    }, [data, background, legs, destination])

  const { view, setView, fitView, minZoom, svgRef, viewW, viewH, handlePointerDown, handlePointerMove, handlePointerUp, zoomButton } =
    useMapPanZoom(width, height)

  const roadWidth = scale * 0.006
  const riverWidth = scale * 0.008
  const footbridgeWidth = scale * 0.003
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {lines.map((line, i) => {
          const isMinorRoad = line.kind === 'road' && line.priority >= 3
          const strokeWidth =
            line.kind === 'river' ? riverWidth : line.kind === 'footbridge' ? footbridgeWidth : isMinorRoad ? roadWidth * 0.55 : roadWidth
          return (
            <polyline
              key={i}
              className={lineClassName(line)}
              strokeWidth={strokeWidth}
              points={line.points
                .map(([lat, lon]) => {
                  const p = projectPoint({ lat, lon }, bbox)
                  return `${p.x},${p.y}`
                })
                .join(' ')}
            />
          )
        })}

        {legRoutePoints.map(
          (points, legIndex) =>
            points.length > 1 && (
              <polyline
                key={`route-${legIndex}`}
                className={legIndex === 0 ? 'map-route' : 'map-route map-route-second'}
                strokeWidth={routeWidth}
                points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              />
            ),
        )}

        {transferWalkPoints && (
          <polyline
            className="map-walk"
            strokeWidth={footbridgeWidth}
            points={transferWalkPoints.map((p) => `${p.x},${p.y}`).join(' ')}
          />
        )}

        {walkPoints && (
          <polyline
            className="map-walk"
            strokeWidth={footbridgeWidth}
            points={walkPoints.map((p) => `${p.x},${p.y}`).join(' ')}
          />
        )}

        {destination && walkPoints && (
          <g className="map-destination">
            <circle cx={walkPoints[walkPoints.length - 1].x} cy={walkPoints[walkPoints.length - 1].y} r={stopBigR} />
            <text
              x={walkPoints[walkPoints.length - 1].x}
              y={walkPoints[walkPoints.length - 1].y - stopBigR * 1.6}
              fontSize={fontSize * 1.1}
            >
              {destination.name}
            </text>
          </g>
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

        {stopPoints.map(({ key, point, big, current, last, label }) => (
          <g key={key} className={`map-stop ${current ? 'current' : ''} ${last ? 'last' : ''}`}>
            <circle cx={point.x} cy={point.y} r={big ? stopBigR : stopSmallR} strokeWidth={stopSmallR * 0.5} />
            {label && (
              <text x={point.x} y={point.y - stopBigR * 1.6} fontSize={fontSize * 1.1}>
                {label}
              </text>
            )}
          </g>
        ))}
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
  )
}
