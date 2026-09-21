import { describe, expect, it } from 'vitest'
import { dedupeDirections } from './dedupeDirections.mjs'

function route(newCode) {
  return { id: newCode, agency: 'BMTA', newCode, oldCode: null, longNameTh: '', longNameEn: '' }
}

function direction(routeIdx, headsignTh, stopCount) {
  return {
    routeIdx,
    directionId: 0,
    headsignTh,
    headsignEn: headsignTh,
    stopIdxs: Array.from({ length: stopCount }, (_, i) => i),
    offsetsSec: Array.from({ length: stopCount }, (_, i) => i * 60),
    headwaySec: 600,
  }
}

describe('dedupeDirections', () => {
  it('drops a direction that duplicates an earlier one by (route number, headsign, stop count)', () => {
    const routes = [route('1-8'), route('1-8')] // two feed route_ids sharing the same short name
    const directions = [direction(0, 'สนามหลวง', 37), direction(1, 'สนามหลวง', 37)]

    const result = dedupeDirections(routes, directions)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(directions[0])
  })

  it('keeps directions that differ in stop count even with the same route and headsign', () => {
    const routes = [route('1-8'), route('1-8')]
    const directions = [direction(0, 'สนามหลวง', 37), direction(1, 'สนามหลวง', 40)]

    expect(dedupeDirections(routes, directions)).toHaveLength(2)
  })

  it('keeps directions for different routes even with the same headsign and stop count', () => {
    const routes = [route('1-8'), route('3-42')]
    const directions = [direction(0, 'สนามหลวง', 37), direction(1, 'สนามหลวง', 37)]

    expect(dedupeDirections(routes, directions)).toHaveLength(2)
  })
})
