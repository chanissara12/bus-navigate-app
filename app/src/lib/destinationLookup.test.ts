import { describe, expect, it } from 'vitest'
import {
  findDirectWalk,
  findJourneys,
  groupByBoardNowDirection,
  ORIGIN_WALK_RADIUS_M,
  DESTINATION_WALK_RADIUS_M,
} from './destinationLookup'
import { walkSeconds } from './geo'
import type { BusData, MapLine } from './types'

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

function makeOriginWalkData(): BusData {
  return {
    generatedAt: '',
    feedVersion: null,
    stops: [
      stopAt('close', 0), // 0 — right where the rider is standing
      stopAt('far', 350), // 1 — still within the 400m origin radius, but a real walk
      stopAt('dest', 1000), // 2
    ],
    routes: [
      { id: 'route-a', agency: 'BMTA', newCode: '1-1', oldCode: null, longNameTh: '', longNameEn: '' },
      { id: 'route-b', agency: 'BMTA', newCode: '2-2', oldCode: null, longNameTh: '', longNameEn: '' },
    ],
    directions: [
      {
        // boards right next to the rider, but a slightly slower ride (10 min)
        routeIdx: 0,
        directionId: 0,
        headsignTh: 'from close',
        headsignEn: 'from close',
        stopIdxs: [0, 2],
        offsetsSec: [0, 600],
        headwaySec: 600,
        shapeCoords: [],
      },
      {
        // a 350m walk away, but 1 minute less ride time
        routeIdx: 1,
        directionId: 0,
        headsignTh: 'from far',
        headsignEn: 'from far',
        stopIdxs: [1, 2],
        offsetsSec: [0, 540],
        headwaySec: 600,
        shapeCoords: [],
      },
    ],
  }
}

describe('findJourneys — origin walk time', () => {
  it('prefers boarding at the nearer stop once the walk there is counted, even with a marginally slower ride', () => {
    const data = makeOriginWalkData()
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 1000 / METERS_PER_DEGREE })
    // 'far' has a 60s shorter ride but a ~290s longer walk — 'close' should win overall
    expect(journeys[0].type).toBe('direct')
    if (journeys[0].type === 'direct') expect(journeys[0].leg.boardStopIdx).toBe(0)
  })

  it('reports the walking distance to each board stop', () => {
    const data = makeOriginWalkData()
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 1000 / METERS_PER_DEGREE })
    const byBoardStop = new Map(
      journeys.map((j) => [(j.type === 'direct' ? j.leg : j.firstLeg).boardStopIdx, j.originWalkMeters]),
    )
    expect(byBoardStop.get(0)).toBeCloseTo(0, 0)
    expect(byBoardStop.get(1)).toBeCloseTo(350, 0)
  })

  it('exposes the same originWalkMeters on the board-now group', () => {
    const data = makeOriginWalkData()
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 1000 / METERS_PER_DEGREE })
    const groups = groupByBoardNowDirection(journeys)
    const nearGroup = groups.find((g) => g.boardStopIdx === 0)
    expect(nearGroup?.originWalkMeters).toBeCloseTo(0, 0)
  })
})

describe('findJourneys — destination walk time', () => {
  it('reports and counts the walk from the alight stop to the actual destination', () => {
    const data = makeOriginWalkData()
    // destination is 200m past the 'dest' stop (idx 2), still within the 800m destination radius
    const destination = { lat: 0, lon: 1200 / METERS_PER_DEGREE }
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, destination)

    const direct = journeys.find((j) => j.type === 'direct')
    expect(direct?.destinationWalkMeters).toBeCloseTo(200, 0)

    if (direct?.type === 'direct') {
      const rideOnly = direct.leg.waitSec + direct.leg.rideSec
      expect(direct.totalSec).toBeCloseTo(rideOnly + walkSeconds(200), 0)
    }
  })

  it('considers every stop within the destination radius, not just the first one reached', () => {
    // A route passing two stops within the destination's 800m radius: the
    // first one reached (idx 1) is a long walk from the actual destination,
    // the next one (idx 2) is right next to it — the fix in the "ทรี ออน
    // ธรี" case was exactly this: the app used to stop at the first match.
    const data: BusData = {
      generatedAt: '',
      feedVersion: null,
      stops: [
        stopAt('origin', 0),
        stopAt('far-from-dest', 1000),
        stopAt('near-dest', 1200),
      ],
      routes: [{ id: 'r1', agency: 'BMTA', newCode: '1-1', oldCode: null, longNameTh: '', longNameEn: '' }],
      directions: [
        {
          routeIdx: 0,
          directionId: 0,
          headsignTh: '',
          headsignEn: '',
          stopIdxs: [0, 1, 2],
          offsetsSec: [0, 600, 660],
          headwaySec: 600,
          shapeCoords: [],
        },
      ],
    }
    // 14m past 'near-dest' (idx 2), 214m past 'far-from-dest' (idx 1) — both within the 800m radius
    const destination = { lat: 0, lon: 1214 / METERS_PER_DEGREE }
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, destination)

    const byAlightStop = new Map(journeys.filter((j) => j.type === 'direct').map((j) => [j.leg.alightStopIdx, j]))
    expect(byAlightStop.size).toBe(2) // both alight stops were explored, not just the first

    expect(journeys[0].type).toBe('direct')
    if (journeys[0].type === 'direct') expect(journeys[0].leg.alightStopIdx).toBe(2) // 'near-dest' wins overall
  })
})

describe('findJourneys — map-aware walking distance', () => {
  // Both alight candidates sit well outside the 400m origin radius, so
  // 'origin' is the only valid board stop — keeps the comparison to exactly
  // the two alight options. 'closerByAir' is 20m from the destination in a
  // straight line, but a bent road stands between them (confirmed real
  // case: a stop that reads as closest by air was actually across
  // ถนนพระราม 3 from the destination). 'fartherByAir' is 130m away but has
  // a clear line to the destination.
  function makeData(): BusData {
    return {
      generatedAt: '',
      feedVersion: null,
      stops: [
        stopAt('origin', 0),
        stopAt('closerByAir', 700),
        stopAt('fartherByAir', 850),
      ],
      routes: [{ id: 'r1', agency: 'BMTA', newCode: '1-1', oldCode: null, longNameTh: '', longNameEn: '' }],
      directions: [
        {
          routeIdx: 0,
          directionId: 0,
          headsignTh: '',
          headsignEn: '',
          stopIdxs: [0, 1, 2],
          offsetsSec: [0, 600, 660],
          headwaySec: 600,
          shapeCoords: [],
        },
      ],
    }
  }

  const destination = { lat: 0, lon: 720 / METERS_PER_DEGREE }
  const bentRoad: MapLine = {
    kind: 'road',
    // both ends sit exactly on closerByAir and destination, but bow out
    // through a kink far off the direct line — a real detour, not a shortcut
    points: [
      [0, 700 / METERS_PER_DEGREE],
      [200 / METERS_PER_DEGREE, 710 / METERS_PER_DEGREE],
      [0, 720 / METERS_PER_DEGREE],
    ],
    name: null,
    priority: 1,
  }

  it('picks the stop that is closer by straight-line distance when no map data is available', () => {
    const journeys = findJourneys(makeData(), { lat: 0, lon: 0 }, destination)
    expect(journeys[0].type).toBe('direct')
    if (journeys[0].type === 'direct') expect(journeys[0].leg.alightStopIdx).toBe(1) // closerByAir
  })

  it('prefers the stop with the shorter real walk once road data reveals the detour', () => {
    const journeys = findJourneys(makeData(), { lat: 0, lon: 0 }, destination, [bentRoad])
    expect(journeys[0].type).toBe('direct')
    if (journeys[0].type === 'direct') expect(journeys[0].leg.alightStopIdx).toBe(2) // fartherByAir wins for real
  })
})

describe('findJourneys — direct walk beats a slower bus', () => {
  // Origin and destination sit 190m apart — close enough that walking
  // straight there is clearly faster than any bus. A stop that happens to
  // sit within both the origin's and destination's walk radius can still
  // produce a technically-valid "journey" that boards near the destination,
  // rides away, and alights back near the origin (confirmed real case:
  // "ตรงข้ามทรี ออน ธรี" to "เทอร์มินอล 21 พระราม 3", ~190m apart) — that
  // should never outrank just walking.
  function makeLoopableData(): BusData {
    return {
      generatedAt: '',
      feedVersion: null,
      stops: [
        stopAt('origin', 0),
        stopAt('near-destination', 190), // within both radii, at the destination's own doorstep
      ],
      routes: [{ id: 'r1', agency: 'BMTA', newCode: '1-1', oldCode: null, longNameTh: '', longNameEn: '' }],
      directions: [
        {
          // boards right next to the destination, rides away and back —
          // technically reaches a stop near the origin, but is far slower
          // than the 190m walk it's supposedly an alternative to.
          routeIdx: 0,
          directionId: 0,
          headsignTh: '',
          headsignEn: '',
          stopIdxs: [1, 0],
          offsetsSec: [0, 600],
          headwaySec: 600,
          shapeCoords: [],
        },
      ],
    }
  }

  it('reports the direct walk time and distance between origin and destination', () => {
    const walk = findDirectWalk({ lat: 0, lon: 0 }, { lat: 0, lon: 190 / METERS_PER_DEGREE })
    expect(walk.meters).toBeCloseTo(190, 0)
    expect(walk.sec).toBeCloseTo(walkSeconds(190), 0)
    expect(walk.crossesMajorRoad).toBe(false)
  })

  it('filters out a bus journey that is slower than walking straight to the destination', () => {
    const data = makeLoopableData()
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 190 / METERS_PER_DEGREE })
    expect(journeys).toHaveLength(0)
  })

  it('still surfaces a bus journey that genuinely beats walking', () => {
    // boards and alights right at origin/destination, with almost no wait —
    // even a 190m walk can't compete with that.
    const data: BusData = {
      generatedAt: '',
      feedVersion: null,
      stops: [stopAt('origin', 0), stopAt('destination', 190)],
      routes: [{ id: 'r1', agency: 'BMTA', newCode: '1-1', oldCode: null, longNameTh: '', longNameEn: '' }],
      directions: [
        {
          routeIdx: 0,
          directionId: 0,
          headsignTh: '',
          headsignEn: '',
          stopIdxs: [0, 1],
          offsetsSec: [0, 10],
          headwaySec: 0,
          shapeCoords: [],
        },
      ],
    }
    const journeys = findJourneys(data, { lat: 0, lon: 0 }, { lat: 0, lon: 190 / METERS_PER_DEGREE })
    expect(journeys.length).toBeGreaterThan(0)
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
