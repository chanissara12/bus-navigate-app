import { useMemo, useState } from 'react'
import { useFavoriteDestinations } from '../lib/favoriteDestinations'
import type { LatLon } from '../lib/geo'
import { searchPlaces } from '../lib/placeSearch'
import type { MapBackground } from '../lib/types'
import { DestinationPicker, type PickedDestination } from './DestinationPicker'
import { FavoriteDestinationsManager } from './FavoriteDestinationsManager'

const MAX_SEARCH_RESULTS = 8

export type Destination = PickedDestination

interface Props {
  background: MapBackground | null
  center: LatLon | null
  value: Destination
  /** เลือกจากรายการปลายทางที่บันทึกไว้ — เป็นแค่การสลับค่าอย่างรวดเร็ว ไม่ใช่การค้นพบปลายทางใหม่ */
  onSelectFavorite: (destination: Destination) => void
  /** เลือกผ่านการค้นหาหรือแตะบนแผนที่ — เป็นปลายทางใหม่ที่ควรดำเนินการต่อทันที */
  onPick: (destination: Destination) => void
}

export function DestinationSelector({ background, center, value, onSelectFavorite, onPick }: Props) {
  const favorites = useFavoriteDestinations()
  const [searchInput, setSearchInput] = useState('')
  const [pickingOnMap, setPickingOnMap] = useState(false)
  const [managingFavorites, setManagingFavorites] = useState(false)

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
      {/* ปุ่มกดครั้งเดียวแทน dropdown มาตรฐาน — ปลายทางโปรดมีแค่ไม่กี่รายการ
          การกดเลือกตรงๆ เร็วกว่าต้องเปิด dropdown แล้วเลื่อนหาทุกครั้ง */}
      <div className="favorite-destinations">
        {favorites.map((d) => (
          <button
            key={d.name}
            type="button"
            className={d.name === value.name ? 'favorite-destination active' : 'favorite-destination'}
            onClick={() => onSelectFavorite(d)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <button type="button" className="manage-favorites-button" onClick={() => setManagingFavorites(true)}>
        ⚙ จัดการปลายทางโปรด
      </button>

      {managingFavorites && (
        <FavoriteDestinationsManager
          background={background}
          center={center}
          onClose={() => setManagingFavorites(false)}
        />
      )}

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
