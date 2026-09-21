import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StopScreen } from './StopScreen'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData, Direction, Route } from '../lib/types'

function route(id: string, newCode: string): Route {
  return { id, agency: 'BMTA', newCode, oldCode: null, longNameTh: '', longNameEn: '' }
}

function direction(overrides: Partial<Direction>): Direction {
  return {
    routeIdx: 0,
    directionId: 0,
    headsignTh: '',
    headsignEn: '',
    stopIdxs: [0, 1, 2, 3, 4],
    offsetsSec: [0, 60, 120, 180, 240],
    headwaySec: 600,
    shapeCoords: [],
    ...overrides,
  }
}

function makeData(): BusData {
  return {
    generatedAt: '',
    feedVersion: null,
    stops: [
      { id: 'A', nameTh: 'ป้าย A', nameEn: 'Stop A', lat: 0, lon: 0 },
      { id: 'B', nameTh: 'ป้าย B', nameEn: 'Stop B', lat: 0, lon: 0.001 },
      { id: 'C', nameTh: 'ป้าย C', nameEn: 'Stop C', lat: 0, lon: 0.002 },
      { id: 'D', nameTh: 'ป้าย D', nameEn: 'Stop D', lat: 0, lon: 0.003 },
      { id: 'E', nameTh: 'ป้าย E', nameEn: 'Stop E', lat: 0, lon: 0.004 },
    ],
    routes: [route('r1', '1-1'), route('r2', '8-8')],
    directions: [
      // route r1 has a return direction -> no warning expected
      direction({ routeIdx: 0, directionId: 0, headsignTh: 'ไปทาง E', stopIdxs: [0, 1, 2, 3, 4] }),
      direction({ routeIdx: 0, directionId: 1, headsignTh: 'กลับทาง A', stopIdxs: [4, 3, 2, 1, 0] }),
      // route r2 has only this one direction -> warning expected
      direction({ routeIdx: 1, directionId: 0, headsignTh: 'ทางเดียว', stopIdxs: [0, 1, 2, 3, 4] }),
    ],
  }
}

function grantedAt(lat: number, lon: number): GeolocationState {
  return { status: 'granted', coords: { lat, lon }, error: null, request: vi.fn() }
}

describe('StopScreen', () => {
  it('lists boardable routes at the nearest stop, warning only where there is no return direction', () => {
    render(<StopScreen data={makeData()} location={grantedAt(0, 0)} onOpenRoute={vi.fn()} />)

    expect(screen.getByText('ป้าย A')).toBeInTheDocument()
    expect(screen.getByText('1-1')).toBeInTheDocument()
    expect(screen.getByText('8-8')).toBeInTheDocument()
    expect(screen.getAllByText('ไม่มีข้อมูลขากลับในฟีด')).toHaveLength(1)
  })

  it('shows "ขึ้นได้" only when the typed number exactly matches a boardable route', () => {
    render(<StopScreen data={makeData()} location={grantedAt(0, 0)} onOpenRoute={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('พิมพ์เลขสายที่เห็นหน้ารถ'), { target: { value: '11' } })

    expect(screen.getByText('ขึ้นได้')).toBeInTheDocument()
    expect(screen.queryByText('8-8')).not.toBeInTheDocument()
  })

  it('shows "อย่าขึ้น" when the typed number matches no boardable route', () => {
    render(<StopScreen data={makeData()} location={grantedAt(0, 0)} onOpenRoute={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('พิมพ์เลขสายที่เห็นหน้ารถ'), { target: { value: '99' } })

    expect(screen.getByText('อย่าขึ้น — สายนี้ไม่ผ่านป้ายนี้ไปทางไหนเลย')).toBeInTheDocument()
  })

  it('calls onOpenRoute with the tapped route card', () => {
    const onOpenRoute = vi.fn()
    render(<StopScreen data={makeData()} location={grantedAt(0, 0)} onOpenRoute={onOpenRoute} />)

    fireEvent.click(screen.getByText('1-1'))

    expect(onOpenRoute).toHaveBeenCalledTimes(1)
    expect(onOpenRoute.mock.calls[0][0].route.newCode).toBe('1-1')
  })

  it('asks for location permission before showing any stop', () => {
    const request = vi.fn()
    render(
      <StopScreen
        data={makeData()}
        location={{ status: 'idle', coords: null, error: null, request }}
        onOpenRoute={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText('อนุญาตให้ใช้ตำแหน่ง'))
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('says no stop is nearby when out of range, but still shows the coverage note', () => {
    render(<StopScreen data={makeData()} location={grantedAt(50, 50)} onOpenRoute={vi.fn()} />)

    expect(screen.getByText('ไม่พบป้ายรถเมล์ในระยะ 150 เมตร')).toBeInTheDocument()
    expect(screen.getByText(/ขสมก\. และ TSB/)).toBeInTheDocument()
  })
})
