import { formatRouteCode } from '../lib/formatRoute'
import { useMapBackground } from '../lib/useMapBackground'
import type { Leg } from '../lib/destinationLookup'
import type { BusData } from '../lib/types'
import { RouteMap, type MapDestination } from './RouteMap'

interface Props {
  data: BusData
  /** ปกติมี 1 ช่วง — 2 ช่วงเมื่อเป็นการเดินทางแบบต่อรถ เพื่อวาดทั้งสองสายในแผนที่เดียวกัน */
  legs: Leg[]
  destination?: MapDestination
  onClose: () => void
}

export function LegMapOverlay({ data, legs, destination, onClose }: Props) {
  const { background, error } = useMapBackground()
  const boardStop = data.stops[legs[0].boardStopIdx]
  const lastLeg = legs[legs.length - 1]
  const alightStop = data.stops[lastLeg.alightStopIdx]
  const routeCodes = legs.map((leg) => formatRouteCode(leg.route)).join(' ต่อ ')

  return (
    <div className="leg-map-overlay" role="dialog" aria-modal="true">
      <div className="leg-map-overlay-header">
        <span>
          {routeCodes} — {boardStop.nameTh || boardStop.nameEn} ไป {alightStop.nameTh || alightStop.nameEn}
        </span>
        <button type="button" aria-label="ปิดแผนที่" onClick={onClose}>
          ✕
        </button>
      </div>

      {background && (
        <RouteMap
          data={data}
          background={background}
          legs={legs.map((leg) => ({
            direction: leg.direction,
            fromPosition: leg.boardPosition,
            toPosition: leg.alightPosition,
          }))}
          destination={destination}
        />
      )}
      {error && <p className="status error">โหลดแผนที่ไม่ได้: {error}</p>}
    </div>
  )
}
