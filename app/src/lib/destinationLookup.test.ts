import { describe, expect, it } from 'vitest'
import { findJourneys, groupByBoardNowDirection, ORIGIN_WALK_RADIUS_M, DESTINATION_WALK_RADIUS_M } from './destinationLookup'
import type { BusData } from './types'

// Stops laid out roughly 100m apart along the equator so haversine distances are easy to reason about.
const METERS_PER_DEGREE = 111320
function stopAt(id: string, offsetMeters: number) {
  return { id, nameTh: id, nameEn: id, lat: 0, lon: offsetMeters / METERS_PER_DEGREE }
}

function makeData(): BusData {
  return {
    generatedAt: '',
    feedVersion: null,
    stops: [
      stopAt('origin', 0), // 0
      stopAt('mid', 500), // 1
      stopAt('dest-far', 2000), // 2
      stopAt('transfer', 500), // 3 (same spot as mid, different stop_id, far from destination)
      stopAt('dest-near', 2000), // 4
    ],
    routes: [
      { id: 'slow-direct', agency: 'BMTA', newCode: '1-1', oldCode: null, longNameTh: '', longNameEn: '' },
      { id: 'leg-a', agency: 'BMTA', newCode: '2-2', oldCode: null, longNameTh: '', longNameEn: '' },
      { id: 'leg-b', agency: 'BMTA', newCode: '3-3', oldCode: null, longNameTh: '', longNameEn: '' },
    ],
    directions: [
      {
        // slow direct ride: origin -> dest-far, takes 40 minutes
        routeIdx: 0,
        directionId: 0,
        headsignTh: 'slow',
        headsignEn: 'slow',
        stopIdxs: [0, 1, 2],
        offsetsSec: [0, 1200, 2400],
        headwaySec: 600,
        shapeCoords: [],
      },
      {
        // leg A: origin -> transfer, 5 minutes
        routeIdx: 1,
        directionId: 0,
        headsignTh: 'leg-a',
        headsignEn: 'leg-a',
        stopIdxs: [0, 3],
        offsetsSec: [0, 300],
        headwaySec: 300,
        shapeCoords: [],
      },
      {
        // leg B: transfer -> dest-near, 5 minutes
        routeIdx: 2,
        directionId: 0,
        headsignTh: 'leg-b',
        headsignEn: 'leg-b',
        stopIdxs: [3, 4],
        offsetsSec: [0, 300],
        headwaySec: 300,
        shapeCoords: [],
      },
    ],
  }
}

describe('findJourneys', () => {
  it('finds a direct ride to a stop within the destination walk radius', () => {
    const data = makeData()
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 2000 / METERS_PER_DEGREE })
    expect(journeys.some((j) => j.type === 'direct')).toBe(true)
  })

  it('finds a one-transfer journey', () => {
    const data = makeData()
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 2000 / METERS_PER_DEGREE })
    expect(journeys.some((j) => j.type === 'transfer')).toBe(true)
  })

  it('ranks the faster transfer ahead of the slower direct ride', () => {
    const data = makeData()
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 2000 / METERS_PER_DEGREE })
    expect(journeys[0].type).toBe('transfer')
  })

  it('exposes the agreed walk radii', () => {
    expect(ORIGIN_WALK_RADIUS_M).toBe(400)
    expect(DESTINATION_WALK_RADIUS_M).toBe(800)
  })
})

describe('groupByBoardNowDirection', () => {
  it('groups journeys by the bus you would board right now', () => {
    const data = makeData()
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 2000 / METERS_PER_DEGREE })
    const groups = groupByBoardNowDirection(journeys)
    expect(groups.length).toBeGreaterThan(0)
    for (const group of groups) {
      expect(group.options.length).toBeGreaterThan(0)
    }
  })
})
