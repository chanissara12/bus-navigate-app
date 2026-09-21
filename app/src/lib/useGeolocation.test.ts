import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGeolocation } from './useGeolocation'

function mockGeolocation(behavior: 'grant' | 'deny') {
  const clearWatch = vi.fn()
  const watchPosition = vi.fn((success, error) => {
    if (behavior === 'grant') success({ coords: { latitude: 13.75, longitude: 100.5 } })
    else error({ message: 'User denied Geolocation' })
    return 1
  })
  Object.defineProperty(navigator, 'geolocation', {
    value: { watchPosition, clearWatch },
    configurable: true,
  })
  return { watchPosition, clearWatch }
}

describe('useGeolocation', () => {
  afterEach(() => {
    cleanup()
    // @ts-expect-error cleaning up the test override
    delete navigator.geolocation
  })

  it('starts idle and only requests location after request() is called', () => {
    const { watchPosition } = mockGeolocation('grant')
    const { result } = renderHook(() => useGeolocation())

    expect(result.current.status).toBe('idle')
    expect(watchPosition).not.toHaveBeenCalled()

    act(() => result.current.request())

    expect(result.current.status).toBe('granted')
    expect(result.current.coords).toEqual({ lat: 13.75, lon: 100.5 })
  })

  it('allows retrying after a denial instead of getting stuck', () => {
    mockGeolocation('deny')
    const { result } = renderHook(() => useGeolocation())

    act(() => result.current.request())
    expect(result.current.status).toBe('error')

    mockGeolocation('grant')
    act(() => result.current.request())
    expect(result.current.status).toBe('granted')
  })
})
