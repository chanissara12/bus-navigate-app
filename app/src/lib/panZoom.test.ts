import { describe, expect, it } from 'vitest'
import { clamp, panView, zoomViewAt, type ViewBox } from './panZoom'

const BASE = { width: 1000, height: 500 }
const MIN_ZOOM = 1
const MAX_ZOOM = 6

describe('clamp', () => {
  it('keeps values inside the range unchanged', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps below the minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps above the maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('zoomViewAt', () => {
  const fitView: ViewBox = { zoom: 1, panX: 0, panY: 0 }

  it('shrinks the visible window when zooming in', () => {
    const next = zoomViewAt(fitView, BASE, { x: 500, y: 250 }, 2, MIN_ZOOM, MAX_ZOOM)
    expect(next.zoom).toBe(2)
  })

  it('keeps the point under the cursor fixed on screen while zooming', () => {
    // zooming in centered on (500, 250) should leave that same point at the
    // same relative fraction (50%, 50%) of the new, smaller view window
    const next = zoomViewAt(fitView, BASE, { x: 500, y: 250 }, 2, MIN_ZOOM, MAX_ZOOM)
    const viewW = BASE.width / next.zoom
    const viewH = BASE.height / next.zoom
    expect((500 - next.panX) / viewW).toBeCloseTo(0.5, 5)
    expect((250 - next.panY) / viewH).toBeCloseTo(0.5, 5)
  })

  it('never zooms out past the fitted view (zoom 1, pan 0,0)', () => {
    const next = zoomViewAt(fitView, BASE, { x: 500, y: 250 }, 0.5, MIN_ZOOM, MAX_ZOOM)
    expect(next).toEqual({ zoom: 1, panX: 0, panY: 0 })
  })

  it('never zooms in past the maximum', () => {
    const next = zoomViewAt(fitView, BASE, { x: 0, y: 0 }, 100, MIN_ZOOM, MAX_ZOOM)
    expect(next.zoom).toBe(MAX_ZOOM)
  })

  it('keeps the pan within the base image bounds after zooming near an edge', () => {
    const next = zoomViewAt(fitView, BASE, { x: 0, y: 0 }, 4, MIN_ZOOM, MAX_ZOOM)
    const viewW = BASE.width / next.zoom
    const viewH = BASE.height / next.zoom
    expect(next.panX).toBeGreaterThanOrEqual(0)
    expect(next.panY).toBeGreaterThanOrEqual(0)
    expect(next.panX + viewW).toBeLessThanOrEqual(BASE.width + 1e-6)
    expect(next.panY + viewH).toBeLessThanOrEqual(BASE.height + 1e-6)
  })
})

describe('panView', () => {
  it('moves the window by the given delta in user units', () => {
    const zoomed: ViewBox = { zoom: 2, panX: 100, panY: 50 }
    const next = panView(zoomed, BASE, 20, -10)
    expect(next.panX).toBe(80)
    expect(next.panY).toBe(60)
  })

  it('clamps panning so the window never leaves the base image', () => {
    const zoomed: ViewBox = { zoom: 2, panX: 0, panY: 0 }
    const next = panView(zoomed, BASE, 50, 50)
    expect(next.panX).toBe(0)
    expect(next.panY).toBe(0)
  })

  it('does nothing at zoom 1 since the fitted view already fills the base image', () => {
    const fitView: ViewBox = { zoom: 1, panX: 0, panY: 0 }
    const next = panView(fitView, BASE, 999, 999)
    expect(next).toEqual({ zoom: 1, panX: 0, panY: 0 })
  })
})
