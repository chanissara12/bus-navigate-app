import { useMemo, useState } from 'react'
import { findJourneys, groupByBoardNowDirection, type Journey } from '../lib/destinationLookup'
import { FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import { useGeolocation } from '../lib/useGeolocation'
import type { BusData } from '../lib/types'
import { LocationGate } from './LocationGate'

interface Props {
  data: BusData
}

function minutes(sec: number): number {
  return Math.round(sec / 60)
}

function JourneyLine({ data, journey }: { data: BusData; journey: Journey }) {
  if (journey.type === 'direct') {
    const alightName = data.stops[journey.leg.alightStopIdx].nameTh || data.stops[journey.leg.alightStopIdx].nameEn
    return (
      <li>
        ลงป้าย {alightName} — {minutes(journey.totalSec)} นาที
      </li>
    )
  }
  const transferName =
    data.stops[journey.firstLeg.alightStopIdx].nameTh || data.stops[journey.firstLeg.alightStopIdx].nameEn
  const alightName =
    data.stops[journey.secondLeg.alightStopIdx].nameTh || data.stops[journey.secondLeg.alightStopIdx].nameEn
  return (
    <li>
      ต่อสาย {journey.secondLeg.route.newCode} ที่ {transferName} แล้วลงป้าย {alightName} —{' '}
      {minutes(journey.totalSec)} นาที
    </li>
  )
}

export function DestinationScreen({ data }: Props) {
  const { status, coords, error, request } = useGeolocation()
  const [destinationName, setDestinationName] = useState(FAVORITE_DESTINATIONS[0].name)

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
                <span className="route-code">{group.route.newCode}</span>
                <span>ไป {group.direction.headsignTh || group.direction.headsignEn}</span>
                <span className="board-stop">
                  ขึ้นที่ {data.stops[group.boardStopIdx].nameTh || data.stops[group.boardStopIdx].nameEn}
                </span>
              </div>
              <ul>
                {group.options.map((option, i) => (
                  <JourneyLine key={i} data={data} journey={option} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </LocationGate>
  )
}
