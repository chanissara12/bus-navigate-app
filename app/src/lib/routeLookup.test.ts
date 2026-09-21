import { describe, expect, it } from 'vitest'
import { boardableDirectionsAtStop, findCurrentPositionOnDirection, findNearestStop, hasNoReturnData } from './routeLookup'
import type { BusData, Direction } from './types'

function makeDirection(overrides: Partial<Direction>): Direction {
  return {
    routeIdx: 0,
    directionId: 0,
    headsignTh: '',
    headsignEn: '',
    stopIdxs: [0, 1, 2, 3, 4],
    offsetsSec: [0, 60, 120, 180, 240],
    headwaySec: 600,
    shapeCoords: [],
    ...overrides,
  }
}

function makeData(): BusData {
  return {
    generatedAt: '',
    feedVersion: null,
    stops: [
      { id: 'A', nameTh: 'A', nameEn: 'A', lat: 0, lon: 0 },
      { id: 'B', nameTh: 'B', nameEn: 'B', lat: 0, lon: 0.001 },
      { id: 'C', nameTh: 'C', nameEn: 'C', lat: 0, lon: 0.01 },
    ],
    routes: [{ id: 'r1', agency: 'BMTA', newCode: '1-1', oldCode: '1', longNameTh: '', longNameEn: '' }],
    directions: [
      {
        routeIdx: 0,
        directionId: 0,
        headsignTh: 'C',
        headsignEn: 'C',
        stopIdxs: [0, 1, 2],
        offsetsSec: [0, 60, 120],
        headwaySec: 600,
        shapeCoords: [],
      },
      {
        routeIdx: 0,
        directionId: 1,
        headsignTh: 'terminates at B',
        headsignEn: 'terminates at B',
        stopIdxs: [2, 1],
        offsetsSec: [0, 60],
        headwaySec: 600,
        shapeCoords: [],
      },
    ],
  }
}

describe('boardableDirectionsAtStop', () => {
  it('finds a direction passing through the stop, not at its last position', () => {
    const data = makeData()
    const result = boardableDirectionsAtStop(data, 'A')
    expect(result).toHaveLength(1)
    expect(result[0].direction.headsignTh).toBe('C')
  })

  it('excludes a direction that terminates at this stop', () => {
    const data = makeData()
    const result = boardableDirectionsAtStop(data, 'B')
    const headsigns = result.map((r) => r.direction.headsignTh)
    expect(headsigns).toContain('C')
    expect(headsigns).not.toContain('terminates at B')
  })

  it('returns an empty list for an unknown stop id', () => {
    const data = makeData()
    expect(boardableDirectionsAtStop(data, 'ZZZ')).toEqual([])
  })
})

describe('findNearestStop', () => {
  it('finds the closest stop within the radius', () => {
    const data = makeData()
    const result = findNearestStop(data, { lat: 0, lon: 0.0009 }, 200)
    expect(result?.stop.id).toBe('B')
  })

  it('returns null when nothing is within the radius', () => {
    const data = makeData()
    expect(findNearestStop(data, { lat: 5, lon: 5 }, 200)).toBeNull()
  })
})

describe('hasNoReturnData', () => {
  it('is false when the route has a second direction with a normal-length trip', () => {
    const outbound = makeDirection({ directionId: 0 })
    const inbound = makeDirection({ directionId: 1 })
    const data = { ...makeData(), directions: [outbound, inbound] }
    expect(hasNoReturnData(data, outbound)).toBe(false)
  })

  it('is true when the feed has only one direction for the route', () => {
    const onlyDirection = makeDirection({ directionId: 0 })
    const data = { ...makeData(), directions: [onlyDirection] }
    expect(hasNoReturnData(data, onlyDirection)).toBe(true)
  })

  it('is true for a short trip even when a return direction exists', () => {
    const shortOutbound = makeDirection({ directionId: 0, stopIdxs: [0, 1, 2], offsetsSec: [0, 60, 120] })
    const inbound = makeDirection({ directionId: 1 })
    const data = { ...makeData(), directions: [shortOutbound, inbound] }
    expect(hasNoReturnData(data, shortOutbound)).toBe(true)
  })
})

describe('findCurrentPositionOnDirection', () => {
  it('finds the position of the nearest stop on the direction', () => {
    const data = makeData()
    const direction = data.directions[0]
    const position = findCurrentPositionOnDirection(data, direction, { lat: 0, lon: 0.0009 }, 200)
    expect(position).toBe(1)
  })

  it('returns null when no stop on the direction is within radius', () => {
    const data = makeData()
    const direction = data.directions[0]
    expect(findCurrentPositionOnDirection(data, direction, { lat: 5, lon: 5 }, 200)).toBeNull()
  })
})
