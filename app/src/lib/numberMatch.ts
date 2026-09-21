import type { Route } from './types'

export function normalizeRouteNumber(raw: string): string {
  return raw.replace(/[-\s()]/g, '').toUpperCase()
}

export function routeMatchesInput(route: Route, input: string): boolean {
  const normalizedInput = normalizeRouteNumber(input)
  if (normalizedInput === '') return false
  if (normalizeRouteNumber(route.newCode) === normalizedInput) return true
  if (route.oldCode && normalizeRouteNumber(route.oldCode) === normalizedInput) return true
  return false
}
