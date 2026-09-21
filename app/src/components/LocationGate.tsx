import type { ReactNode } from 'react'
import type { GeolocationStatus } from '../lib/useGeolocation'

interface Props {
  status: GeolocationStatus
  error: string | null
  reason: string
  onRequest: () => void
  children: ReactNode
}

export function LocationGate({ status, error, reason, onRequest, children }: Props) {
  if (status === 'granted') return <>{children}</>

  if (status === 'loading') return <p className="status">กำลังหาตำแหน่งของคุณ...</p>

  return (
    <div className="location-gate">
      <p>{reason}</p>
      {status === 'error' && <p className="status error">หา GPS ไม่ได้: {error}</p>}
      <button type="button" className="request-location" onClick={onRequest}>
        {status === 'error' ? 'ลองอีกครั้ง' : 'อนุญาตให้ใช้ตำแหน่ง'}
      </button>
    </div>
  )
}
