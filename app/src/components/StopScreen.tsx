import { useMemo, useState } from 'react'
import { boardableDirectionsAtStop, findNearestStop, hasNoReturnData, type BoardableDirection } from '../lib/routeLookup'
import { routeCodeStartsWithInput, routeMatchesInput } from '../lib/numberMatch'
import { formatRouteCode } from '../lib/formatRoute'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData } from '../lib/types'
import { LocationGate } from './LocationGate'

const NEAREST_STOP_RADIUS_M = 150

const COVERAGE_NOTE = 'แอปนี้รู้จักเฉพาะรถเมล์ ขสมก. และ TSB — ไม่รวมรถตู้ รถสองแถว รถไฟฟ้า BTS/MRT หรือเรือ'
const NO_RETURN_DATA_WARNING = 'ไม่มีข้อมูลขากลับในฟีด'

interface Props {
  data: BusData
  location: GeolocationState
  onOpenRoute: (boardable: BoardableDirection) => void
}

export function StopScreen({ data, location, onOpenRoute }: Props) {
  const { status, coords, error, request } = location
  const [input, setInput] = useState('')

  const nearest = useMemo(() => {
    if (!coords) return null
    return findNearestStop(data, coords, NEAREST_STOP_RADIUS_M)
  }, [data, coords])

  const boardable = useMemo(() => {
    if (!nearest) return []
    return boardableDirectionsAtStop(data, nearest.stop.id)
  }, [data, nearest])

  // candidates เป็น null เมื่อยังไม่ได้พิมพ์เลขสาย (แสดงทุกสายที่ขึ้นได้จากป้ายนี้)
  // แต่เป็น [] เมื่อพิมพ์แล้วไม่เจอสายที่ตรง — สองสถานะนี้ต้องแยกกันเพื่อโชว์ผลลัพธ์ถูกจอ
  const candidates = useMemo(() => {
    if (input === '') return null
    return boardable.filter((b) => routeCodeStartsWithInput(b.route, input))
  }, [boardable, input])

  // ตรงกับ "ขึ้นได้" ก็ต่อเมื่อเลขสายที่พิมพ์ตรงกับสายใดสายหนึ่งแบบเป๊ะๆ ไม่ใช่แค่ขึ้นต้นตรงกัน
  // (เช่นพิมพ์ "8" ไม่ควรฟันธงว่าขึ้นได้ทันทีถ้ามีทั้งสาย 8 และ 8ก)
  const hasExactMatch = useMemo(() => {
    if (!candidates) return false
    return candidates.some((b) => routeMatchesInput(b.route, input))
  }, [candidates, input])

  return (
    <LocationGate
      status={status}
      error={error}
      reason="ต้องใช้ตำแหน่งของคุณเพื่อหาป้ายรถเมล์ที่ใกล้ที่สุด"
      onRequest={request}
    >
      {!nearest ? (
        <>
          <p className="status">ไม่พบป้ายรถเมล์ในระยะ {NEAREST_STOP_RADIUS_M} เมตร</p>
          <p className="coverage-note">{COVERAGE_NOTE}</p>
        </>
      ) : (
        <div className="screen">
          <div className="stop-header">
            <span className="stop-name">{nearest.stop.nameTh || nearest.stop.nameEn}</span>
            <span className="stop-distance">{Math.round(nearest.distanceM)} ม.</span>
          </div>
          <p className="coverage-note">{COVERAGE_NOTE}</p>

          <input
            className="number-input"
            inputMode="numeric"
            placeholder="พิมพ์เลขสายที่เห็นหน้ารถ"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          {candidates !== null && candidates.length === 0 && (
            <div className="verdict no">อย่าขึ้น — สายนี้ไม่ผ่านป้ายนี้ไปทางไหนเลย</div>
          )}
          {candidates !== null && hasExactMatch && <div className="verdict ok">ขึ้นได้</div>}

          <ul className="route-list">
            {(candidates ?? boardable).map((b) => (
              <li key={`${b.direction.routeIdx}-${b.direction.directionId}`}>
                <button type="button" className="route-card" onClick={() => onOpenRoute(b)}>
                  <span className="route-code">{formatRouteCode(b.route)}</span>
                  <span className="route-headsign">ไป {b.direction.headsignTh || b.direction.headsignEn}</span>
                  {hasNoReturnData(data, b.direction) && (
                    <span className="no-return-warning">{NO_RETURN_DATA_WARNING}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {boardable.length === 0 && candidates === null && <p className="status">ป้ายนี้ไม่มีสายผ่าน</p>}
        </div>
      )}
    </LocationGate>
  )
}
