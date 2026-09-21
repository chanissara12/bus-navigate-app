import type { MapBackground, MapPlace } from './types'

export function searchPlaces(background: MapBackground, query: string, maxResults: number): MapPlace[] {
  const normalized = query.trim().toLowerCase()
  if (normalized === '') return []

  const matches = background.places.filter((p) => p.name.toLowerCase().includes(normalized))
  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(normalized) ? 0 : 1
    const bStarts = b.name.toLowerCase().startsWith(normalized) ? 0 : 1
    if (aStarts !== bStarts) return aStarts - bStarts
    return a.name.length - b.name.length
  })
  return matches.slice(0, maxResults)
}
