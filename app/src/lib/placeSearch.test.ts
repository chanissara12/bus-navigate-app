import { describe, expect, it } from 'vitest'
import { searchPlaces } from './placeSearch'
import type { MapBackground } from './types'

function background(places: MapBackground['places']): MapBackground {
  return { generatedAt: '', lines: [], labels: [], places }
}

describe('searchPlaces', () => {
  it('matches a place whose name contains the query, case-insensitively', () => {
    const bg = background([
      { lat: 13.75, lon: 100.53, name: 'สยามพารากอน', kind: 'mall' },
      { lat: 13.76, lon: 100.54, name: 'Central World', kind: 'mall' },
    ])
    expect(searchPlaces(bg, 'สยาม', 10).map((p) => p.name)).toEqual(['สยามพารากอน'])
    expect(searchPlaces(bg, 'central', 10).map((p) => p.name)).toEqual(['Central World'])
  })

  it('returns nothing for a blank query', () => {
    const bg = background([{ lat: 13.75, lon: 100.53, name: 'สยามพารากอน', kind: 'mall' }])
    expect(searchPlaces(bg, '  ', 10)).toEqual([])
  })

  it('ranks a name that starts with the query above one that only contains it', () => {
    const bg = background([
      { lat: 13.75, lon: 100.53, name: 'ตลาดนัดจตุจักร', kind: 'market' },
      { lat: 13.76, lon: 100.54, name: 'จตุจักร พลาซ่า', kind: 'mall' },
    ])
    const result = searchPlaces(bg, 'จตุจักร', 10)
    expect(result[0].name).toBe('จตุจักร พลาซ่า')
  })

  it('caps the number of results', () => {
    const bg = background(
      Array.from({ length: 20 }, (_, i) => ({ lat: 13.75, lon: 100.53, name: `ตลาด ${i}`, kind: 'market' })),
    )
    expect(searchPlaces(bg, 'ตลาด', 5)).toHaveLength(5)
  })
})
