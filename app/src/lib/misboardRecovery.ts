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
  // เริ่มที่ currentPosition เอง ไม่ใช่ currentPosition + 1: ตำแหน่ง GPS ที่ได้มา
  // เป็น currentPosition อาจตกอยู่บนป้ายที่อยู่ในรัศมีเดินของจุดหมายอยู่แล้ว
  // (ผู้โดยสารอยู่ที่/กำลังเข้าใกล้ป้ายที่ใกล้พอแล้ว) กรณีนี้ต้องตอบว่า "ลงที่นี่"
  // ไม่ใช่ "no-recovery"
  for (let position = currentPosition; position < direction.stopIdxs.length; position += 1) {
    const stopIdx = direction.stopIdxs[position]
    if (!destinationStopIdxs.has(stopIdx)) continue
    const stopsRemaining = position - currentPosition
    // Note: stopsRemaining เป็น 0 ได้ (ป้ายที่ตำแหน่งปัจจุบันเข้าเงื่อนไขอยู่แล้ว)
    // จึงรวมกรณีนั้นเข้ากับ "ลงป้ายถัดไป" ด้วย <= 1 แทนที่จะเช็คเท่ากับ 1 เฉย ๆ
    return stopsRemaining <= 1
      ? { kind: 'alight-next-stop', stopIdx }
      : { kind: 'alight-in-n-stops', stopsRemaining, stopIdx }
  }
  return { kind: 'no-recovery' }
}
