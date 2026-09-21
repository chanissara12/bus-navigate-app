export function dedupeDirections(routes, directions) {
  const seen = new Set()
  const result = []
  for (const direction of directions) {
    const route = routes[direction.routeIdx]
    const key = `${route.newCode}::${direction.headsignTh}::${direction.stopIdxs.length}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(direction)
  }
  return result
}
