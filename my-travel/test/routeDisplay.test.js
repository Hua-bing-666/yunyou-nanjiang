import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildRoutePath,
  ROUTE_LINE_COLOR,
  ROUTE_LINE_WIDTH,
  ROUTE_MARKER_ANCHOR_TRANSFORM,
  ROUTE_MARKER_NAME_DISPLAY,
  buildRouteLabelLayouts,
  doRectsOverlap,
  getLabelTextForZoom,
  getMapLabelMode,
  getRouteMarkerAccessibleName,
  getRouteLabelConnectorLine,
  getRouteMarkerSequenceLabel,
  getRouteMarkerVisualSize,
  getRouteMarkerSpots,
  shouldInitializeHomeMapAfterRoutesClose,
} from '../src/utils/routeDisplay.js'
import { recommendedRoutes } from '../src/data/routes.js'
import { spots } from '../src/data.js'

test('builds a route path through all waypoints in order', () => {
  const waypoints = [
    { lng: 75.990724, lat: 39.471564 },
    { lng: 82.502624, lat: 41.776424 },
    { lng: 75.238024, lat: 37.782821 },
  ]

  const routePath = buildRoutePath(waypoints)

  assert.deepEqual(routePath, [
    [75.990724, 39.471564],
    [82.502624, 41.776424],
    [75.238024, 37.782821],
  ])
})

test('keeps route 1 ids, spot names, and description in the same order', () => {
  const route = recommendedRoutes.find((item) => item.id === 1)

  assert.deepEqual(route.spotIds, [2, 1, 4, 3])
  assert.deepEqual(route.spotNames, ['克孜尔千佛洞', '喀什古城', '石头城', '和田团城'])
  assert.equal(route.desc, '克孜尔千佛洞 → 喀什古城 → 塔什库尔干石头城 → 和田团城')
})

test('route geometry keeps every route spot coordinate in order', () => {
  for (const route of recommendedRoutes) {
    const routePath = buildRoutePath(
      route.spotIds.map((id) => spots.find((spot) => spot.id === id)),
      route.routeGeometry,
    )

    let searchFrom = 0
    for (const spotId of route.spotIds) {
      const spot = spots.find((item) => item.id === spotId)
      const coordIndex = routePath.findIndex(
        (point, index) => index >= searchFrom && point[0] === spot.lng && point[1] === spot.lat,
      )

      assert.notEqual(coordIndex, -1, `${route.name} should include ${spot.name}`)
      searchFrom = coordIndex + 1
    }
  }
})

test('uses configured route geometry before falling back to waypoint coordinates', () => {
  const waypoints = [
    { lng: 1, lat: 1 },
    { lng: 2, lat: 2 },
  ]
  const routeGeometry = [
    [1, 1],
    [1.5, 1.8],
    [2, 2],
  ]

  assert.deepEqual(buildRoutePath(waypoints, routeGeometry), routeGeometry)
})

test('uses bottom-center anchored custom route markers with predictable zoom sizes', () => {
  assert.equal(ROUTE_MARKER_ANCHOR_TRANSFORM, 'translate(-50%, -100%)')
  assert.equal(getRouteMarkerVisualSize(6), 28)
  assert.equal(getRouteMarkerVisualSize(8), 34)
  assert.equal(getRouteMarkerVisualSize(10), 40)
})

test('uses sequence-only visible route marker labels to avoid map label overlap', () => {
  const spot = { name: 'Kashgar Old City' }

  assert.equal(ROUTE_MARKER_NAME_DISPLAY, 'smart')
  assert.equal(getRouteMarkerSequenceLabel(0), '1')
  assert.equal(getRouteMarkerSequenceLabel(10), '11')
  assert.equal(getRouteMarkerAccessibleName(spot, 0), '1. Kashgar Old City')
})

test('chooses alternate route label positions when nearby labels would overlap', () => {
  const layouts = buildRouteLabelLayouts(
    [
      { x: 100, y: 100, width: 88, height: 26 },
      { x: 118, y: 104, width: 88, height: 26 },
    ],
    { markerSize: 34 },
  )

  assert.equal(layouts[0].placement, 'right-top')
  assert.notEqual(layouts[1].placement, 'right-top')
  assert.equal(doRectsOverlap(layouts[0].rect, layouts[1].rect), false)
})

test('keeps dense route label rectangles from overlapping after fallback offsets', () => {
  const layouts = buildRouteLabelLayouts(
    [
      { x: 180, y: 140, width: 96, height: 28 },
      { x: 184, y: 144, width: 96, height: 28 },
      { x: 188, y: 148, width: 96, height: 28 },
      { x: 192, y: 152, width: 96, height: 28 },
      { x: 196, y: 156, width: 96, height: 28 },
      { x: 200, y: 160, width: 96, height: 28 },
    ],
    { markerSize: 34 },
  )

  for (let i = 0; i < layouts.length; i += 1) {
    for (let j = i + 1; j < layouts.length; j += 1) {
      assert.equal(doRectsOverlap(layouts[i].rect, layouts[j].rect), false)
    }
  }
})

test('draws route label connector lines from marker anchor to label edge', () => {
  const layout = buildRouteLabelLayouts([{ x: 100, y: 100, width: 80, height: 24 }], {
    markerSize: 34,
  })[0]
  const line = getRouteLabelConnectorLine(layout)

  assert.deepEqual(line.from, { x: 100, y: 100 })
  assert.equal(line.to.x, layout.rect.left)
  assert.ok(line.to.y >= layout.rect.top)
  assert.ok(line.to.y <= layout.rect.bottom)
})

test('can lay out regular map spot labels near markers without overlap', () => {
  const layouts = buildRouteLabelLayouts(
    [
      { x: 80, y: 120, width: 92, height: 26 },
      { x: 95, y: 126, width: 92, height: 26 },
      { x: 250, y: 160, width: 104, height: 26 },
    ],
    { markerSize: 32 },
  )

  assert.equal(layouts.length, 3)
  for (let i = 0; i < layouts.length; i += 1) {
    assert.ok(Math.abs(layouts[i].anchor.x - layouts[i].rect.left) < 140)
    for (let j = i + 1; j < layouts.length; j += 1) {
      assert.equal(doRectsOverlap(layouts[i].rect, layouts[j].rect), false)
    }
  }
})

test('chooses map label mode from zoom level', () => {
  assert.equal(getMapLabelMode(6.5), 'icon-only')
  assert.equal(getMapLabelMode(7.5), 'short')
  assert.equal(getMapLabelMode(8.5), 'full')
})

test('shortens map label text at medium zoom and keeps full text at high zoom', () => {
  assert.equal(getLabelTextForZoom('塔什库尔干石头城', 7.5), '塔什库...')
  assert.equal(getLabelTextForZoom('塔什库尔干石头城', 8.5), '塔什库尔干石头城')
})

test('hides normal labels at low zoom and bounds visible labels near anchors', () => {
  const layouts = buildRouteLabelLayouts(
    [
      { x: 120, y: 120, width: 100, height: 28 },
      { x: 124, y: 124, width: 100, height: 28 },
    ],
    { markerSize: 32, zoom: 6.5, hideWhenNoSpace: true, maxOffset: 48 },
  )

  assert.deepEqual(
    layouts.map((layout) => layout.visible),
    [false, false],
  )

  const visibleLayouts = buildRouteLabelLayouts(
    [
      { x: 120, y: 120, width: 100, height: 28 },
      { x: 124, y: 124, width: 100, height: 28 },
    ],
    { markerSize: 32, zoom: 8.5, hideWhenNoSpace: true, maxOffset: 48 },
  )

  for (const layout of visibleLayouts.filter((item) => item.visible)) {
    const dx = Math.max(layout.rect.left - layout.anchor.x, layout.anchor.x - layout.rect.right, 0)
    const dy = Math.max(layout.rect.top - layout.anchor.y, layout.anchor.y - layout.rect.bottom, 0)
    assert.ok(Math.max(dx, dy) <= 48)
  }
})

test('uses a visible red custom route line style', () => {
  assert.equal(ROUTE_LINE_COLOR, '#E53935')
  assert.ok(ROUTE_LINE_WIDTH >= 6)
})

test('keeps route marker spots in waypoint order', () => {
  const allSpots = [
    { id: 1, name: 'A', lng: 1, lat: 1 },
    { id: 2, name: 'B', lng: 2, lat: 2 },
    { id: 3, name: 'C', lng: 3, lat: 3 },
  ]
  const routeWaypoints = [
    { id: 3, name: 'C', lng: 3, lat: 3 },
    { id: 1, name: 'A', lng: 1, lat: 1 },
  ]

  assert.deepEqual(
    getRouteMarkerSpots(allSpots, routeWaypoints).map((spot) => spot.id),
    [3, 1],
  )
})

test('does not initialize home map from the route-close watcher during route rendering', () => {
  assert.equal(
    shouldInitializeHomeMapAfterRoutesClose({
      isRenderingRoute: true,
      showMap: false,
      showStats: false,
      currentDetailId: null,
    }),
    false,
  )
})

test('initializes home map when routes close without selecting a route', () => {
  assert.equal(
    shouldInitializeHomeMapAfterRoutesClose({
      isRenderingRoute: false,
      showMap: false,
      showStats: false,
      currentDetailId: null,
    }),
    true,
  )
})
