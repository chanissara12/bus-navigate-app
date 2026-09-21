import { describe, expect, it } from 'vitest'
import { buildSpatialIndex } from './spatialIndex'
import type { BusData } from './types'

const METERS_PER_DEGREE = 111320
function stopAt(id: string, offsetMeters: number) {
  return { id, nameTh: id, nameEn: id, lat: 0, lon: offsetMeters / METERS_PER_DEGREE }
}

function makeData(): BusData {
  return {
    generatedAt: '',
    feedVersion: null,
    stops: [stopAt('near', 100), stopAt('far', 5000)],
    routes: [{ id: 'r1', agency: 'BMTA', newCode: '1-1', oldCode: null, longNameTh: '', longNameEn: '' }],
    directions: [
      {
        routeIdx: 0,
        directionId: 0,
        headsignTh: '',
        headsignEn: '',
        stopIdxs: [0, 1],
        offsetsSec: [0, 60],
        headwaySec: 300,
        shapeCoords: [],
      },
    ],
  }
}

describe('buildSpatialIndex', () => {
  it('finds stops within a radius and excludes ones outside it', () => {
    const index = buildSpatialIndex(makeData())
    const near = index.stopsNear({ lat: 0, lon: 0 }, 200)
    expect(near).toEqual([0])
  })

  it('indexes which directions stop at each stop index', () => {
    const data = makeData()
    const index = buildSpatialIndex(data)
    expect(index.directionsByStopIdx.get(0)).toEqual([{ direction: data.directions[0], position: 0 }])
    expect(index.directionsByStopIdx.get(1)).toEqual([{ direction: data.directions[0], position: 1 }])
  })
})
