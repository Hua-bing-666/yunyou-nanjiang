/**
 * Convert a waypoint path into a lightly curved path for AMap Polyline.
 * The first and last coordinates are preserved exactly so marker alignment
 * stays stable.
 *
 * @param {Array<[number, number]>} path
 * @returns {Array<[number, number]>}
 */
export function createBezierCurvePath(path) {
  if (path.length < 2) return path

  const result = [path[0]]

  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i]
    const p1 = path[i + 1]
    const midLng = (p0[0] + p1[0]) / 2
    const midLat = (p0[1] + p1[1]) / 2
    const dx = p1[0] - p0[0]
    const dy = p1[1] - p0[1]
    const perpDx = -dy
    const perpDy = dx
    const length = Math.sqrt(perpDx * perpDx + perpDy * perpDy)
    const normalizedDx = length === 0 ? 0 : perpDx / length
    const normalizedDy = length === 0 ? 0 : perpDy / length
    const distance = Math.sqrt(dx * dx + dy * dy)
    const controlDistance = distance * 0.05
    const controlLng = midLng + normalizedDx * controlDistance
    const controlLat = midLat + normalizedDy * controlDistance

    for (let t = 0.05; t <= 1.000001; t += 0.05) {
      const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * controlLng + t * t * p1[0]
      const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * controlLat + t * t * p1[1]
      result.push([x, y])
    }

    if (i < path.length - 2) {
      result.push(p1)
    }
  }

  result[result.length - 1] = path[path.length - 1]
  return result
}
