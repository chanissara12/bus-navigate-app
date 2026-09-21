import { useCallback, useEffect, useRef, useState } from 'react'
import type { LatLon } from './geo'

export type GeolocationStatus = 'idle' | 'loading' | 'granted' | 'error'

interface GeolocationState {
  status: GeolocationStatus
  coords: LatLon | null
  error: string | null
  request: () => void
}

export function useGeolocation(): GeolocationState {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [coords, setCoords] = useState<LatLon | null>(null)
  const [error, setError] = useState<string | null>(null)
  const statusRef = useRef<GeolocationStatus>('idle')
  const watchIdRef = useRef<number | null>(null)

  const setStatusBoth = useCallback((next: GeolocationStatus) => {
    statusRef.current = next
    setStatus(next)
  }, [])

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatusBoth('error')
      setError('เครื่องนี้ไม่รองรับ GPS')
      return
    }
    if (statusRef.current === 'loading') return

    setStatusBoth('loading')
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setError(null)
        setStatusBoth('granted')
      },
      (err) => {
        setError(err.message)
        setStatusBoth('error')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [setStatusBoth])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current)
    }
  }, [])

  return { status, coords, error, request }
}
