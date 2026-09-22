import { describe, expect, it } from 'vitest'
import {
  bboxAroundCenter,
  bboxFromView,
  boundingBoxWithMargin,
  bboxSizeMeters,
  filterLabelsForDisplay,
  filterPlacesForDisplay,
  findWalkingPath,
  lineClassName,
  lineIntersectsBbox,
  projectPoint,
  sliceShapeFromNearestPoint,
  sliceShapeToNearestPoint,
  unprojectPoint,
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

describe('lineClassName', () => {
  it('gives a river its own class', () => {
    const line: MapLine = { kind: 'river', points: [], name: null, priority: 0 }
    expect(lineClassName(line)).toBe('map-river')
  })

  it('gives a footbridge its own class, distinct from roads', () => {
    const line: MapLine = { kind: 'footbridge', points: [], name: null, priority: 5 }
    expect(lineClassName(line)).toBe('map-footbridge')
  })

  it('marks a low-priority road (secondary/tertiary) as minor', () => {
    const line: MapLine = { kind: 'road', points: [], name: null, priority: 3 }
    expect(lineClassName(line)).toBe('map-road map-road-minor')
  })

  it('does not mark a major road as minor', () => {
    const line: MapLine = { kind: 'road', points: [], name: null, priority: 1 }
    expect(lineClassName(line)).toBe('map-road')
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
    expect(result).toHaveLength(3)
    expect(result[0][0]).toBeCloseTo(13.712, 2)
    expect(result[0][1]).toBeCloseTo(100.511, 2)
    expect(result[1]).toEqual([13.72, 100.52])
    expect(result[2]).toEqual([13.73, 100.53])
  })

  it('returns the whole shape when the nearest point is the first one', () => {
    const shape: [number, number][] = [
      [13.7, 100.5],
      [13.71, 100.51],
    ]
    const result = sliceShapeFromNearestPoint(shape, { lat: 13.7, lon: 100.5 })
    expect(result).toHaveLength(2)
    expect(result[0][0]).toBeCloseTo(13.7, 5)
    expect(result[0][1]).toBeCloseTo(100.5, 5)
    expect(result[1]).toEqual([13.71, 100.51])
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

    // early in the trip -> should snap near index 1, not index 8
    const early = sliceShapeFromNearestPoint(shape, point, 0.1)
    expect(early[0][0]).toBeCloseTo(13.7, 2)
    expect(early).toHaveLength(10)

    // late in the trip -> should snap near index 8, not index 1
    const late = sliceShapeFromNearestPoint(shape, point, 0.9)
    expect(late[0][0]).toBeCloseTo(13.7, 2)
    expect(late).toHaveLength(3)
  })

  it('snaps onto a segment even when neither endpoint is close (the real bug case)', () => {
    // regression test: a stop 4.9m from the *segment* between two shape vertices that
    // are themselves both >250m from the stop — simplification can leave exactly this
    // shape, and a vertex-only nearest search used to report a ~273m gap.
    const shape: [number, number][] = [
      [13.7, 100.5],
      [13.71, 100.52], // far from the stop
      [13.7101, 100.5205], // also far from the stop, but the segment between here and the next point passes close by
      [13.72, 100.54],
    ]
    // a point that sits almost exactly on the segment from index 1 to index 2, far from both vertices
    const nearStop = { lat: 13.71005, lon: 100.52025 }
    const result = sliceShapeFromNearestPoint(shape, nearStop)
    expect(result[0][0]).toBeCloseTo(nearStop.lat, 3)
    expect(result[0][1]).toBeCloseTo(nearStop.lon, 3)
  })
})

describe('sliceShapeToNearestPoint', () => {
  it('drops the portion of the shape after the nearest point to the given stop', () => {
    const shape: [number, number][] = [
      [13.7, 100.5],
      [13.71, 100.51],
      [13.72, 100.52],
      [13.73, 100.53],
    ]
    const result = sliceShapeToNearestPoint(shape, { lat: 13.712, lon: 100.511 })
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual([13.7, 100.5])
    expect(result[1][0]).toBeCloseTo(13.712, 2)
    expect(result[1][1]).toBeCloseTo(100.511, 2)
  })

  it('picks the occurrence near the expected fraction on a loop that revisits the same spot', () => {
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

    const early = sliceShapeToNearestPoint(shape, point, 0.1)
    expect(early).toHaveLength(2)
    expect(early[early.length - 1][0]).toBeCloseTo(13.7, 2)

    const late = sliceShapeToNearestPoint(shape, point, 0.9)
    expect(late).toHaveLength(9)
    expect(late[late.length - 1][0]).toBeCloseTo(13.7, 2)
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

describe('bboxAroundCenter', () => {
  it('centers the box on the given point', () => {
    const center = { lat: 13.75, lon: 100.5 }
    const bbox = bboxAroundCenter(center, 1000)
    expect((bbox.minLat + bbox.maxLat) / 2).toBeCloseTo(center.lat, 6)
    expect((bbox.minLon + bbox.maxLon) / 2).toBeCloseTo(center.lon, 6)
  })

  it('produces a box roughly 2x the radius wide and tall in meters', () => {
    const bbox = bboxAroundCenter({ lat: 13.75, lon: 100.5 }, 1000)
    const { widthM, heightM } = bboxSizeMeters(bbox)
    expect(widthM).toBeCloseTo(2000, -1)
    expect(heightM).toBeCloseTo(2000, -1)
  })
})

describe('unprojectPoint', () => {
  it('inverts projectPoint for the north-west corner', () => {
    const bbox = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }
    const projected = projectPoint({ lat: 13.8, lon: 100.5 }, bbox)
    const back = unprojectPoint(projected, bbox)
    expect(back.lat).toBeCloseTo(13.8, 6)
    expect(back.lon).toBeCloseTo(100.5, 6)
  })

  it('round-trips an arbitrary interior point', () => {
    const bbox = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }
    const original = { lat: 13.734, lon: 100.567 }
    const back = unprojectPoint(projectPoint(original, bbox), bbox)
    expect(back.lat).toBeCloseTo(original.lat, 6)
    expect(back.lon).toBeCloseTo(original.lon, 6)
  })
})

describe('findWalkingPath', () => {
  const METERS_PER_DEGREE = 111320
  // Two points roughly 210m apart along the equator, so meter offsets are easy to reason about.
  const from = { lat: 0, lon: 0 }
  const to = { lat: 0, lon: 210 / METERS_PER_DEGREE }

  it('walks straight there when no footbridge is nearby', () => {
    const path = findWalkingPath(from, to, [])
    expect(path.viaFootbridge).toBe(false)
    expect(path.points).toEqual([from, to])
  })

  it('routes through a footbridge that sits on the way without much detour', () => {
    const bridge: MapLine = {
      kind: 'footbridge',
      points: [
        [0, 100 / METERS_PER_DEGREE],
        [0, 110 / METERS_PER_DEGREE],
      ],
      name: null,
      priority: 5,
    }
    const path = findWalkingPath(from, to, [bridge])
    expect(path.viaFootbridge).toBe(true)
    expect(path.points[0]).toEqual(from)
    expect(path.points[path.points.length - 1]).toEqual(to)
    expect(path.points).toHaveLength(4)
  })

  it('ignores a footbridge that would require a huge detour', () => {
    const farBridge: MapLine = {
      kind: 'footbridge',
      points: [
        [1, 1], // nowhere near the direct path
        [1.001, 1.001],
      ],
      name: null,
      priority: 5,
    }
    const path = findWalkingPath(from, to, [farBridge])
    expect(path.viaFootbridge).toBe(false)
  })

  it('ignores lines that are not footbridges', () => {
    const road: MapLine = {
      kind: 'road',
      points: [
        [0, 100 / METERS_PER_DEGREE],
        [0, 110 / METERS_PER_DEGREE],
      ],
      name: null,
      priority: 1,
    }
    const path = findWalkingPath(from, to, [road])
    expect(path.viaFootbridge).toBe(false)
  })
})

describe('bboxFromView', () => {
  it('returns the base bbox unchanged at the fitted (zoom 1) view', () => {
    const base = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }
    const { widthM, heightM } = bboxSizeMeters(base)
    const view = { zoom: 1, panX: 0, panY: 0 }
    const result = bboxFromView(base, view, { width: widthM, height: heightM })
    expect(result.minLat).toBeCloseTo(base.minLat, 4)
    expect(result.maxLat).toBeCloseTo(base.maxLat, 4)
    expect(result.minLon).toBeCloseTo(base.minLon, 4)
    expect(result.maxLon).toBeCloseTo(base.maxLon, 4)
  })

  it('shrinks the box toward the north-west when zoomed and panned to (0,0)', () => {
    const base = { minLat: 13.7, maxLat: 13.8, minLon: 100.5, maxLon: 100.6 }
    const { widthM, heightM } = bboxSizeMeters(base)
    const view = { zoom: 2, panX: 0, panY: 0 }
    const result = bboxFromView(base, view, { width: widthM, height: heightM })
    expect(result.maxLat).toBeCloseTo(base.maxLat, 4)
    expect(result.minLon).toBeCloseTo(base.minLon, 4)
    expect(result.minLat).toBeGreaterThan(base.minLat)
    expect(result.maxLon).toBeLessThan(base.maxLon)
  })
})
