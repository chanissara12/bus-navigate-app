import { useMemo, useState } from 'react'
import { FAVORITE_DESTINATIONS } from '../lib/favoriteDestinations'
import type { LatLon } from '../lib/geo'
import { searchPlaces } from '../lib/placeSearch'
import type { MapBackground } from '../lib/types'
import { DestinationPicker, type PickedDestination } from './DestinationPicker'

const MAX_SEARCH_RESULTS = 8

export type Destination = PickedDestination

interface Props {
  background: MapBackground | null
  center: LatLon | null
  value: Destination
  /** Picking from the saved-favorites dropdown — a quick override, not a new discovery. */
  onSelectFavorite: (destination: Destination) => void
  /** Picking via search or tapping the map — a new destination worth acting on immediately. */
  onPick: (destination: Destination) => void
}

export function DestinationSelector({ background, center, value, onSelectFavorite, onPick }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [pickingOnMap, setPickingOnMap] = useState(false)

  const searchResults = useMemo(() => {
    if (!background) return []
    return searchPlaces(background, searchInput, MAX_SEARCH_RESULTS)
  }, [background, searchInput])

  function choosePlace(place: Destination) {
    setSearchInput('')
    onPick(place)
  }

  function handlePicked(picked: PickedDestination) {
    setPickingOnMap(false)
    onPick(picked)
  }

  return (
    <>
      <select
        value={FAVORITE_DESTINATIONS.some((d) => d.name === value.name) ? value.name : ''}
        onChange={(e) => {
          const picked = FAVORITE_DESTINATIONS.find((d) => d.name === e.target.value)
          if (picked) onSelectFavorite(picked)
        }}
      >
        <option value="" disabled>
          เลือกจากรายการที่บันทึกไว้
        </option>
        {FAVORITE_DESTINATIONS.map((d) => (
          <option key={d.name} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>

      <input
        className="number-input"
        placeholder="พิมพ์ค้นหาสถานที่ เช่น ห้าง โรงพยาบาล สถานีรถไฟฟ้า"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {searchResults.length > 0 && (
        <ul className="destination-search-results">
          {searchResults.map((place, i) => (
            <li key={i}>
              <button type="button" onClick={() => choosePlace(place)}>
                {place.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {background && (
        <button type="button" className="pick-from-map-button" onClick={() => setPickingOnMap(true)}>
          🗺 เลือกจากแผนที่
        </button>
      )}

      {pickingOnMap && background && center && (
        <DestinationPicker
          background={background}
          center={center}
          onConfirm={handlePicked}
          onClose={() => setPickingOnMap(false)}
        />
      )}
    </>
  )
}
