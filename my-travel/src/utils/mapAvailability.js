export function hasMapPoint(spot) {
  return (
    !!spot &&
    ['reference', 'verified'].includes(spot.coordinateStatus) &&
    Number.isFinite(spot.lng) &&
    Number.isFinite(spot.lat) &&
    Math.abs(spot.lng) <= 180 &&
    Math.abs(spot.lat) <= 90
  )
}

export function waypointMapIssue(waypoints) {
  if (!Array.isArray(waypoints) || waypoints.length < 2)
    return '景点坐标不足，暂不提供地图连线。可保存文字草稿。'
  const missing = waypoints.filter((spot) => !hasMapPoint(spot))
  return missing.length
    ? `${missing.map((spot) => spot?.name || '未知景点').join('、')}入口点位待核验，暂不提供地图连线。可保存文字草稿。`
    : ''
}

export function routeMapIssue(route, allSpots) {
  return waypointMapIssue(route.spotIds.map((id) => allSpots.find((spot) => spot.id === id)))
}
