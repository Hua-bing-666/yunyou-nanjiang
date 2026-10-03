export const SPOT_MARKER_ANCHOR = [16, 32]
export const ROUTE_LINE_COLOR = '#E53935'
export const ROUTE_LINE_WIDTH = 7
export const ROUTE_MARKER_ANCHOR_TRANSFORM = 'translate(-50%, -100%)'
export const ROUTE_MARKER_NAME_DISPLAY = 'smart'
export const ROUTE_LABEL_PLACEMENTS = [
  'right-top',
  'left-top',
  'right-bottom',
  'left-bottom',
  'top',
  'bottom',
]

export function getRouteMarkerVisualSize(zoom = 8) {
  if (zoom <= 6) return 28
  if (zoom >= 10) return 40
  return 28 + Math.round((zoom - 6) * 3)
}

export function getRouteMarkerSequenceLabel(index) {
  return String(index + 1)
}

export function getRouteMarkerAccessibleName(spot, index) {
  const name = spot?.name || 'route spot'
  return `${getRouteMarkerSequenceLabel(index)}. ${name}`
}

export function getMapLabelMode(zoom = 8) {
  if (zoom < 6.8) return 'icon-only'
  if (zoom < 8.2) return 'short'
  return 'full'
}

export function getLabelTextForZoom(name, zoom = 8, shortLength = 3) {
  const text = String(name || '')
  if (getMapLabelMode(zoom) !== 'short' || text.length <= shortLength + 1) {
    return text
  }
  return `${text.slice(0, shortLength)}...`
}

export function createRect(left, top, width, height) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  }
}

export function doRectsOverlap(a, b, gap = 4) {
  return !(
    a.right + gap <= b.left ||
    b.right + gap <= a.left ||
    a.bottom + gap <= b.top ||
    b.bottom + gap <= a.top
  )
}

function getRouteLabelRect(
  anchor,
  placement,
  { width, height, markerSize, gap, fallbackOffset = 0 },
) {
  const sideOffset = markerSize / 2 + gap
  const topOffset = markerSize + gap
  const verticalCenter = anchor.y - markerSize * 0.66

  const positions = {
    'right-top': [anchor.x + sideOffset, anchor.y - topOffset - fallbackOffset],
    'left-top': [anchor.x - sideOffset - width, anchor.y - topOffset - fallbackOffset],
    'right-bottom': [anchor.x + sideOffset, verticalCenter + fallbackOffset],
    'left-bottom': [anchor.x - sideOffset - width, verticalCenter + fallbackOffset],
    top: [anchor.x - width / 2, anchor.y - markerSize - height - gap - fallbackOffset],
    bottom: [anchor.x - width / 2, anchor.y + gap + fallbackOffset],
  }

  const [left, top] = positions[placement] || positions['right-top']
  return createRect(left, top, width, height)
}

function isRectWithinBounds(rect, bounds) {
  if (!bounds) return true
  return (
    rect.left >= bounds.left &&
    rect.top >= bounds.top &&
    rect.right <= bounds.right &&
    rect.bottom <= bounds.bottom
  )
}

function getAnchorDistanceOutsideRect(anchor, rect) {
  const dx = Math.max(rect.left - anchor.x, anchor.x - rect.right, 0)
  const dy = Math.max(rect.top - anchor.y, anchor.y - rect.bottom, 0)
  return Math.max(dx, dy)
}

export function buildRouteLabelLayouts(
  points,
  {
    markerSize = 34,
    gap = 8,
    collisionGap = 4,
    fallbackStep = 16,
    zoom = 8,
    maxOffset = Infinity,
    containerBounds = null,
    hideWhenNoSpace = false,
    forceVisible = false,
  } = {},
) {
  const placed = []
  const mode = getMapLabelMode(zoom)

  return points.map((point, index) => {
    const anchor = { x: point.x, y: point.y }
    const size = {
      width: point.width || 96,
      height: point.height || 28,
      markerSize,
      gap,
    }

    const hiddenLayout = (placement = 'hidden') => ({
      index,
      anchor,
      placement,
      rect: createRect(anchor.x, anchor.y, 0, 0),
      visible: false,
      mode,
    })

    if (mode === 'icon-only' && hideWhenNoSpace && !forceVisible && !point.forceVisible) {
      return hiddenLayout('icon-only')
    }

    const canUseRect = (rect) =>
      getAnchorDistanceOutsideRect(anchor, rect) <= maxOffset &&
      isRectWithinBounds(rect, containerBounds) &&
      !placed.some(
        (layout) => layout.visible !== false && doRectsOverlap(rect, layout.rect, collisionGap),
      )

    for (const placement of ROUTE_LABEL_PLACEMENTS) {
      const rect = getRouteLabelRect(anchor, placement, size)
      if (canUseRect(rect)) {
        const layout = { index, anchor, placement, rect, visible: true, mode }
        placed.push(layout)
        return layout
      }
    }

    let fallbackIndex = 1
    while (fallbackIndex <= 20) {
      const direction = fallbackIndex % 2 === 0 ? -1 : 1
      const distance = Math.ceil(fallbackIndex / 2) * fallbackStep
      const rect = getRouteLabelRect(anchor, 'right-top', {
        ...size,
        fallbackOffset: direction * distance,
      })
      if (canUseRect(rect)) {
        const layout = { index, anchor, placement: 'right-top-offset', rect, visible: true, mode }
        placed.push(layout)
        return layout
      }
      fallbackIndex += 1
    }

    if (hideWhenNoSpace) {
      return hiddenLayout('no-space')
    }

    const rect = getRouteLabelRect(anchor, 'right-top', {
      ...size,
      fallbackOffset: (index + 1) * fallbackStep,
    })
    const layout = { index, anchor, placement: 'right-top-stacked', rect, visible: true, mode }
    placed.push(layout)
    return layout
  })
}

export function getRouteLabelConnectorLine(layout) {
  const { anchor, rect } = layout
  const targetX = anchor.x <= rect.left ? rect.left : rect.right
  const targetY = Math.max(rect.top, Math.min(anchor.y, rect.bottom))

  return {
    from: { x: anchor.x, y: anchor.y },
    to: { x: targetX, y: targetY },
  }
}

/**
 * Build the visible route line requested by the route planner: all waypoints
 * in their route order as a conservative polyline through exact spot coords.
 *
 * @param {Array<{ lng: number, lat: number }>} waypoints
 * @param {Array<[number, number]>} [routeGeometry]
 * @returns {Array<[number, number]>}
 */
export function buildRoutePath(waypoints, routeGeometry = []) {
  // Never bridge across a missing or suspended stop, even with provider geometry.
  if (
    !Array.isArray(waypoints) ||
    waypoints.some(
      (point) =>
        !point ||
        point.coordinateStatus === 'suspended' ||
        !Number.isFinite(point.lng) ||
        !Number.isFinite(point.lat) ||
        Math.abs(point.lng) > 180 ||
        Math.abs(point.lat) > 90,
    )
  )
    return []
  if (Array.isArray(routeGeometry) && routeGeometry.length >= 2) {
    return routeGeometry
      .filter((point) => Array.isArray(point) && point.length >= 2)
      .map((point) => [point[0], point[1]])
  }

  return waypoints.map((point) => [point.lng, point.lat])
}

/**
 * Decide whether the route overlay close watcher should initialize the home map.
 * Route selection owns map initialization, otherwise the watcher can recreate
 * the map after the red polyline is added.
 *
 * @param {{ isRenderingRoute: boolean, showMap: boolean, showStats: boolean, currentDetailId: number | null }} state
 * @returns {boolean}
 */
export function shouldInitializeHomeMapAfterRoutesClose(state) {
  return (
    !state.isRenderingRoute && !state.showMap && !state.showStats && state.currentDetailId === null
  )
}

export function getRouteMarkerSpots(allSpots, routeWaypoints) {
  const spotsById = new Map(allSpots.map((spot) => [spot.id, spot]))
  return routeWaypoints
    .map((waypoint) => spotsById.get(waypoint.id) || waypoint)
    .filter((spot) => spot && typeof spot.lng === 'number' && typeof spot.lat === 'number')
}
