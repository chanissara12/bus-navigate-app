import type { MapBackground } from './types'

let cached: Promise<MapBackground> | null = null

export function loadMapBackground(): Promise<MapBackground> {
  if (!cached) {
    cached = fetch('/data/map-background.json').then((res) => {
      if (!res.ok) throw new Error(`Failed to load map background: ${res.status}`)
      return res.json() as Promise<MapBackground>
    })
  }
  return cached
}
