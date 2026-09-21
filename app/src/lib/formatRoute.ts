import type { Route } from './types'

export function formatRouteCode(route: Route): string {
  return route.oldCode ? `${route.newCode} (${route.oldCode})` : route.newCode
}
