import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DestinationScreen } from './DestinationScreen'
import { DEFAULT_FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import type { GeolocationState } from '../lib/useGeolocation'
import type { BusData } from '../lib/types'

const SIAM = DEFAULT_FAVORITE_DESTINATIONS[0] // { name: 'สยาม', lat: 13.746, lon: 100.534 } — the default destination

// 'origin' is where the mocked GPS sits. 'near' and 'far' both sit on the
// route past it, within the 800m destination radius of สยาม (the default
// destination), so this one route/board-stop group ends up with two alight
// options — enough to exercise "show the best one, expand for the rest".
function makeData(): BusData {
  return {
    generatedAt: '',
    feedVersion: null,
    stops: [
      { id: 'origin', nameTh: 'ป้ายต้นทาง', nameEn: 'Origin', lat: 0, lon: 0 },
      { id: 'near', nameTh: 'ป้ายใกล้สยาม', nameEn: 'Near Siam', lat: SIAM.lat, lon: SIAM.lon },
      { id: 'far', nameTh: 'ป้ายไกลจากสยามนิดหน่อย', nameEn: 'A bit further', lat: SIAM.lat + 0.003, lon: SIAM.lon },
    ],
    routes: [{ id: 'r1', agency: 'BMTA', newCode: '5-5', oldCode: null, longNameTh: '', longNameEn: '' }],
    directions: [
      {
        routeIdx: 0,
        directionId: 0,
        headsignTh: 'ไปสยาม',
        headsignEn: 'To Siam',
        stopIdxs: [0, 1, 2],
        offsetsSec: [0, 600, 660],
        headwaySec: 600,
        shapeCoords: [],
      },
    ],
  }
}

function grantedAtOrigin(): GeolocationState {
  return { status: 'granted', coords: { lat: 0, lon: 0 }, error: null, request: vi.fn() }
}

describe('DestinationScreen board-now cards', () => {
  it('shows only the best option by default, with an expand link for the rest', () => {
    render(<DestinationScreen data={makeData()} location={grantedAtOrigin()} />)

    expect(screen.getByText(/ลงป้าย ป้ายใกล้สยาม/)).toBeInTheDocument()
    expect(screen.queryByText(/ป้ายไกลจากสยามนิดหน่อย/)).not.toBeInTheDocument()
    expect(screen.getByText('ดูเพิ่มเติม (1)')).toBeInTheDocument()
  })

  it('reveals the rest of the options when expanded, and can collapse again', () => {
    render(<DestinationScreen data={makeData()} location={grantedAtOrigin()} />)

    fireEvent.click(screen.getByText('ดูเพิ่มเติม (1)'))
    expect(screen.getByText(/ป้ายไกลจากสยามนิดหน่อย/)).toBeInTheDocument()
    expect(screen.getByText('ย่อ')).toBeInTheDocument()

    fireEvent.click(screen.getByText('ย่อ'))
    expect(screen.queryByText(/ป้ายไกลจากสยามนิดหน่อย/)).not.toBeInTheDocument()
    expect(screen.getByText('ดูเพิ่มเติม (1)')).toBeInTheDocument()
  })
})
