import { useMemo, useState } from 'react'
import {
  addFavoriteDestination,
  removeFavoriteDestination,
  useFavoriteDestinations,
} from '../lib/favoriteDestinations'
import type { LatLon } from '../lib/geo'
import { searchPlaces } from '../lib/placeSearch'
import type { MapBackground } from '../lib/types'
import { DestinationPicker, type PickedDestination } from './DestinationPicker'

const MAX_SEARCH_RESULTS = 8

interface Props {
  background: MapBackground | null
  center: LatLon | null
  onClose: () => void
}

export function FavoriteDestinationsManager({ background, center, onClose }: Props) {
  const favorites = useFavoriteDestinations()
  const [searchInput, setSearchInput] = useState('')
  const [pickingOnMap, setPickingOnMap] = useState(false)
  // แจ้งผลตรงจุดที่ผู้ใช้กำลังมองอยู่ (ใกล้ช่องค้นหา) แทนที่จะหวังให้ผู้ใช้เลื่อนขึ้นไปดู
  // รายการโปรดด้านบนเอง — ไม่งั้นถ้าเพิ่มสำเร็จ (หรือชื่อซ้ำจนไม่เพิ่มซ้ำ) จะดูเหมือนกดไม่ติด
  const [feedback, setFeedback] = useState<string | null>(null)

  const searchResults = useMemo(() => {
    if (!background) return []
    return searchPlaces(background, searchInput, MAX_SEARCH_RESULTS)
  }, [background, searchInput])

  function addPlace(place: PickedDestination) {
    const added = addFavoriteDestination(place)
    setFeedback(added ? `เพิ่ม "${place.name}" ในปลายทางโปรดแล้ว` : `"${place.name}" อยู่ในปลายทางโปรดอยู่แล้ว`)
    setSearchInput('')
  }

  function handlePicked(picked: PickedDestination) {
    setPickingOnMap(false)
    addPlace(picked)
  }

  return (
    <div className="destination-picker" role="dialog" aria-modal="true">
      <div className="leg-map-overlay-header">
        <span>จัดการปลายทางโปรด</span>
        <button type="button" aria-label="ปิด" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="favorites-manager-body">
        <ul className="favorites-manager-list">
          {favorites.map((d) => (
            <li key={d.name}>
              <span>{d.name}</span>
              <button
                type="button"
                className="remove-favorite-button"
                aria-label={`ลบ ${d.name} ออกจากปลายทางโปรด`}
                onClick={() => removeFavoriteDestination(d.name)}
              >
                ลบ
              </button>
            </li>
          ))}
          {favorites.length === 0 && <li className="status">ยังไม่มีปลายทางโปรด</li>}
        </ul>

        <input
          className="number-input"
          placeholder="พิมพ์ค้นหาสถานที่เพื่อเพิ่มเป็นปลายทางโปรด"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setFeedback(null)
          }}
        />
        {feedback && <p className="favorites-manager-feedback">{feedback}</p>}
        {searchResults.length > 0 && (
          <ul className="destination-search-results">
            {searchResults.map((place, i) => (
              <li key={i}>
                <button type="button" onClick={() => addPlace(place)}>
                  + {place.name}
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
      </div>

      {pickingOnMap && background && center && (
        <DestinationPicker
          background={background}
          center={center}
          onConfirm={handlePicked}
          onClose={() => setPickingOnMap(false)}
        />
      )}
    </div>
  )
}
