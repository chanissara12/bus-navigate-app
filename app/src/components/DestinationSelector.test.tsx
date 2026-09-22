import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DestinationSelector } from './DestinationSelector'
import { DEFAULT_FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import type { MapBackground } from '../lib/types'

function makeBackground(): MapBackground {
  return {
    generatedAt: '',
    lines: [],
    labels: [],
    places: [
      { lat: 13.75, lon: 100.5, name: 'เซ็นทรัลลาดพร้าว', kind: 'mall' },
      { lat: 13.9, lon: 100.9, name: 'ไกลลิบ', kind: 'other' },
    ],
  }
}

describe('DestinationSelector', () => {
  it('shows matching search results and calls onPick with the chosen place', () => {
    const onPick = vi.fn()
    render(
      <DestinationSelector
        background={makeBackground()}
        center={{ lat: 13.75, lon: 100.5 }}
        value={DEFAULT_FAVORITE_DESTINATIONS[0]}
        onSelectFavorite={vi.fn()}
        onPick={onPick}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('พิมพ์ค้นหาสถานที่ เช่น ห้าง โรงพยาบาล สถานีรถไฟฟ้า'), {
      target: { value: 'เซ็นทรัล' },
    })
    const result = screen.getByRole('button', { name: 'เซ็นทรัลลาดพร้าว' })
    expect(result).toBeInTheDocument()
    expect(screen.queryByText('ไกลลิบ')).not.toBeInTheDocument()

    fireEvent.click(result)
    expect(onPick).toHaveBeenCalledWith({ lat: 13.75, lon: 100.5, name: 'เซ็นทรัลลาดพร้าว', kind: 'mall' })
  })

  it('calls onSelectFavorite, not onPick, when a saved destination is chosen from the favorite buttons', () => {
    const onSelectFavorite = vi.fn()
    const onPick = vi.fn()
    render(
      <DestinationSelector
        background={makeBackground()}
        center={{ lat: 13.75, lon: 100.5 }}
        value={DEFAULT_FAVORITE_DESTINATIONS[0]}
        onSelectFavorite={onSelectFavorite}
        onPick={onPick}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: DEFAULT_FAVORITE_DESTINATIONS[1].name }))

    expect(onSelectFavorite).toHaveBeenCalledWith(DEFAULT_FAVORITE_DESTINATIONS[1])
    expect(onPick).not.toHaveBeenCalled()
  })

  it('opens the map picker and confirming a tapped point calls onPick', () => {
    const onPick = vi.fn()
    render(
      <DestinationSelector
        background={makeBackground()}
        center={{ lat: 13.75, lon: 100.5 }}
        value={DEFAULT_FAVORITE_DESTINATIONS[0]}
        onSelectFavorite={vi.fn()}
        onPick={onPick}
      />,
    )

    fireEvent.click(screen.getByText('🗺 เลือกจากแผนที่'))
    expect(screen.getByText('แตะบนแผนที่เพื่อเลือกปลายทาง')).toBeInTheDocument()
  })

  it('does not offer the map-picker button when there is no map background yet', () => {
    render(
      <DestinationSelector
        background={null}
        center={{ lat: 13.75, lon: 100.5 }}
        value={DEFAULT_FAVORITE_DESTINATIONS[0]}
        onSelectFavorite={vi.fn()}
        onPick={vi.fn()}
      />,
    )

    expect(screen.queryByText('🗺 เลือกจากแผนที่')).not.toBeInTheDocument()
  })
})
