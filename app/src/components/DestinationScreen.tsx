import { useMemo, useState } from 'react'
import {
  DESTINATION_WALK_RADIUS_M,
  findDirectWalk,
  findJourneys,
  groupByBoardNowDirection,
  type BoardNowGroup,
  type Journey,
  type Leg,
} from '../lib/destinationLookup'
import { FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import { formatRouteCode } from '../lib/formatRoute'
import { hasNoReturnData } from '../lib/routeLookup'
import { useMapBackground } from '../lib/useMapBackground'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData } from '../lib/types'
import { DestinationSelector, type Destination } from './DestinationSelector'
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
  onShowMap: (leg: Leg, isFinalLeg: boolean) => void
}) {
  if (journey.type === 'direct') {
    const alightName = data.stops[journey.leg.alightStopIdx].nameTh || data.stops[journey.leg.alightStopIdx].nameEn
    return (
      <li>
        ลงป้าย {alightName} — {minutes(journey.totalSec)} นาที (เดินต่ออีก{' '}
        {Math.round(journey.destinationWalkMeters)} ม.
        {journey.destinationCrossesMajorRoad ? ' — ข้ามถนนใหญ่' : ''})
        <button
          type="button"
          className="show-map"
          aria-label="ดูแผนที่"
          onClick={() => onShowMap(journey.leg, true)}
        >
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
        onClick={() => onShowMap(journey.firstLeg, false)}
      >
        🗺
      </button>{' '}
      แล้วลงป้าย {alightName} — {minutes(journey.totalSec)} นาที (เดินต่ออีก{' '}
      {Math.round(journey.destinationWalkMeters)} ม.
      {journey.destinationCrossesMajorRoad ? ' — ข้ามถนนใหญ่' : ''})
      <button
        type="button"
        className="show-map"
        aria-label="ดูแผนที่ช่วงต่อ"
        onClick={() => onShowMap(journey.secondLeg, true)}
      >
        🗺
      </button>
    </li>
  )
}

function BoardNowGroupCard({
  data,
  group,
  onShowMap,
}: {
  data: BusData
  group: BoardNowGroup
  onShowMap: (leg: Leg, isFinalLeg: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [bestOption, ...restOptions] = group.options

  return (
    <div className="board-now-group">
      <div className="group-header">
        <span className="route-code">{formatRouteCode(group.route)}</span>
        <span>ไป {group.direction.headsignTh || group.direction.headsignEn}</span>
        <span className="board-stop">
          ขึ้นที่ {data.stops[group.boardStopIdx].nameTh || data.stops[group.boardStopIdx].nameEn}
          {' — เดิน '}
          {Math.round(group.originWalkMeters)} ม.
          {group.originCrossesMajorRoad ? ' — ข้ามถนนใหญ่' : ''}
        </span>
        {hasNoReturnData(data, group.direction) && <span className="no-return-warning">ไม่มีข้อมูลขากลับในฟีด</span>}
      </div>
      <ul>
        <JourneyLine data={data} journey={bestOption} onShowMap={onShowMap} />
        {expanded && restOptions.map((option, i) => <JourneyLine key={i} data={data} journey={option} onShowMap={onShowMap} />)}
      </ul>
      {restOptions.length > 0 && (
        <button type="button" className="expand-options" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'ย่อ' : `ดูเพิ่มเติม (${restOptions.length})`}
        </button>
      )}
    </div>
  )
}

export function DestinationScreen({ data, location }: Props) {
  const { status, coords, error, request } = location
  const { background } = useMapBackground()
  const [destination, setDestination] = useState<Destination>(FAVORITE_DESTINATIONS[0])
  const [mapLeg, setMapLeg] = useState<{ leg: Leg; isFinalLeg: boolean } | null>(null)

  const groups = useMemo(() => {
    if (!coords) return []
    const journeys = findJourneys(data, coords, destination, background?.lines)
    return groupByBoardNowDirection(journeys)
  }, [data, coords, destination, background])

  const directWalk = useMemo(() => {
    if (!coords) return null
    return findDirectWalk(coords, destination, background?.lines)
  }, [coords, destination, background])

  function openBestLegMap(forDestination: Destination) {
    if (!coords) return
    const journeys = findJourneys(data, coords, forDestination, background?.lines)
    const [bestGroup] = groupByBoardNowDirection(journeys)
    if (!bestGroup) return
    const bestOption = bestGroup.options[0]
    // A transfer's first leg only reaches the transfer point, not the destination.
    setMapLeg(
      bestOption.type === 'direct'
        ? { leg: bestOption.leg, isFinalLeg: true }
        : { leg: bestOption.firstLeg, isFinalLeg: false },
    )
  }

  function showLegMap(leg: Leg, isFinalLeg: boolean) {
    setMapLeg({ leg, isFinalLeg })
  }

  function pickDestination(picked: Destination) {
    setDestination(picked)
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

        <DestinationSelector
          background={background}
          center={coords}
          value={destination}
          onSelectFavorite={setDestination}
          onPick={pickDestination}
        />

        {mapLeg && (
          <LegMapOverlay
            data={data}
            leg={mapLeg.leg}
            destination={mapLeg.isFinalLeg ? destination : undefined}
            onClose={() => setMapLeg(null)}
          />
        )}

        {groups.length === 0 && directWalk && (
          <p className="status">
            {directWalk.meters <= DESTINATION_WALK_RADIUS_M
              ? `จุดหมายอยู่ใกล้แค่ ${Math.round(directWalk.meters)} ม. เดินไปเลยดีกว่านั่งรถ (ประมาณ ${minutes(directWalk.sec)} นาที${directWalk.crossesMajorRoad ? ' — ข้ามถนนใหญ่' : ''})`
              : 'ไม่พบสายที่ไปถึงในระยะที่เดินได้'}
          </p>
        )}

        <div className="board-now-groups">
          {groups.map((group) => (
            <BoardNowGroupCard key={group.key} data={data} group={group} onShowMap={showLegMap} />
          ))}
        </div>
      </div>
    </LocationGate>
  )
}
