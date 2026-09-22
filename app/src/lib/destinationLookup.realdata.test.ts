/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findJourneys, groupByBoardNowDirection } from './destinationLookup'
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

  it('stays fast and correctly avoids the confirmed "wrong side of the road" case with real map data', () => {
    const data = loadRealData()
    const background = loadRealMapBackground()
    // ตรงข้ามทรี ออน ธรี, boarding towards เทอร์มินอล 21 พระราม 3
    const origin = { lat: 13.689953, lon: 100.504406 }
    const destination = { lat: 13.6896848, lon: 100.5056348 }

    const start = Date.now()
    const journeys = findJourneys(data, origin, destination, background.lines)
    const elapsedMs = Date.now() - start

    expect(elapsedMs).toBeLessThan(5000)
    expect(journeys.length).toBeGreaterThan(0)
    // the best journey's real walk should reflect an actual routed distance,
    // not the raw ~149m straight line to the confirmed opposite-side stop
    expect(journeys[0].destinationWalkMeters).not.toBeCloseTo(149, 0)
  })
})
