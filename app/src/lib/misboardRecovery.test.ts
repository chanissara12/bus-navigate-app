import { describe, expect, it } from 'vitest'
import { recoverFromMisboarding } from './misboardRecovery'
import type { Direction } from './types'

function direction(stopIdxs: number[]): Direction {
  return {
    routeIdx: 0,
    directionId: 0,
    headsignTh: '',
    headsignEn: '',
    stopIdxs,
    offsetsSec: stopIdxs.map((_, i) => i * 60),
    headwaySec: 600,
    shapeCoords: [],
  }
}

describe('recoverFromMisboarding', () => {
  it('says get off at the next stop when it is a destination', () => {
    const result = recoverFromMisboarding(direction([10, 20, 30, 40]), 0, new Set([20]))
    expect(result).toEqual({ kind: 'alight-next-stop', stopIdx: 20 })
  })

  it('says how many stops remain when a later stop is a destination', () => {
    const result = recoverFromMisboarding(direction([10, 20, 30, 40]), 0, new Set([40]))
    expect(result).toEqual({ kind: 'alight-in-n-stops', stopsRemaining: 3, stopIdx: 40 })
  })

  it('says there is no recovery when no upcoming stop is a destination', () => {
    const result = recoverFromMisboarding(direction([10, 20, 30, 40]), 2, new Set([10, 20]))
    expect(result).toEqual({ kind: 'no-recovery' })
  })

  it('says get off here when the current stop itself is already a destination', () => {
    const result = recoverFromMisboarding(direction([10, 20, 30, 40]), 1, new Set([20]))
    expect(result).toEqual({ kind: 'alight-next-stop', stopIdx: 20 })
  })

  it('picks the nearest matching destination when several are on the route ahead', () => {
    const result = recoverFromMisboarding(direction([10, 20, 30, 40]), 0, new Set([30, 40]))
    expect(result).toEqual({ kind: 'alight-in-n-stops', stopsRemaining: 2, stopIdx: 30 })
  })
})
