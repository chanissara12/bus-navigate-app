/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findJourneys, groupByBoardNowDirection } from './destinationLookup'
import type { BusData } from './types'

function loadRealData(): BusData {
  const path = join(process.cwd(), 'public', 'data', 'bus-data.json')
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
})
