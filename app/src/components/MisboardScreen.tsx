import { useMemo, useState } from 'react'
import { findStopIdxsWithinRadius, DESTINATION_WALK_RADIUS_M } from '../lib/destinationLookup'
import { FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import { recoverFromMisboarding } from '../lib/misboardRecovery'
import { routeCodeStartsWithInput } from '../lib/numberMatch'
import { findCurrentPositionOnDirection, hasNoReturnData } from '../lib/routeLookup'
import { formatRouteCode } from '../lib/formatRoute'
import { useMapBackground } from '../lib/useMapBackground'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData, Direction, Route } from '../lib/types'
import { DestinationSelector, type Destination } from './DestinationSelector'
import { LocationGate } from './LocationGate'

const CURRENT_POSITION_RADIUS_M = 300

interface Props {
  data: BusData
  location: GeolocationState
}

export function MisboardScreen({ data, location }: Props) {
  const { status, coords, error, request } = location
  const { background } = useMapBackground()
  const [routeInput, setRouteInput] = useState('')
  const [selected, setSelected] = useState<{ route: Route; direction: Direction } | null>(null)
  const [destination, setDestination] = useState<Destination>(FAVORITE_DESTINATIONS[0])

  const matchingDirections = useMemo(() => {
    if (routeInput === '') return []
    return data.directions.filter((d) => routeCodeStartsWithInput(data.routes[d.routeIdx], routeInput))
  }, [data, routeInput])

  const recovery = useMemo(() => {
    if (!selected || !coords) return null
    const position = findCurrentPositionOnDirection(data, selected.direction, coords, CURRENT_POSITION_RADIUS_M)
    if (position === null) return { kind: 'no-gps-fix' as const }
    const destIdxs = findStopIdxsWithinRadius(data, destination, DESTINATION_WALK_RADIUS_M)
    return recoverFromMisboarding(selected.direction, position, destIdxs)
  }, [data, selected, coords, destination])

  if (!selected) {
    return (
      <div className="screen">
        <h2>ขึ้นผิดคันแล้ว</h2>
        <input
          className="number-input"
          inputMode="numeric"
          placeholder="สายที่ขึ้นอยู่คือสายอะไร"
          value={routeInput}
          onChange={(e) => setRouteInput(e.target.value)}
        />
        <ul className="route-list">
          {matchingDirections.map((direction) => (
            <li key={`${direction.routeIdx}-${direction.directionId}`}>
              <button
                type="button"
                className="route-card"
                onClick={() => setSelected({ route: data.routes[direction.routeIdx], direction })}
              >
                <span className="route-code">{formatRouteCode(data.routes[direction.routeIdx])}</span>
                <span className="route-headsign">ไป {direction.headsignTh || direction.headsignEn}</span>
                {hasNoReturnData(data, direction) && (
                  <span className="no-return-warning">ไม่มีข้อมูลขากลับในฟีด</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <LocationGate
      status={status}
      error={error}
      reason="ต้องใช้ตำแหน่งของคุณเพื่อหาว่าคุณอยู่ตรงไหนบนสายนี้แล้ว"
      onRequest={request}
    >
      <div className="screen">
        <button type="button" className="back" onClick={() => setSelected(null)}>
          ← กลับ
        </button>
        <h2>
          {formatRouteCode(selected.route)} ไป {selected.direction.headsignTh || selected.direction.headsignEn}
        </h2>
        <p className="current-destination">
          อยากไปที่: <strong>{destination.name}</strong>
        </p>
        <DestinationSelector
          background={background}
          center={coords}
          value={destination}
          onSelectFavorite={setDestination}
          onPick={setDestination}
        />

        {recovery?.kind === 'no-gps-fix' && (
          <p className="status error">หาตำแหน่งบนสายนี้ไม่ได้ ลองใหม่ตอนรถวิ่งอยู่</p>
        )}
        {recovery?.kind === 'alight-next-stop' && (
          <p className="verdict ok">ลงป้ายหน้าได้เลย — {data.stops[recovery.stopIdx].nameTh}</p>
        )}
        {recovery?.kind === 'alight-in-n-stops' && (
          <p className="verdict ok">
            ยังลงไม่ได้อีก {recovery.stopsRemaining} ป้าย แล้วลงที่ {data.stops[recovery.stopIdx].nameTh}
          </p>
        )}
        {recovery?.kind === 'no-recovery' && <p className="verdict no">คันนี้ไม่พาไปที่นั่น ไม่มีทางกู้ได้จากคันนี้</p>}
      </div>
    </LocationGate>
  )
}
