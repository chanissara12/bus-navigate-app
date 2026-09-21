import { describe, expect, it } from 'vitest'
import { douglasPeucker } from './simplify'
import type { LatLon } from './geo'

describe('douglasPeucker', () => {
  it('keeps a straight line down to its two endpoints', () => {
    const points: LatLon[] = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0.001 },
      { lat: 0, lon: 0.002 },
      { lat: 0, lon: 0.003 },
    ]
    expect(douglasPeucker(points, 1)).toEqual([points[0], points[3]])
  })

  it('keeps a point that deviates further than the tolerance', () => {
    const points: LatLon[] = [
      { lat: 0, lon: 0 },
      { lat: 0.01, lon: 0.001 }, // a spike far off the line, in degrees
      { lat: 0, lon: 0.002 },
    ]
    expect(douglasPeucker(points, 5)).toEqual(points)
  })

  it('drops a point within tolerance of the line between its neighbours', () => {
    const points: LatLon[] = [
      { lat: 0, lon: 0 },
      { lat: 0.0000001, lon: 0.001 }, // ~11mm off the line
      { lat: 0, lon: 0.002 },
    ]
    expect(douglasPeucker(points, 1)).toEqual([points[0], points[2]])
  })

  it('returns short inputs unchanged', () => {
    const points: LatLon[] = [{ lat: 0, lon: 0 }]
    expect(douglasPeucker(points, 30)).toEqual(points)
  })
})
