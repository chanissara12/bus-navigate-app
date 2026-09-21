import type { Direction } from './types'

export type RecoveryResult =
  | { kind: 'alight-next-stop'; stopIdx: number }
  | { kind: 'alight-in-n-stops'; stopsRemaining: number; stopIdx: number }
  | { kind: 'no-recovery' }

export function recoverFromMisboarding(
  direction: Direction,
  currentPosition: number,
  destinationStopIdxs: Set<number>,
): RecoveryResult {
  // Start at currentPosition itself, not currentPosition + 1: the GPS fix that
  // produced currentPosition can already land on a stop within the
  // destination's walk radius (rider is at/approaching a stop that's already
  // close enough), and that must resolve to "get off here", not "no-recovery".
  for (let position = currentPosition; position < direction.stopIdxs.length; position += 1) {
    const stopIdx = direction.stopIdxs[position]
    if (!destinationStopIdxs.has(stopIdx)) continue
    const stopsRemaining = position - currentPosition
    return stopsRemaining <= 1
      ? { kind: 'alight-next-stop', stopIdx }
      : { kind: 'alight-in-n-stops', stopsRemaining, stopIdx }
  }
  return { kind: 'no-recovery' }
}
