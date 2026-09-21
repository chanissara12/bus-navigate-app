import { useMemo, useState } from 'react'
import { findJourneys, groupByBoardNowDirection, type Journey, type Leg } from '../lib/destinationLookup'
import { FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import { formatRouteCode } from '../lib/formatRoute'
import { searchPlaces } from '../lib/placeSearch'
import { hasNoReturnData } from '../lib/routeLookup'
import { useMapBackground } from '../lib/useMapBackground'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData } from '../lib/types'
import { DestinationPicker, type PickedDestination } from './DestinationPicker'
import { LegMapOverlay } from './LegMapOverlay'
import { LocationGate } from './LocationGate'

const MAX_SEARCH_RESULTS = 8

interface Props {
  data: BusData
  location: GeolocationState
}

interface Destination {
  name: string
  lat: number
  lon: number
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
  const { background } = useMapBackground()
  const [destination, setDestination] = useState<Destination>(FAVORITE_DESTINATIONS[0])
  const [searchInput, setSearchInput] = useState('')
  const [mapLeg, setMapLeg] = useState<Leg | null>(null)
  const [pickingOnMap, setPickingOnMap] = useState(false)

  const searchResults = useMemo(() => {
    if (!background) return []
    return searchPlaces(background, searchInput, MAX_SEARCH_RESULTS)
  }, [background, searchInput])

  const groups = useMemo(() => {
    if (!coords) return []
    const journeys = findJourneys(data, coords, destination)
    return groupByBoardNowDirection(journeys)
  }, [data, coords, destination])

  function openBestLegMap(forDestination: Destination) {
    if (!coords) return
    const journeys = findJourneys(data, coords, forDestination)
    const [bestGroup] = groupByBoardNowDirection(journeys)
    if (!bestGroup) return
    const bestOption = bestGroup.options[0]
    setMapLeg(bestOption.type === 'direct' ? bestOption.leg : bestOption.firstLeg)
  }

  function choosePlace(place: Destination) {
    setDestination(place)
    setSearchInput('')
    openBestLegMap(place)
  }

  function handlePicked(picked: PickedDestination) {
    setDestination(picked)
    setPickingOnMap(false)
    openBestLegMap(picked)
  }

  return (
    <LocationGate
      status={status}
      error={error}
      reason="ต้องใช้ตำแหน่งของคุณเพื่อหาสายรถเมล์จากจุดที่คุณยืนอยู่"
      onRequest={request}
    >
      <div className="screen">
        <h2>ไปไหน</h2>
        <p className="current-destination">
          ปลายทาง: <strong>{destination.name}</strong>
        </p>

        <select
          value={FAVORITE_DESTINATIONS.some((d) => d.name === destination.name) ? destination.name : ''}
          onChange={(e) => {
            const picked = FAVORITE_DESTINATIONS.find((d) => d.name === e.target.value)
            if (picked) setDestination(picked)
          }}
        >
          <option value="" disabled>
            เลือกจากรายการที่บันทึกไว้
          </option>
          {FAVORITE_DESTINATIONS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        <input
          className="number-input"
          placeholder="พิมพ์ค้นหาสถานที่ เช่น ห้าง โรงพยาบาล สถานีรถไฟฟ้า"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchResults.length > 0 && (
          <ul className="destination-search-results">
            {searchResults.map((place, i) => (
              <li key={i}>
                <button type="button" onClick={() => choosePlace(place)}>
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        {background && (
          <button type="button" className="pick-from-map-button" onClick={() => setPickingOnMap(true)}>
            🗺 เลือกจากแผนที่
          </button>
        )}

        {mapLeg && <LegMapOverlay data={data} leg={mapLeg} onClose={() => setMapLeg(null)} />}

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
                {hasNoReturnData(data, group.direction) && (
                  <span className="no-return-warning">ไม่มีข้อมูลขากลับในฟีด</span>
                )}
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

      {pickingOnMap && background && coords && (
        <DestinationPicker
          background={background}
          center={coords}
          onConfirm={handlePicked}
          onClose={() => setPickingOnMap(false)}
        />
      )}
    </LocationGate>
  )
}
