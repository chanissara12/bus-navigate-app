import { useMemo, useState } from 'react'
import { findJourneys, groupByBoardNowDirection, type Journey, type Leg } from '../lib/destinationLookup'
import { FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import { formatRouteCode } from '../lib/formatRoute'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData } from '../lib/types'
import { LegMapOverlay } from './LegMapOverlay'
import { LocationGate } from './LocationGate'

interface Props {
  data: BusData
  location: GeolocationState
}

function minutes(sec: number): number {
  return Math.round(sec / 60)
}

function JourneyLine({
  data,
  journey,
  onShowMap,
}: {
  data: BusData
  journey: Journey
  onShowMap: (leg: Leg) => void
}) {
  if (journey.type === 'direct') {
    const alightName = data.stops[journey.leg.alightStopIdx].nameTh || data.stops[journey.leg.alightStopIdx].nameEn
    return (
      <li>
        ลงป้าย {alightName} — {minutes(journey.totalSec)} นาที
        <button type="button" className="show-map" aria-label="ดูแผนที่" onClick={() => onShowMap(journey.leg)}>
          🗺
        </button>
      </li>
    )
  }
  const transferName =
    data.stops[journey.firstLeg.alightStopIdx].nameTh || data.stops[journey.firstLeg.alightStopIdx].nameEn
  const alightName =
    data.stops[journey.secondLeg.alightStopIdx].nameTh || data.stops[journey.secondLeg.alightStopIdx].nameEn
  return (
    <li>
      ต่อสาย {formatRouteCode(journey.secondLeg.route)} ที่ {transferName}
      <button
        type="button"
        className="show-map"
        aria-label="ดูแผนที่ช่วงแรก"
        onClick={() => onShowMap(journey.firstLeg)}
      >
        🗺
      </button>{' '}
      แล้วลงป้าย {alightName} — {minutes(journey.totalSec)} นาที
      <button
        type="button"
        className="show-map"
        aria-label="ดูแผนที่ช่วงต่อ"
        onClick={() => onShowMap(journey.secondLeg)}
      >
        🗺
      </button>
    </li>
  )
}

export function DestinationScreen({ data, location }: Props) {
  const { status, coords, error, request } = location
  const [destinationName, setDestinationName] = useState(FAVORITE_DESTINATIONS[0].name)
  const [mapLeg, setMapLeg] = useState<Leg | null>(null)

  const groups = useMemo(() => {
    if (!coords) return []
    const destination = FAVORITE_DESTINATIONS.find((d) => d.name === destinationName)
    if (!destination) return []
    const journeys = findJourneys(data, coords, destination)
    return groupByBoardNowDirection(journeys)
  }, [data, coords, destinationName])

  return (
    <LocationGate
      status={status}
      error={error}
      reason="ต้องใช้ตำแหน่งของคุณเพื่อหาสายรถเมล์จากจุดที่คุณยืนอยู่"
      onRequest={request}
    >
      <div className="screen">
        <h2>ไปไหน</h2>
        <select value={destinationName} onChange={(e) => setDestinationName(e.target.value)}>
          {FAVORITE_DESTINATIONS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        {groups.length === 0 && <p className="status">ไม่พบสายที่ไปถึงในระยะที่เดินได้</p>}

        <div className="board-now-groups">
          {groups.map((group) => (
            <div key={group.key} className="board-now-group">
              <div className="group-header">
                <span className="route-code">{formatRouteCode(group.route)}</span>
                <span>ไป {group.direction.headsignTh || group.direction.headsignEn}</span>
                <span className="board-stop">
                  ขึ้นที่ {data.stops[group.boardStopIdx].nameTh || data.stops[group.boardStopIdx].nameEn}
                </span>
              </div>
              <ul>
                {group.options.map((option, i) => (
                  <JourneyLine key={i} data={data} journey={option} onShowMap={setMapLeg} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {mapLeg && <LegMapOverlay data={data} leg={mapLeg} onClose={() => setMapLeg(null)} />}
    </LocationGate>
  )
}
