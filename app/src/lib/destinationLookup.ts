import { haversineMeters, walkSeconds, type LatLon } from './geo'
import { buildSpatialIndex, type SpatialIndex } from './spatialIndex'
import { crossesMajorRoad, findWalkingPath } from './svgMap'
import type { BusData, Direction, MapLine, Route } from './types'

// การข้ามถนนสายหลัก (ไม่มีสัญญาณไฟ หลายเลนรถวิ่งเร็ว) คือความยากลำบากจริง
// ที่ผู้โดยสารต้องชั่งใจ แม้ตัวเลือกนั้นจะเร็วกว่าตามนาฬิกาก็ตาม — โค้ดนี้
// ทำให้การจัดอันดับสะท้อนเรื่องนี้ด้วย แทนที่จะลดวินาทีดิบให้น้อยที่สุดอย่างเดียว
// คิดเป็นบทลงโทษด้านเวลา (ไม่ใช่ระยะทาง) เพื่อให้รวมเข้ากับ walkSeconds()
// ใน totalSec ได้อย่างกลมกลืน
const MAJOR_ROAD_CROSSING_PENALTY_SEC = 300

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
  originCrossesMajorRoad: boolean
  destinationWalkMeters: number
  destinationCrossesMajorRoad: boolean
  totalSec: number
}

export interface TransferJourney {
  type: 'transfer'
  firstLeg: Leg
  secondLeg: Leg
  transferWalkSec: number
  originWalkMeters: number
  originCrossesMajorRoad: boolean
  destinationWalkMeters: number
  destinationCrossesMajorRoad: boolean
  totalSec: number
}

export type Journey = DirectJourney | TransferJourney

export interface BoardNowGroup {
  key: string
  route: Route
  direction: Direction
  boardStopIdx: number
  originWalkMeters: number
  originCrossesMajorRoad: boolean
  options: Journey[]
}

// Note: เวลารอโดยเฉลี่ยของผู้โดยสารที่มาถึงป้ายแบบสุ่มคือครึ่งหนึ่งของ headway
// (ความถี่รถ) ถ้าไม่มีข้อมูล headway ให้ใช้ค่าคงที่สำรอง (DEFAULT_WAIT_SEC) แทน
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

// เส้นตรงจากป้ายไปยังจุดหมายอาจตัดผ่านถนนที่จริง ๆ แล้วข้ามตรงนั้นไม่ได้ —
// ระยะทางที่แท้จริงคือระยะที่ findWalkingPath (ซึ่งรู้จักถนนและสะพานลอย)
// จะให้เดินแทน
// เคสที่ยืนยันแล้ว: "ตรงข้ามโรงแรมมณเฑียร ริเวอร์ไซด์" อ่านค่าเป็นป้ายที่ใกล้
// "เทอร์มินอล 21 พระราม 3" ที่สุดตามเส้นตรง (149m) และเคยชนะการจัดอันดับ
// ด้วยเหตุนี้ แต่จริง ๆ แล้วมันอยู่คนละฝั่งถนนพระราม 3 กับจุดหมาย (ยืนยันด้วย
// การทดสอบฝั่งแนวตั้งฉากกับเส้นถนน) — ระยะเดินจริงไกลกว่า และป้ายที่อยู่ฝั่ง
// เดียวกับจุดหมายควรชนะแทน ถ้ามีป้ายแบบนั้นอยู่
function walkPathMeters(from: LatLon, to: LatLon, lines: MapLine[]): number {
  return findWalkingPath(from, to, lines).meters
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
  originCrossesByStopIdx: Map<number, boolean>,
  destIdxs: Set<number>,
  destWalkMetersByStopIdx: Map<number, number>,
  destCrossesByStopIdx: Map<number, boolean>,
): DirectJourney[] {
  const journeys: DirectJourney[] = []
  for (const direction of data.directions) {
    for (let boardPosition = 0; boardPosition < direction.stopIdxs.length; boardPosition += 1) {
      const boardStopIdx = direction.stopIdxs[boardPosition]
      if (!originIdxs.has(boardStopIdx)) continue
      const originWalkMeters = originWalkMetersByStopIdx.get(boardStopIdx) ?? 0
      const originCrossesMajorRoad = originCrossesByStopIdx.get(boardStopIdx) ?? false
      // สำรวจทุกป้ายที่อยู่ในรัศมีของจุดหมายตลอดสายนี้ ไม่ใช่แค่ป้ายแรกที่เจอ —
      // ป้ายที่ใกล้ที่สุดตามลำดับตำแหน่งบนสายไม่ได้แปลว่าเป็นป้ายที่เดินใกล้ที่สุดเสมอไป
      // (เช่น "เทอร์มินอล 21 พระราม 3" อยู่ถัดจาก "สำนักงานเขตบางคอแหลม"
      // แต่ใกล้จุดหมายบางแห่งกว่าถึง 100m)
      // dedupeByOutcome + MAX_OPTIONS_PER_GROUP จะเก็บไว้แค่ตัวเลือกที่ดีที่สุด
      // ไม่กี่ตัวตาม totalSec ทำให้ผลลัพธ์ไม่ท่วมท้นจนเกินไป
      for (let alightPosition = boardPosition + 1; alightPosition < direction.stopIdxs.length; alightPosition += 1) {
        const alightStopIdx = direction.stopIdxs[alightPosition]
        if (!destIdxs.has(alightStopIdx)) continue
        const destinationWalkMeters = destWalkMetersByStopIdx.get(alightStopIdx) ?? 0
        const destinationCrossesMajorRoad = destCrossesByStopIdx.get(alightStopIdx) ?? false
        const leg = buildLeg(data, direction, boardPosition, alightPosition)
        journeys.push({
          type: 'direct',
          leg,
          originWalkMeters,
          originCrossesMajorRoad,
          destinationWalkMeters,
          destinationCrossesMajorRoad,
          totalSec:
            walkSeconds(originWalkMeters) +
            leg.waitSec +
            leg.rideSec +
            walkSeconds(destinationWalkMeters) +
            (originCrossesMajorRoad ? MAJOR_ROAD_CROSSING_PENALTY_SEC : 0) +
            (destinationCrossesMajorRoad ? MAJOR_ROAD_CROSSING_PENALTY_SEC : 0),
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
  originCrossesByStopIdx: Map<number, boolean>,
  destIdxs: Set<number>,
  destWalkMetersByStopIdx: Map<number, number>,
  destCrossesByStopIdx: Map<number, boolean>,
): TransferJourney[] {
  const journeys: TransferJourney[] = []
  const seen = new Set<string>()

  for (const firstDirection of data.directions) {
    for (let boardPosition = 0; boardPosition < firstDirection.stopIdxs.length; boardPosition += 1) {
      const boardStopIdx = firstDirection.stopIdxs[boardPosition]
      if (!originIdxs.has(boardStopIdx)) continue
      const originWalkMeters = originWalkMetersByStopIdx.get(boardStopIdx) ?? 0
      const originCrossesMajorRoad = originCrossesByStopIdx.get(boardStopIdx) ?? false

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

            // เหตุผลเดียวกับ findDirectJourneys: อย่าหยุดที่ป้ายแรกที่รัศมี
            // ของจุดหมายไปถึงบนช่วงที่สอง เพราะมันไม่ได้เป็นป้ายที่เดินสั้นที่สุดเสมอไป
            for (let alightPosition = transferBPos + 1; alightPosition < secondDirection.stopIdxs.length; alightPosition += 1) {
              const alightStopIdx = secondDirection.stopIdxs[alightPosition]
              if (!destIdxs.has(alightStopIdx)) continue

              // Note: กันไม่ให้คู่ป้ายเปลี่ยนรถ (transferStopA/B) ที่ต่างกันแต่ให้
              // ผลลัพธ์การเดินทางเหมือนกันทุกช่วง (ขึ้น/เปลี่ยน/ลง จุดเดียวกัน)
              // ถูกนับซ้ำเป็นสองรายการ
              const dedupeKey = `${firstDirection.routeIdx}:${firstDirection.directionId}:${boardPosition}:${transferAPos}:${secondDirection.routeIdx}:${secondDirection.directionId}:${transferBPos}:${alightPosition}`
              if (seen.has(dedupeKey)) continue
              seen.add(dedupeKey)

              const destinationWalkMeters = destWalkMetersByStopIdx.get(alightStopIdx) ?? 0
              const destinationCrossesMajorRoad = destCrossesByStopIdx.get(alightStopIdx) ?? false
              const firstLeg = buildLeg(data, firstDirection, boardPosition, transferAPos)
              const secondLeg = buildLeg(data, secondDirection, transferBPos, alightPosition)
              const transferWalkSec = walkSeconds(transferDistanceM)
              journeys.push({
                type: 'transfer',
                firstLeg,
                secondLeg,
                transferWalkSec,
                originWalkMeters,
                originCrossesMajorRoad,
                destinationWalkMeters,
                destinationCrossesMajorRoad,
                totalSec:
                  walkSeconds(originWalkMeters) +
                  firstLeg.waitSec +
                  firstLeg.rideSec +
                  transferWalkSec +
                  secondLeg.waitSec +
                  secondLeg.rideSec +
                  walkSeconds(destinationWalkMeters) +
                  (originCrossesMajorRoad ? MAJOR_ROAD_CROSSING_PENALTY_SEC : 0) +
                  (destinationCrossesMajorRoad ? MAJOR_ROAD_CROSSING_PENALTY_SEC : 0),
              })
            }
          }
        }
      }
    }
  }

  return journeys
}

export interface DirectWalk {
  meters: number
  crossesMajorRoad: boolean
  sec: number
}

// คุ้มที่จะเปรียบเทียบตัวเลือกรถเมล์กับการเดินตรงไปเลย ก็ต่อเมื่อจุดหมายอยู่
// ในระยะเดียวกับที่ผู้โดยสารยอมเดินไปขึ้นรถอยู่แล้ว — การใช้ ORIGIN_WALK_RADIUS_M
// ซ้ำแบบนี้ช่วยไม่ให้มันไปกลบการโดยสารระยะไกลที่ยังมีประโยชน์จริง
// ซึ่งโมเดลเดินความเร็วคงที่แบบหยาบ ๆ อาจดูเร็วกว่าในทางทฤษฎี
// (เทียบกับการรอรถที่มี headway ยาว) ทั้งที่ในความเป็นจริงไม่มีใครเดินไกล
// เป็นกิโลกว่าแทนการนั่งรถ
const DIRECT_WALK_MAX_M = ORIGIN_WALK_RADIUS_M

// เส้นฐานที่ทุกเส้นทางรถเมล์ต้องถูกวัดเทียบด้วย: ถ้าต้นทางกับจุดหมายอยู่ใกล้กัน
// พอที่เดินตรงไปเลยจะเร็วกว่าการรอ การนั่ง และการเดินต่อรถของตัวเลือกรถเมล์ใด ๆ
// ก็ไม่ควรมีตัวเลือกรถเมล์ใดชนะการเดินตรงนี้ได้ ถ้าไม่มีเส้นฐานนี้ ป้ายที่บังเอิญ
// อยู่ในรัศมีเดินได้ทั้งของต้นทางและจุดหมาย (กรณีต้นทาง/จุดหมายอยู่ใกล้กันมาก
// เช่น ห่างกันแค่ ~190m) อาจสร้าง "เส้นทาง" ที่ขึ้นรถใกล้จุดหมาย นั่งออกไป
// แล้ววนกลับมาลงใกล้ต้นทาง — ซึ่งถูกต้องตามข้อมูลก็จริง แต่ช้ากว่าการเดินตรง ๆ อย่างแน่นอน
export function findDirectWalk(
  origin: LatLon,
  destination: LatLon,
  mapLines?: MapLine[] | null,
): DirectWalk {
  const meters = mapLines ? walkPathMeters(origin, destination, mapLines) : haversineMeters(origin, destination)
  const crosses = mapLines ? crossesMajorRoad(origin, destination, mapLines) : false
  return {
    meters,
    crossesMajorRoad: crosses,
    sec: walkSeconds(meters) + (crosses ? MAJOR_ROAD_CROSSING_PENALTY_SEC : 0),
  }
}

export function findJourneys(
  data: BusData,
  origin: LatLon,
  destination: LatLon,
  mapLines?: MapLine[] | null,
): Journey[] {
  const index = getIndex(data)
  const walkMeters = (a: LatLon, b: LatLon) => (mapLines ? walkPathMeters(a, b, mapLines) : haversineMeters(a, b))
  const crosses = (a: LatLon, b: LatLon) => (mapLines ? crossesMajorRoad(a, b, mapLines) : false)
  const directWalk = findDirectWalk(origin, destination, mapLines)
  const directWalkSec = directWalk.meters <= DIRECT_WALK_MAX_M ? directWalk.sec : Infinity

  const originStopIdxs = index.stopsNear(origin, ORIGIN_WALK_RADIUS_M)
  const originIdxs = new Set(originStopIdxs)
  const originWalkMetersByStopIdx = new Map(originStopIdxs.map((idx) => [idx, walkMeters(origin, data.stops[idx])]))
  const originCrossesByStopIdx = new Map(originStopIdxs.map((idx) => [idx, crosses(origin, data.stops[idx])]))
  const destStopIdxs = index.stopsNear(destination, DESTINATION_WALK_RADIUS_M)
  const destIdxs = new Set(destStopIdxs)
  const destWalkMetersByStopIdx = new Map(
    destStopIdxs.map((idx) => [idx, walkMeters(destination, data.stops[idx])]),
  )
  const destCrossesByStopIdx = new Map(destStopIdxs.map((idx) => [idx, crosses(destination, data.stops[idx])]))

  const journeys: Journey[] = [
    ...findDirectJourneys(
      data,
      originIdxs,
      originWalkMetersByStopIdx,
      originCrossesByStopIdx,
      destIdxs,
      destWalkMetersByStopIdx,
      destCrossesByStopIdx,
    ),
    ...findTransferJourneys(
      data,
      index,
      originIdxs,
      originWalkMetersByStopIdx,
      originCrossesByStopIdx,
      destIdxs,
      destWalkMetersByStopIdx,
      destCrossesByStopIdx,
    ),
  ]

  return journeys.filter((j) => j.totalSec < directWalkSec).sort((a, b) => a.totalSec - b.totalSec)
}

function boardNowLeg(journey: Journey): Leg {
  return journey.type === 'direct' ? journey.leg : journey.firstLeg
}

// Note: ระบุ "ผลลัพธ์" ของเส้นทางด้วยป้ายลงสุดท้าย (และสาย/ทิศของช่วงที่สอง
// ถ้าเป็นการต่อรถ) โดยไม่สนใจว่าขึ้นจากป้ายไหน — ใช้เป็นกุญแจให้ dedupeByOutcome
// เลือกเก็บไว้แค่ตัวเลือกที่เร็วที่สุดต่อหนึ่งผลลัพธ์ปลายทาง
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
        originCrossesMajorRoad: journey.originCrossesMajorRoad,
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
