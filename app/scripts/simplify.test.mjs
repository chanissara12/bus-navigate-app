import { describe, expect, it } from 'vitest'
import { douglasPeucker, haversineMeters, lineLengthMeters } from './simplify.mjs'

describe('douglasPeucker (build script copy)', () => {
  it('keeps a straight line down to its two endpoints', () => {
    const points = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0.001 },
      { lat: 0, lon: 0.002 },
    ]
    expect(douglasPeucker(points, 1)).toEqual([points[0], points[2]])
  })
})

describe('lineLengthMeters', () => {
  it('sums segment lengths', () => {
    const points = [{ lat: 0, lon: 0 }, { lat: 0, lon: 0.001 }]
    expect(lineLengthMeters(points)).toBeCloseTo(111.32, 0)
  })
})

describe('haversineMeters', () => {
  it('is roughly zero for the same point', () => {
    const p = { lat: 13.75, lon: 100.5 }
    expect(haversineMeters(p, p)).toBe(0)
  })
})
