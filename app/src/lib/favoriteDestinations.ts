import type { LatLon } from './geo'

export interface FavoriteDestination extends LatLon {
  name: string
}

export const FAVORITE_DESTINATIONS: FavoriteDestination[] = [
  { name: 'สยาม', lat: 13.746, lon: 100.534 },
  { name: 'อนุสาวรีย์ชัยสมรภูมิ', lat: 13.7648, lon: 100.5378 },
  { name: 'หมอชิต', lat: 13.8022, lon: 100.5535 },
  { name: 'เซ็นทรัลเวิลด์', lat: 13.7466, lon: 100.5393 },
]
