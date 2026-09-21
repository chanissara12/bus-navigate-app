import type { BusData } from './types'

let cached: Promise<BusData> | null = null

export function loadBusData(): Promise<BusData> {
  if (!cached) {
    cached = fetch('/data/bus-data.json').then((res) => {
      if (!res.ok) throw new Error(`Failed to load bus data: ${res.status}`)
      return res.json() as Promise<BusData>
    })
  }
  return cached
}
