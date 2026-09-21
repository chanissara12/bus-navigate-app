import { describe, expect, it } from 'vitest'
import {
  boundingBoxWithMargin,
  filterLabelsForDisplay,
  filterPlacesForDisplay,
  lineIntersectsBbox,
  projectPoint,
  sliceShapeFromNearestPoint,
} from './svgMap'
import type { MapLabel, MapLine, MapPlace } from './types'

describe('boundingBoxWithMargin', () => {
  it('covers all points exactly with zero margin', () => {
    const bbox = boundingBoxWithMargin(
      [
        { lat: 13.7, lon: 100.5 },
        { lat: 13.8, lon: 100.6 },
      ],
      0,
    )
    expect(bbox).toEqual({ minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 })
  })

  it('expands by the given margin ratio on each side', () => {
    const bbox = boundingBoxWithMargin(
      [
        { lat: 13.7, lon: 100.5 },
        { lat: 13.8, lon: 100.6 },
      ],
      0.1,
    )
    // height 0.1 deg, 10% margin added to each side -> 0.01 deg padding each side
    expect(bbox.minLat).toBeCloseTo(13.69, 5)
    expect(bbox.maxLat).toBeCloseTo(13.81, 5)
  })

  it('still produces a usable box for a single point', () => {
    const bbox = boundingBoxWithMargin([{ lat: 13.7, lon: 100.5 }], 0.1)
    expect(bbox.maxLat).toBeGreaterThan(bbox.minLat)
    expect(bbox.maxLon).toBeGreaterThan(bbox.minLon)
  })
})

describe('projectPoint', () => {
  it('places the north-west corner at the SVG origin', () => {
    const bbox = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }
    const p = projectPoint({ lat: 13.8, lon: 100.5 }, bbox)
    expect(p.x).toBeCloseTo(0, 3)
    expect(p.y).toBeCloseTo(0, 3)
  })

  it('places south increasingly further down (larger y) than north', () => {
    const bbox = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }
    const north = projectPoint({ lat: 13.8, lon: 100.55 }, bbox)
    const south = projectPoint({ lat: 13.7, lon: 100.55 }, bbox)
    expect(south.y).toBeGreaterThan(north.y)
  })
})

describe('lineIntersectsBbox', () => {
  const bbox = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }

  it('is true when a line passes through the box', () => {
    const line: MapLine = { kind: 'road', points: [[13.75, 100.4], [13.75, 100.55]], name: null, priority: 3 }
    expect(lineIntersectsBbox(line, bbox)).toBe(true)
  })

  it('is false when a line is entirely outside the box', () => {
    const line: MapLine = { kind: 'road', points: [[14.0, 100.9], [14.1, 100.95]], name: null, priority: 3 }
    expect(lineIntersectsBbox(line, bbox)).toBe(false)
  })
})

describe('filterLabelsForDisplay', () => {
  const bbox = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }

  it('excludes labels outside the box', () => {
    const labels: MapLabel[] = [{ lat: 20, lon: 100, name: 'far away', priority: 0 }]
    expect(filterLabelsForDisplay(labels, bbox, 6)).toEqual([])
  })

  it('keeps only one label per distinct name', () => {
    const labels: MapLabel[] = [
      { lat: 13.75, lon: 100.55, name: 'ถนนพระราม 1', priority: 1 },
      { lat: 13.76, lon: 100.56, name: 'ถนนพระราม 1', priority: 1 },
    ]
    expect(filterLabelsForDisplay(labels, bbox, 6)).toHaveLength(1)
  })

  it('prefers higher priority (lower number) labels and respects the cap', () => {
    const labels: MapLabel[] = [
      { lat: 13.75, lon: 100.55, name: 'road', priority: 3 },
      { lat: 13.75, lon: 100.56, name: 'river', priority: 0 },
    ]
    const result = filterLabelsForDisplay(labels, bbox, 1)
    expect(result).toEqual([labels[1]])
  })
})

describe('sliceShapeFromNearestPoint', () => {
  it('drops the portion of the shape before the nearest point to the given stop', () => {
    const shape: [number, number][] = [
      [13.7, 100.5],
      [13.71, 100.51],
      [13.72, 100.52],
      [13.73, 100.53],
    ]
    const result = sliceShapeFromNearestPoint(shape, { lat: 13.712, lon: 100.511 })
    expect(result).toEqual([
      [13.71, 100.51],
      [13.72, 100.52],
      [13.73, 100.53],
    ])
  })

  it('returns the whole shape when the nearest point is the first one', () => {
    const shape: [number, number][] = [
      [13.7, 100.5],
      [13.71, 100.51],
    ]
    expect(sliceShapeFromNearestPoint(shape, { lat: 13.7, lon: 100.5 })).toEqual(shape)
  })

  it('picks the occurrence near the expected fraction on a loop that revisits the same spot', () => {
    // a loop shape that passes near (13.70, 100.50) once early (index 1) and once
    // again near the end (index 8) — simulating a วนซ้าย/วนขวา route.
    const shape: [number, number][] = [
      [13.699, 100.499],
      [13.7, 100.5], // near-duplicate #1, early in the loop
      [13.72, 100.52],
      [13.74, 100.54],
      [13.76, 100.56],
      [13.78, 100.58],
      [13.76, 100.56],
      [13.72, 100.52],
      [13.7, 100.5], // near-duplicate #2, late in the loop
      [13.699, 100.499],
    ]
    const point = { lat: 13.7, lon: 100.5 }

    // early in the trip -> should snap to index 1, not index 8
    const early = sliceShapeFromNearestPoint(shape, point, 0.1)
    expect(early[0]).toEqual(shape[1])

    // late in the trip -> should snap to index 8, not index 1
    const late = sliceShapeFromNearestPoint(shape, point, 0.9)
    expect(late[0]).toEqual(shape[8])
  })
})

describe('filterPlacesForDisplay', () => {
  const bbox = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }

  it('excludes places outside the box and respects the cap', () => {
    const places: MapPlace[] = [
      { lat: 13.75, lon: 100.55, name: 'A', kind: 'transit' },
      { lat: 20, lon: 100, name: 'B', kind: 'mall' },
    ]
    expect(filterPlacesForDisplay(places, bbox, 7)).toEqual([places[0]])
  })
})
