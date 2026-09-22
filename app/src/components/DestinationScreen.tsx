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
  onShowMap: (legs: Leg[]) => void
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
          onClick={() => onShowMap([journey.leg])}
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
      ต่อสาย {formatRouteCode(journey.secondLeg.route)} ที่ {transferName} แล้วลงป้าย {alightName} —{' '}
      {minutes(journey.totalSec)} นาที (เดินต่ออีก {Math.round(journey.destinationWalkMeters)} ม.
      {journey.destinationCrossesMajorRoad ? ' — ข้ามถนนใหญ่' : ''})
      <button
        type="button"
        className="show-map"
        aria-label="ดูแผนที่ทั้งเส้นทาง"
        onClick={() => onShowMap([journey.firstLeg, journey.secondLeg])}
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
  onShowMap: (legs: Leg[]) => void
}) {
  // ตัวเลือกที่ดีที่สุดของกลุ่มแสดงเสมอ ส่วนตัวเลือกที่เหลือซ่อนไว้ก่อนจนกว่าผู้ใช้จะกดดูเพิ่มเติม
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
  // 1 ช่วงสำหรับสายตรง หรือ 2 ช่วงสำหรับการต่อรถ — LegMapOverlay วาดทั้งหมดในแผนที่เดียว
  // เสมอ จึงไม่ต้องแยกกรณี "ช่วงแรกยังไม่ถึงปลายทาง" เหมือนตอนที่เคยโชว์ทีละช่วงแล้ว
  const [mapLegs, setMapLegs] = useState<Leg[] | null>(null)

  // หาทุกเส้นทางที่เป็นไปได้จากตำแหน่งปัจจุบันไปปลายทาง แล้วจัดกลุ่มตามสาย/ทิศ
  // ที่ขึ้นได้ตอนนี้ เพื่อโชว์เป็นการ์ดต่อกลุ่ม (ไม่ใช่ต่อเส้นทางเดี่ยวๆ)
  const groups = useMemo(() => {
    if (!coords) return []
    const journeys = findJourneys(data, coords, destination, background?.lines)
    return groupByBoardNowDirection(journeys)
  }, [data, coords, destination, background])

  // คำนวณแยกจาก groups เพราะต้องใช้เปรียบเทียบว่าเดินตรงไปเร็วกว่านั่งรถหรือไม่
  // แม้ตอนที่ groups ว่างเปล่าก็ยังต้องรู้ว่าควรเดินหรือไม่มีสายไปเลย
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
    setMapLegs(bestOption.type === 'direct' ? [bestOption.leg] : [bestOption.firstLeg, bestOption.secondLeg])
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

        {mapLegs && (
          <LegMapOverlay data={data} legs={mapLegs} destination={destination} onClose={() => setMapLegs(null)} />
        )}

        {groups.length === 0 && directWalk && (
          // Note: groups ว่างเปล่าได้จาก 2 สาเหตุ — findJourneys กรองตัวเลือกรถเมล์
          // ทั้งหมดทิ้งไปแล้วเพราะเดินเร็วกว่า (ดู DIRECT_WALK_MAX_M ในไฟล์นั้น)
          // หรือไม่มีสายอยู่ในระยะเลยจริงๆ DESTINATION_WALK_RADIUS_M (ซึ่งกว้างกว่า
          // เกณฑ์ที่ใช้กรองข้างในนั้น) ถูกนำมาใช้ตรงนี้เพียงเพื่อเลือกว่าข้อความไหน
          // ตรงกับความจริง ไม่ได้เอามากรองซ้ำ
          <p className="status">
            {directWalk.meters <= DESTINATION_WALK_RADIUS_M
              ? `จุดหมายอยู่ใกล้แค่ ${Math.round(directWalk.meters)} ม. เดินไปเลยดีกว่านั่งรถ (ประมาณ ${minutes(directWalk.sec)} นาที${directWalk.crossesMajorRoad ? ' — ข้ามถนนใหญ่' : ''})`
              : 'ไม่พบสายที่ไปถึงในระยะที่เดินได้'}
          </p>
        )}

        <div className="board-now-groups">
          {groups.map((group) => (
            <BoardNowGroupCard key={group.key} data={data} group={group} onShowMap={setMapLegs} />
          ))}
        </div>
      </div>
    </LocationGate>
  )
}
