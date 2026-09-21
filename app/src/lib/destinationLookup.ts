import { haversineMeters, walkSeconds, type LatLon } from './geo'
import { buildSpatialIndex, type SpatialIndex } from './spatialIndex'
import type { BusData, Direction, Route } from './types'

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
  totalSec: number
}

export interface TransferJourney {
  type: 'transfer'
  firstLeg: Leg
  secondLeg: Leg
  transferWalkSec: number
  totalSec: number
}

export type Journey = DirectJourney | TransferJourney

export interface BoardNowGroup {
  key: string
  route: Route
  direction: Direction
  boardStopIdx: number
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

function findDirectJourneys(data: BusData, originIdxs: Set<number>, destIdxs: Set<number>): DirectJourney[] {
  const journeys: DirectJourney[] = []
  for (const direction of data.directions) {
    for (let boardPosition = 0; boardPosition < direction.stopIdxs.length; boardPosition += 1) {
      if (!originIdxs.has(direction.stopIdxs[boardPosition])) continue
      for (let alightPosition = boardPosition + 1; alightPosition < direction.stopIdxs.length; alightPosition += 1) {
        if (!destIdxs.has(direction.stopIdxs[alightPosition])) continue
        const leg = buildLeg(data, direction, boardPosition, alightPosition)
        journeys.push({ type: 'direct', leg, totalSec: leg.waitSec + leg.rideSec })
        break
      }
    }
  }
  return journeys
}

function findTransferJourneys(
  data: BusData,
  index: SpatialIndex,
  originIdxs: Set<number>,
  destIdxs: Set<number>,
): TransferJourney[] {
  const journeys: TransferJourney[] = []
  const seen = new Set<string>()

  for (const firstDirection of data.directions) {
    for (let boardPosition = 0; boardPosition < firstDirection.stopIdxs.length; boardPosition += 1) {
      if (!originIdxs.has(firstDirection.stopIdxs[boardPosition])) continue

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

            for (let alightPosition = transferBPos + 1; alightPosition < secondDirection.stopIdxs.length; alightPosition += 1) {
              if (!destIdxs.has(secondDirection.stopIdxs[alightPosition])) continue

              const dedupeKey = `${firstDirection.routeIdx}:${firstDirection.directionId}:${boardPosition}:${transferAPos}:${secondDirection.routeIdx}:${secondDirection.directionId}:${transferBPos}:${alightPosition}`
              if (seen.has(dedupeKey)) break
              seen.add(dedupeKey)

              const firstLeg = buildLeg(data, firstDirection, boardPosition, transferAPos)
              const secondLeg = buildLeg(data, secondDirection, transferBPos, alightPosition)
              const transferWalkSec = walkSeconds(transferDistanceM)
              journeys.push({
                type: 'transfer',
                firstLeg,
                secondLeg,
                transferWalkSec,
                totalSec: firstLeg.waitSec + firstLeg.rideSec + transferWalkSec + secondLeg.waitSec + secondLeg.rideSec,
              })
              break
            }
          }
        }
      }
    }
  }

  return journeys
}

export function findJourneys(data: BusData, origin: LatLon, destination: LatLon): Journey[] {
  const index = getIndex(data)
  const originIdxs = new Set(index.stopsNear(origin, ORIGIN_WALK_RADIUS_M))
  const destIdxs = new Set(index.stopsNear(destination, DESTINATION_WALK_RADIUS_M))

  const journeys: Journey[] = [
    ...findDirectJourneys(data, originIdxs, destIdxs),
    ...findTransferJourneys(data, index, originIdxs, destIdxs),
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
