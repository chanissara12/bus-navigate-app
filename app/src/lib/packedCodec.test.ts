import { describe, expect, it } from 'vitest'
import { decodePackedBusData } from './packedCodec'
import type { PackedBusData } from './types'

describe('decodePackedBusData', () => {
  it('reconstructs stop coordinates from delta-encoded integers', () => {
    const packed: PackedBusData = {
      generatedAt: '2026-09-21T00:00:00.000Z',
      feedVersion: '20260919',
      stops: {
        id: ['s1', 's2', 's3'],
        nameTh: ['หนึ่ง', 'สอง', 'สาม'],
        nameEn: ['One', 'Two', 'Three'],
        latE6: [13736717, 100, -50],
        lonE6: [100523186, -200, 300],
      },
      routes: { id: [], agency: [], newCode: [], oldCode: [], longNameTh: [], longNameEn: [] },
      directions: {
        routeIdx: [],
        directionId: [],
        headsignTh: [],
        headsignEn: [],
        headwaySec: [],
        stopIdxs: [],
        offsets5s: [],
        shapeE6: [],
      },
    }

    const decoded = decodePackedBusData(packed)

    expect(decoded.stops).toEqual([
      { id: 's1', nameTh: 'หนึ่ง', nameEn: 'One', lat: 13.736717, lon: 100.523186 },
      { id: 's2', nameTh: 'สอง', nameEn: 'Two', lat: 13.736817, lon: 100.522986 },
      { id: 's3', nameTh: 'สาม', nameEn: 'Three', lat: 13.736767, lon: 100.523286 },
    ])
  })

  it('reconstructs directions, unpacking shape deltas and 5-second offset units', () => {
    const packed: PackedBusData = {
      generatedAt: '2026-09-21T00:00:00.000Z',
      feedVersion: null,
      stops: { id: [], nameTh: [], nameEn: [], latE6: [], lonE6: [] },
      routes: { id: [], agency: [], newCode: [], oldCode: [], longNameTh: [], longNameEn: [] },
      directions: {
        routeIdx: [0],
        directionId: [1],
        headsignTh: ['ปลายทาง'],
        headsignEn: ['Terminal'],
        headwaySec: [900],
        stopIdxs: [[0, 1, 2]],
        offsets5s: [[0, 12, 30]],
        shapeE6: [[13700000, 100500000, 10, -20]],
      },
    }

    const decoded = decodePackedBusData(packed)

    expect(decoded.directions).toEqual([
      {
        routeIdx: 0,
        directionId: 1,
        headsignTh: 'ปลายทาง',
        headsignEn: 'Terminal',
        stopIdxs: [0, 1, 2],
        offsetsSec: [0, 60, 150],
        headwaySec: 900,
        shapeCoords: [
          [13.7, 100.5],
          [13.70001, 100.49998],
        ],
      },
    ])
  })
})
