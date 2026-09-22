import { formatRouteCode } from '../lib/formatRoute'
import { useMapBackground } from '../lib/useMapBackground'
import type { Leg } from '../lib/destinationLookup'
import type { BusData } from '../lib/types'
import { RouteMap, type MapDestination } from './RouteMap'

interface Props {
  data: BusData
  leg: Leg
  /** มีความหมายเฉพาะกับช่วงที่เป็นตอนจบของการเดินทางจริงๆ — ใช้แสดงเส้นทางเดินต่อจากป้ายที่ลง */
  destination?: MapDestination
  onClose: () => void
}

export function LegMapOverlay({ data, leg, destination, onClose }: Props) {
  const { background, error } = useMapBackground()
  const boardStop = data.stops[leg.boardStopIdx]
  const alightStop = data.stops[leg.alightStopIdx]

  return (
    <div className="leg-map-overlay" role="dialog" aria-modal="true">
      <div className="leg-map-overlay-header">
        <span>
          {formatRouteCode(leg.route)} — {boardStop.nameTh || boardStop.nameEn} ไป{' '}
          {alightStop.nameTh || alightStop.nameEn}
        </span>
        <button type="button" aria-label="ปิดแผนที่" onClick={onClose}>
          ✕
        </button>
      </div>

      {background && (
        <RouteMap
          data={data}
          background={background}
          direction={leg.direction}
          fromPosition={leg.boardPosition}
          toPosition={leg.alightPosition}
          destination={destination}
        />
      )}
      {error && <p className="status error">โหลดแผนที่ไม่ได้: {error}</p>}
    </div>
  )
}
