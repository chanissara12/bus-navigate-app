import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MisboardScreen } from './MisboardScreen'
import { FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData } from '../lib/types'

const SIAM = FAVORITE_DESTINATIONS[0] // { name: 'สยาม', lat: 13.746, lon: 100.534 }

// stop 'X' is where the mocked GPS position always lands; stop 'Y' sits
// exactly on the destination, so it's always within its 800m walk radius.
// 'MID' is an optional filler stop in between, placed near X (not near Siam)
// so it never itself resolves as a destination match.
function makeData(stopIdxs: number[]): BusData {
  return {
    generatedAt: '',
    feedVersion: null,
    stops: [
      { id: 'X', nameTh: 'ป้าย X', nameEn: 'X', lat: 0, lon: 0 },
      { id: 'MID', nameTh: 'ป้ายกลาง', nameEn: 'Mid', lat: 0, lon: 0.001 },
      { id: 'Y', nameTh: 'ป้ายใกล้สยาม', nameEn: 'Near Siam', lat: SIAM.lat, lon: SIAM.lon },
    ],
    routes: [{ id: 'r1', agency: 'BMTA', newCode: '5-5', oldCode: null, longNameTh: '', longNameEn: '' }],
    directions: [
      {
        routeIdx: 0,
        directionId: 0,
        headsignTh: 'ไปสยาม',
        headsignEn: 'To Siam',
        stopIdxs,
        offsetsSec: stopIdxs.map((_, i) => i * 60),
        headwaySec: 600,
        shapeCoords: [],
      },
    ],
  }
}

function grantedAtOrigin(): GeolocationState {
  return { status: 'granted', coords: { lat: 0, lon: 0 }, error: null, request: vi.fn() }
}

function selectTheRoute() {
  fireEvent.change(screen.getByPlaceholderText('สายที่ขึ้นอยู่คือสายอะไร'), { target: { value: '55' } })
  fireEvent.click(screen.getByText('5-5'))
}

describe('MisboardScreen', () => {
  it('lists directions matching the typed route number', () => {
    render(<MisboardScreen data={makeData([0, 1, 2])} location={grantedAtOrigin()} />)
    fireEvent.change(screen.getByPlaceholderText('สายที่ขึ้นอยู่คือสายอะไร'), { target: { value: '55' } })
    expect(screen.getByText('5-5')).toBeInTheDocument()
    expect(screen.getByText('ไป ไปสยาม')).toBeInTheDocument()
  })

  it('says get off at the next stop when the destination is one stop away', () => {
    render(<MisboardScreen data={makeData([0, 2])} location={grantedAtOrigin()} />)
    selectTheRoute()
    // default destination is FAVORITE_DESTINATIONS[0], i.e. สยาม — matches stop Y
    expect(screen.getByText('ลงป้ายหน้าได้เลย — ป้ายใกล้สยาม')).toBeInTheDocument()
  })

  it('says how many stops remain when the destination is further ahead', () => {
    render(<MisboardScreen data={makeData([0, 1, 2])} location={grantedAtOrigin()} />)
    selectTheRoute()
    expect(screen.getByText('ยังลงไม่ได้อีก 2 ป้าย แล้วลงที่ ป้ายใกล้สยาม')).toBeInTheDocument()
  })

  it('says there is no recovery when the destination is not near any upcoming stop', () => {
    render(<MisboardScreen data={makeData([0, 1, 2])} location={grantedAtOrigin()} />)
    selectTheRoute()
    // switch to a destination nowhere near any stop on this direction
    fireEvent.click(screen.getByRole('button', { name: 'หมอชิต' }))
    expect(screen.getByText('คันนี้ไม่พาไปที่นั่น ไม่มีทางกู้ได้จากคันนี้')).toBeInTheDocument()
  })

  it('says GPS could not be fixed when no stop on the direction is within range', () => {
    const farAway: GeolocationState = { status: 'granted', coords: { lat: 45, lon: 45 }, error: null, request: vi.fn() }
    render(<MisboardScreen data={makeData([0, 1, 2])} location={farAway} />)
    selectTheRoute()
    expect(screen.getByText('หาตำแหน่งบนสายนี้ไม่ได้ ลองใหม่ตอนรถวิ่งอยู่')).toBeInTheDocument()
  })
})
