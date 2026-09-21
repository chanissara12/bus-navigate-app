import { useEffect, useState } from 'react'
import { loadMapBackground } from './loadMapBackground'
import type { MapBackground } from './types'

interface MapBackgroundState {
  background: MapBackground | null
  error: string | null
}

export function useMapBackground(): MapBackgroundState {
  const [state, setState] = useState<MapBackgroundState>({ background: null, error: null })

  useEffect(() => {
    loadMapBackground()
      .then((background) => setState({ background, error: null }))
      .catch((err: Error) => setState({ background: null, error: err.message }))
  }, [])

  return state
}
