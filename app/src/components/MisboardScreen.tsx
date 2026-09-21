import { useMemo, useState } from 'react'
import { findStopIdxsWithinRadius, DESTINATION_WALK_RADIUS_M } from '../lib/destinationLookup'
import { FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import { recoverFromMisboarding } from '../lib/misboardRecovery'
import { routeMatchesInput } from '../lib/numberMatch'
import { findCurrentPositionOnDirection } from '../lib/routeLookup'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData, Direction, Route } from '../lib/types'
import { LocationGate } from './LocationGate'

const CURRENT_POSITION_RADIUS_M = 300

interface Props {
  data: BusData
  location: GeolocationState
}

export function MisboardScreen({ data, location }: Props) {
  const { status, coords, error, request } = location
  const [routeInput, setRouteInput] = useState('')
  const [selected, setSelected] = useState<{ route: Route; direction: Direction } | null>(null)
  const [destinationName, setDestinationName] = useState(FAVORITE_DESTINATIONS[0].name)

  const matchingDirections = useMemo(() => {
    if (routeInput === '') return []
    return data.directions.filter((d) => routeMatchesInput(data.routes[d.routeIdx], routeInput))
  }, [data, routeInput])

  const recovery = useMemo(() => {
    if (!selected || !coords) return null
    const position = findCurrentPositionOnDirection(data, selected.direction, coords, CURRENT_POSITION_RADIUS_M)
    if (position === null) return { kind: 'no-gps-fix' as const }
    const destination = FAVORITE_DESTINATIONS.find((d) => d.name === destinationName)
    if (!destination) return null
    const destIdxs = findStopIdxsWithinRadius(data, destination, DESTINATION_WALK_RADIUS_M)
    return recoverFromMisboarding(selected.direction, position, destIdxs)
  }, [data, selected, coords, destinationName])

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
                <span className="route-code">{data.routes[direction.routeIdx].newCode}</span>
                <span className="route-headsign">ไป {direction.headsignTh || direction.headsignEn}</span>
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
          {selected.route.newCode} ไป {selected.direction.headsignTh || selected.direction.headsignEn}
        </h2>
        <label>
          อยากไปที่
          <select value={destinationName} onChange={(e) => setDestinationName(e.target.value)}>
            {FAVORITE_DESTINATIONS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

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
