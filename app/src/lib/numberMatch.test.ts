import { describe, expect, it } from 'vitest'
import { normalizeRouteNumber, routeMatchesInput } from './numberMatch'
import type { Route } from './types'

function route(newCode: string, oldCode: string | null): Route {
  return { id: 'r', agency: 'BMTA', newCode, oldCode, longNameTh: '', longNameEn: '' }
}

describe('normalizeRouteNumber', () => {
  it('strips dashes and spaces', () => {
    expect(normalizeRouteNumber('2-44')).toBe('244')
    expect(normalizeRouteNumber(' 2-44 ')).toBe('244')
  })

  it('keeps letters and digits, uppercases', () => {
    expect(normalizeRouteNumber('1-12e')).toBe('112E')
  })

  it('strips parentheses and other punctuation', () => {
    expect(normalizeRouteNumber('3-38 (13)')).toBe('33813')
  })

  it('keeps a Thai free-text suffix as a meaningful part of the code', () => {
    expect(normalizeRouteNumber('34เสริม')).toBe('34เสริม')
  })
})

describe('routeMatchesInput', () => {
  it('matches typing the new code with dashes', () => {
    expect(routeMatchesInput(route('2-44', '54'), '2-44')).toBe(true)
  })

  it('matches typing the new code without dashes', () => {
    expect(routeMatchesInput(route('2-44', '54'), '244')).toBe(true)
  })

  it('matches typing the old code', () => {
    expect(routeMatchesInput(route('2-44', '54'), '54')).toBe(true)
  })

  it('does not match an unrelated number', () => {
    expect(routeMatchesInput(route('2-44', '54'), '8')).toBe(false)
  })

  it('does not match when the route has no old code', () => {
    expect(routeMatchesInput(route('1-14E', null), '14')).toBe(false)
  })

  it('is case-insensitive for express suffixes', () => {
    expect(routeMatchesInput(route('1-12E', '107'), '112e')).toBe(true)
  })

  it('does not treat a Thai-suffixed old code as the same route as its bare number', () => {
    // real feed data: route "1-3" carries old code "34เสริม" ("34 extra") — typing
    // "34" must not board you onto a different route just because a Thai suffix
    // got stripped away.
    expect(routeMatchesInput(route('1-3', '34เสริม'), '34')).toBe(false)
  })
})
