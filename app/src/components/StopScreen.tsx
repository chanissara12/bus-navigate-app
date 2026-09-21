import { useMemo, useState } from 'react'
import { boardableDirectionsAtStop, findNearestStop, type BoardableDirection } from '../lib/routeLookup'
import { routeCodeStartsWithInput, routeMatchesInput } from '../lib/numberMatch'
import { formatRouteCode } from '../lib/formatRoute'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData } from '../lib/types'
import { LocationGate } from './LocationGate'

const NEAREST_STOP_RADIUS_M = 150

interface Props {
  data: BusData
  location: GeolocationState
  onOpenRoute: (boardable: BoardableDirection) => void
}

export function StopScreen({ data, location, onOpenRoute }: Props) {
  const { status, coords, error, request } = location
  const [input, setInput] = useState('')

  const nearest = useMemo(() => {
    if (!coords) return null
    return findNearestStop(data, coords, NEAREST_STOP_RADIUS_M)
  }, [data, coords])

  const boardable = useMemo(() => {
    if (!nearest) return []
    return boardableDirectionsAtStop(data, nearest.stop.id)
  }, [data, nearest])

  const candidates = useMemo(() => {
    if (input === '') return null
    return boardable.filter((b) => routeCodeStartsWithInput(b.route, input))
  }, [boardable, input])

  const hasExactMatch = useMemo(() => {
    if (!candidates) return false
    return candidates.some((b) => routeMatchesInput(b.route, input))
  }, [candidates, input])

  return (
    <LocationGate
      status={status}
      error={error}
      reason="ต้องใช้ตำแหน่งของคุณเพื่อหาป้ายรถเมล์ที่ใกล้ที่สุด"
      onRequest={request}
    >
      {!nearest ? (
        <p className="status">ไม่พบป้ายรถเมล์ในระยะ {NEAREST_STOP_RADIUS_M} เมตร</p>
      ) : (
        <div className="screen">
          <div className="stop-header">
            <span className="stop-name">{nearest.stop.nameTh || nearest.stop.nameEn}</span>
            <span className="stop-distance">{Math.round(nearest.distanceM)} ม.</span>
          </div>

          <input
            className="number-input"
            inputMode="numeric"
            placeholder="พิมพ์เลขสายที่เห็นหน้ารถ"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          {candidates !== null && candidates.length === 0 && (
            <div className="verdict no">อย่าขึ้น — สายนี้ไม่ผ่านป้ายนี้ไปทางไหนเลย</div>
          )}
          {candidates !== null && hasExactMatch && <div className="verdict ok">ขึ้นได้</div>}

          <ul className="route-list">
            {(candidates ?? boardable).map((b) => (
              <li key={`${b.direction.routeIdx}-${b.direction.directionId}`}>
                <button type="button" className="route-card" onClick={() => onOpenRoute(b)}>
                  <span className="route-code">{formatRouteCode(b.route)}</span>
                  <span className="route-headsign">ไป {b.direction.headsignTh || b.direction.headsignEn}</span>
                </button>
              </li>
            ))}
          </ul>
          {boardable.length === 0 && candidates === null && <p className="status">ป้ายนี้ไม่มีสายผ่าน</p>}
        </div>
      )}
    </LocationGate>
  )
}
