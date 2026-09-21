import { useEffect, useState } from 'react'
import { loadBusData } from './loadBusData'
import type { BusData } from './types'

interface BusDataState {
  data: BusData | null
  error: string | null
}

export function useBusData(): BusDataState {
  const [state, setState] = useState<BusDataState>({ data: null, error: null })

  useEffect(() => {
    loadBusData()
      .then((data) => setState({ data, error: null }))
      .catch((err: Error) => setState({ data: null, error: err.message }))
  }, [])

  return state
}
