export const NANJIANG_CENTER = [80.6, 39.2]
export const NANJIANG_BOUNDS = [
  [73.2, 35.5],
  [88.8, 42.8],
]
export const NANJIANG_ZOOM = 6.6
export const NANJIANG_MAP_STYLE = 'amap://styles/whitesmoke'

export const NANJIANG_REGIONS = [
  {
    label: '全部',
    value: 'all',
    center: NANJIANG_CENTER,
    zoom: NANJIANG_ZOOM,
    adcodePrefixes: [],
  },
  {
    label: '喀什',
    value: 'kashgar',
    center: [75.99, 39.47],
    zoom: 8,
    adcodePrefixes: ['6531'],
  },
  {
    label: '帕米尔',
    value: 'pamirs',
    center: [75.1, 38.15],
    zoom: 8,
    adcodePrefixes: ['6530'],
  },
  {
    label: '和田',
    value: 'hotan',
    center: [79.8, 37.2],
    zoom: 8,
    adcodePrefixes: ['6532'],
  },
  {
    label: '阿克苏',
    value: 'aksu',
    center: [82.1, 41.2],
    zoom: 7.4,
    adcodePrefixes: ['6529', '659002'],
  },
  {
    label: '巴州',
    value: 'bayingolin',
    center: [85.3, 41.1],
    zoom: 7.4,
    adcodePrefixes: ['6528'],
  },
]

export function getNanjiangMapOptions(overrides = {}) {
  return {
    zoom: NANJIANG_ZOOM,
    center: NANJIANG_CENTER,
    viewMode: '2D',
    showIndoorMap: false,
    zooms: [6, 11],
    mapStyle: NANJIANG_MAP_STYLE,
    ...overrides,
  }
}

export function getNanjiangRegionByValue(value) {
  return NANJIANG_REGIONS.find((region) => region.value === value) || null
}

export function getSpotRegionValue(spot) {
  if (spot?.region) return spot.region
  const adcode = String(spot?.adcode || '')
  if (!adcode) return 'all'

  if (adcode.startsWith('653022')) return 'pamirs'
  if (adcode.startsWith('6530')) return 'pamirs'
  if (adcode.startsWith('6531')) return 'kashgar'
  if (adcode.startsWith('6532')) return 'hotan'
  if (adcode.startsWith('6529') || adcode === '659002') return 'aksu'
  if (adcode.startsWith('6528')) return 'bayingolin'
  return 'all'
}

export function getNanjiangRegionSpots(allSpots, regionValue) {
  if (!Array.isArray(allSpots)) return []
  if (!regionValue || regionValue === 'all') return allSpots
  return allSpots.filter((spot) => getSpotRegionValue(spot) === regionValue)
}

export function shouldShowHomeSpotLabel({
  zoom = NANJIANG_ZOOM,
  isRouteMode = false,
  isRouteSpot = false,
  isHighlighted = false,
} = {}) {
  if (isRouteMode && isRouteSpot) return true
  if (!isHighlighted) return false
  return zoom >= 6.8
}

export function getNanjiangBoundsPath() {
  const [[west, south], [east, north]] = NANJIANG_BOUNDS
  return [
    [west, south],
    [west, north],
    [east, north],
    [east, south],
  ]
}
