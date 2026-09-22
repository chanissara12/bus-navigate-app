/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findDirectWalk, findJourneys, groupByBoardNowDirection } from './destinationLookup'
import { decodePackedBusData } from './packedCodec'
import type { BusData, MapBackground, PackedBusData } from './types'

function loadRealData(): BusData {
  const path = join(process.cwd(), 'public', 'data', 'bus-data.json')
  const packed: PackedBusData = JSON.parse(readFileSync(path, 'utf-8'))
  return decodePackedBusData(packed)
}

function loadRealMapBackground(): MapBackground {
  const path = join(process.cwd(), 'public', 'data', 'map-background.json')
  return JSON.parse(readFileSync(path, 'utf-8'))
}

describe('findJourneys against the real Namtang extract', () => {
  it('finds journeys from อนุสาวรีย์ชัยสมรภูมิ to สยามสแควร์ quickly', () => {
    const data = loadRealData()
    const origin = { lat: 13.764173061619685, lon: 100.53854805892472 }
    const destination = { lat: 13.745601632669874, lon: 100.53346797823906 }

    const start = Date.now()
    const journeys = findJourneys(data, origin, destination)
    const elapsedMs = Date.now() - start

    expect(elapsedMs).toBeLessThan(5000)
    expect(journeys.length).toBeGreaterThan(0)
    expect(journeys.some((j) => j.type === 'direct')).toBe(true)

    const groups = groupByBoardNowDirection(journeys)
    expect(groups.length).toBeGreaterThan(0)
  })

  it('stays fast and reports an honest, routed walk for the confirmed "wrong side of the road" pair', () => {
    const background = loadRealMapBackground()
    // ตรงข้ามทรี ออน ธรี, boarding towards เทอร์มินอล 21 พระราม 3 — these two
    // points turn out to be only ~190m apart by real routed distance, which
    // is exactly why no bus should win here (see the next test below): the
    // original complaint was about a misleading straight-line walk number,
    // not about needing a bus for what's actually a short walk.
    const origin = { lat: 13.689953, lon: 100.504406 }
    const destination = { lat: 13.6896848, lon: 100.5056348 }

    const start = Date.now()
    const walk = findDirectWalk(origin, destination, background.lines)
    const elapsedMs = Date.now() - start

    expect(elapsedMs).toBeLessThan(5000)
    // the routed distance should reflect real walking, not the misleading
    // ~149m straight line to the confirmed opposite-side stop
    expect(walk.meters).not.toBeCloseTo(149, 0)
    expect(walk.meters).toBeLessThan(400)
  })

  it('recommends walking over the bus when origin and destination are this close together', () => {
    const data = loadRealData()
    const background = loadRealMapBackground()
    const origin = { lat: 13.689953, lon: 100.504406 }
    const destination = { lat: 13.6896848, lon: 100.5056348 }

    const journeys = findJourneys(data, origin, destination, background.lines)

    // every candidate bus journey here would board near the destination and
    // alight back near the origin (or similar) — strictly slower than the
    // ~190m walk between them, so none should be surfaced.
    expect(journeys).toHaveLength(0)
  })
})
