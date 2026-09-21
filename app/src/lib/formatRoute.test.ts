import { describe, expect, it } from 'vitest'
import { formatRouteCode } from './formatRoute'
import type { Route } from './types'

function route(newCode: string, oldCode: string | null): Route {
  return { id: 'r', agency: 'BMTA', newCode, oldCode, longNameTh: '', longNameEn: '' }
}

describe('formatRouteCode', () => {
  it('appends the old code in parentheses when there is one', () => {
    expect(formatRouteCode(route('2-44', '54'))).toBe('2-44 (54)')
  })

  it('returns just the new code when there is no old code', () => {
    expect(formatRouteCode(route('1-63', null))).toBe('1-63')
  })
})
