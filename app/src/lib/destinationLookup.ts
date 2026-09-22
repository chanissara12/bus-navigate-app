import { haversineMeters, walkSeconds, type LatLon } from './geo'
import { buildSpatialIndex, type SpatialIndex } from './spatialIndex'
import { findWalkingPath } from './svgMap'
import type { BusData, Direction, MapLine, Route } from './types'

export const ORIGIN_WALK_RADIUS_M = 400
export const DESTINATION_WALK_RADIUS_M = 800
const TRANSFER_WALK_RADIUS_M = 400
const DEFAULT_WAIT_SEC = 300

export interface Leg {
  route: Route
  direction: Direction
  boardStopIdx: number
  boardPosition: number
  alightStopIdx: number
  alightPosition: number
  waitSec: number
  rideSec: number
}

export interface DirectJourney {
  type: 'direct'
  leg: Leg
  originWalkMeters: number
  destinationWalkMeters: number
  totalSec: number
}

export interface TransferJourney {
  type: 'transfer'
  firstLeg: Leg
  secondLeg: Leg
  transferWalkSec: number
  originWalkMeters: number
  destinationWalkMeters: number
  totalSec: number
}

export type Journey = DirectJourney | TransferJourney

export interface BoardNowGroup {
  key: string
  route: Route
  direction: Direction
  boardStopIdx: number
  originWalkMeters: number
  options: Journey[]
}

function waitSecondsFor(direction: Direction): number {
  return direction.headwaySec != null ? direction.headwaySec / 2 : DEFAULT_WAIT_SEC
}

const indexCache = new WeakMap<BusData, SpatialIndex>()

function getIndex(data: BusData): SpatialIndex {
  const cached = indexCache.get(data)
  if (cached) return cached
  const index = buildSpatialIndex(data)
  indexCache.set(data, index)
  return index
}

export function findStopIdxsWithinRadius(data: BusData, center: LatLon, radiusM: number): Set<number> {
  return new Set(getIndex(data).stopsNear(center, radiusM))
}

// A straight line from a stop to a destination can cut across a road that
// isn't actually crossable there — real distance is what findWalkingPath
// (which knows about roads and footbridges) would have you walk instead.
// Confirmed case: "ตรงข้ามโรงแรมมณเฑียร ริเวอร์ไซด์" reads as the closest
// stop to "เทอร์มินอล 21 พระราม 3" by straight line (149m) and used to win
// the ranking on that basis, but it's on the opposite side of ถนนพระราม 3
// from the destination (confirmed by a perpendicular side test against the
// road line) — the real walk is longer, and a same-side stop should win
// instead when one exists.
function walkPathMeters(from: LatLon, to: LatLon, lines: MapLine[]): number {
  const path = findWalkingPath(from, to, lines).points
  let total = 0
  for (let i = 1; i < path.length; i += 1) total += haversineMeters(path[i - 1], path[i])
  return total
}

function buildLeg(data: BusData, direction: Direction, boardPosition: number, alightPosition: number): Leg {
  return {
    route: data.routes[direction.routeIdx],
    direction,
    boardStopIdx: direction.stopIdxs[boardPosition],
    boardPosition,
    alightStopIdx: direction.stopIdxs[alightPosition],
    alightPosition,
    waitSec: waitSecondsFor(direction),
    rideSec: direction.offsetsSec[alightPosition] - direction.offsetsSec[boardPosition],
  }
}

function findDirectJourneys(
  data: BusData,
  originIdxs: Set<number>,
  originWalkMetersByStopIdx: Map<number, number>,
  destIdxs: Set<number>,
  destWalkMetersByStopIdx: Map<number, number>,
): DirectJourney[] {
  const journeys: DirectJourney[] = []
  for (const direction of data.directions) {
    for (let boardPosition = 0; boardPosition < direction.stopIdxs.length; boardPosition += 1) {
      const boardStopIdx = direction.stopIdxs[boardPosition]
      if (!originIdxs.has(boardStopIdx)) continue
      const originWalkMeters = originWalkMetersByStopIdx.get(boardStopIdx) ?? 0
      // Explore every stop the destination radius reaches on this ride, not
      // just the first — the closest-by-route-position stop isn't always the
      // closest-to-walk one (e.g. "เทอร์มินอล 21 พระราม 3" sits past
      // "สำนักงานเขตบางคอแหลม" but 100m closer to a nearby destination).
      // dedupeByOutcome + MAX_OPTIONS_PER_GROUP keep only the best few by
      // totalSec, so this doesn't flood the results.
      for (let alightPosition = boardPosition + 1; alightPosition < direction.stopIdxs.length; alightPosition += 1) {
        const alightStopIdx = direction.stopIdxs[alightPosition]
        if (!destIdxs.has(alightStopIdx)) continue
        const destinationWalkMeters = destWalkMetersByStopIdx.get(alightStopIdx) ?? 0
        const leg = buildLeg(data, direction, boardPosition, alightPosition)
        journeys.push({
          type: 'direct',
          leg,
          originWalkMeters,
          destinationWalkMeters,
          totalSec: walkSeconds(originWalkMeters) + leg.waitSec + leg.rideSec + walkSeconds(destinationWalkMeters),
        })
      }
    }
  }
  return journeys
}

function findTransferJourneys(
  data: BusData,
  index: SpatialIndex,
  originIdxs: Set<number>,
  originWalkMetersByStopIdx: Map<number, number>,
  destIdxs: Set<number>,
  destWalkMetersByStopIdx: Map<number, number>,
): TransferJourney[] {
  const journeys: TransferJourney[] = []
  const seen = new Set<string>()

  for (const firstDirection of data.directions) {
    for (let boardPosition = 0; boardPosition < firstDirection.stopIdxs.length; boardPosition += 1) {
      const boardStopIdx = firstDirection.stopIdxs[boardPosition]
      if (!originIdxs.has(boardStopIdx)) continue
      const originWalkMeters = originWalkMetersByStopIdx.get(boardStopIdx) ?? 0

      for (let transferAPos = boardPosition + 1; transferAPos < firstDirection.stopIdxs.length; transferAPos += 1) {
        const transferStopAIdx = firstDirection.stopIdxs[transferAPos]
        const transferStopA = data.stops[transferStopAIdx]
        const nearbyStopIdxs = index.stopsNear(transferStopA, TRANSFER_WALK_RADIUS_M)

        for (const transferStopBIdx of nearbyStopIdxs) {
          const candidates = index.directionsByStopIdx.get(transferStopBIdx) ?? []
          const transferDistanceM = haversineMeters(transferStopA, data.stops[transferStopBIdx])

          for (const { direction: secondDirection, position: transferBPos } of candidates) {
            if (secondDirection === firstDirection) continue
            if (transferBPos >= secondDirection.stopIdxs.length - 1) continue

            // Same reasoning as findDirectJourneys: don't stop at the first
            // stop the destination radius reaches on the second leg, since
            // it isn't always the one with the shortest final walk.
            for (let alightPosition = transferBPos + 1; alightPosition < secondDirection.stopIdxs.length; alightPosition += 1) {
              const alightStopIdx = secondDirection.stopIdxs[alightPosition]
              if (!destIdxs.has(alightStopIdx)) continue

              const dedupeKey = `${firstDirection.routeIdx}:${firstDirection.directionId}:${boardPosition}:${transferAPos}:${secondDirection.routeIdx}:${secondDirection.directionId}:${transferBPos}:${alightPosition}`
              if (seen.has(dedupeKey)) continue
              seen.add(dedupeKey)

              const destinationWalkMeters = destWalkMetersByStopIdx.get(alightStopIdx) ?? 0
              const firstLeg = buildLeg(data, firstDirection, boardPosition, transferAPos)
              const secondLeg = buildLeg(data, secondDirection, transferBPos, alightPosition)
              const transferWalkSec = walkSeconds(transferDistanceM)
              journeys.push({
                type: 'transfer',
                firstLeg,
                secondLeg,
                transferWalkSec,
                originWalkMeters,
                destinationWalkMeters,
                totalSec:
                  walkSeconds(originWalkMeters) +
                  firstLeg.waitSec +
                  firstLeg.rideSec +
                  transferWalkSec +
                  secondLeg.waitSec +
                  secondLeg.rideSec +
                  walkSeconds(destinationWalkMeters),
              })
            }
          }
        }
      }
    }
  }

  return journeys
}

export function findJourneys(
  data: BusData,
  origin: LatLon,
  destination: LatLon,
  mapLines?: MapLine[] | null,
): Journey[] {
  const index = getIndex(data)
  const walkMeters = (a: LatLon, b: LatLon) => (mapLines ? walkPathMeters(a, b, mapLines) : haversineMeters(a, b))

  const originStopIdxs = index.stopsNear(origin, ORIGIN_WALK_RADIUS_M)
  const originIdxs = new Set(originStopIdxs)
  const originWalkMetersByStopIdx = new Map(originStopIdxs.map((idx) => [idx, walkMeters(origin, data.stops[idx])]))
  const destStopIdxs = index.stopsNear(destination, DESTINATION_WALK_RADIUS_M)
  const destIdxs = new Set(destStopIdxs)
  const destWalkMetersByStopIdx = new Map(
    destStopIdxs.map((idx) => [idx, walkMeters(destination, data.stops[idx])]),
  )

  const journeys: Journey[] = [
    ...findDirectJourneys(data, originIdxs, originWalkMetersByStopIdx, destIdxs, destWalkMetersByStopIdx),
    ...findTransferJourneys(data, index, originIdxs, originWalkMetersByStopIdx, destIdxs, destWalkMetersByStopIdx),
  ]

  return journeys.sort((a, b) => a.totalSec - b.totalSec)
}

function boardNowLeg(journey: Journey): Leg {
  return journey.type === 'direct' ? journey.leg : journey.firstLeg
}

function outcomeKey(journey: Journey): string {
  if (journey.type === 'direct') return `direct:${journey.leg.alightStopIdx}`
  return `transfer:${journey.secondLeg.direction.routeIdx}:${journey.secondLeg.direction.directionId}:${journey.secondLeg.alightStopIdx}`
}

function dedupeByOutcome(journeys: Journey[]): Journey[] {
  const bestByOutcome = new Map<string, Journey>()
  for (const journey of journeys) {
    const key = outcomeKey(journey)
    const existing = bestByOutcome.get(key)
    if (!existing || journey.totalSec < existing.totalSec) bestByOutcome.set(key, journey)
  }
  return [...bestByOutcome.values()].sort((a, b) => a.totalSec - b.totalSec)
}

const MAX_OPTIONS_PER_GROUP = 5
const MAX_GROUPS = 8

export function groupByBoardNowDirection(journeys: Journey[]): BoardNowGroup[] {
  const groups = new Map<string, BoardNowGroup>()

  for (const journey of journeys) {
    const leg = boardNowLeg(journey)
    const key = `${leg.direction.routeIdx}::${leg.direction.directionId}::${leg.boardStopIdx}`
    const existing = groups.get(key)
    if (existing) {
      existing.options.push(journey)
    } else {
      groups.set(key, {
        key,
        route: leg.route,
        direction: leg.direction,
        boardStopIdx: leg.boardStopIdx,
        originWalkMeters: journey.originWalkMeters,
        options: [journey],
      })
    }
  }

  const result = [...groups.values()]
  for (const group of result) {
    group.options = dedupeByOutcome(group.options).slice(0, MAX_OPTIONS_PER_GROUP)
  }
  result.sort((a, b) => a.options[0].totalSec - b.options[0].totalSec)
  return result.slice(0, MAX_GROUPS)
}
