import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  getNanjiangMapOptions,
  getNanjiangRegionByValue,
  getNanjiangRegionSpots,
  getSpotRegionValue,
  NANJIANG_BOUNDS,
  NANJIANG_CENTER,
  NANJIANG_REGIONS,
  NANJIANG_ZOOM,
  shouldShowHomeSpotLabel,
} from '../src/utils/nanjiangMap.js'
import { spots } from '../src/data.js'

test('defines a comfortable Nanjiang map viewport', () => {
  assert.deepEqual(NANJIANG_CENTER, [80.6, 39.2])
  assert.deepEqual(NANJIANG_BOUNDS, [
    [73.2, 35.5],
    [88.8, 42.8],
  ])
  assert.equal(NANJIANG_ZOOM, 6.6)

  const options = getNanjiangMapOptions()
  assert.equal(options.viewMode, '2D')
  assert.deepEqual(options.center, NANJIANG_CENTER)
  assert.equal(options.zoom, NANJIANG_ZOOM)
  assert.deepEqual(options.zooms, [6, 11])
  assert.equal(options.showIndoorMap, false)
})

test('groups spots into Nanjiang guide regions', () => {
  assert.deepEqual(
    NANJIANG_REGIONS.map((region) => region.value),
    ['all', 'kashgar', 'pamirs', 'hotan', 'aksu', 'bayingolin'],
  )

  assert.equal(getSpotRegionValue({ adcode: '653101' }), 'kashgar')
  assert.equal(getSpotRegionValue({ adcode: '653022' }), 'pamirs')
  assert.equal(getSpotRegionValue({ adcode: '653201' }), 'hotan')
  assert.equal(getSpotRegionValue({ adcode: '652923' }), 'aksu')
  assert.equal(getSpotRegionValue({ adcode: '652823' }), 'bayingolin')
})

test('filters local spots by Nanjiang region', () => {
  const kashgarSpots = getNanjiangRegionSpots(spots, 'kashgar')
  const pamirsSpots = getNanjiangRegionSpots(spots, 'pamirs')
  const hotanSpots = getNanjiangRegionSpots(spots, 'hotan')

  assert.ok(kashgarSpots.some((spot) => spot.id === 1))
  assert.ok(pamirsSpots.some((spot) => spot.id === 5))
  assert.ok(hotanSpots.some((spot) => spot.id === 3))
  assert.equal(getNanjiangRegionSpots(spots, 'all').length, spots.length)
  assert.equal(getNanjiangRegionByValue('pamirs')?.label, '帕米尔')
})

test('keeps regular map labels sparse and route labels available', () => {
  assert.equal(
    shouldShowHomeSpotLabel({ zoom: 6.5, isRouteMode: false, isHighlighted: false }),
    false,
  )
  assert.equal(
    shouldShowHomeSpotLabel({ zoom: 8.5, isRouteMode: false, isHighlighted: false }),
    false,
  )
  assert.equal(
    shouldShowHomeSpotLabel({ zoom: 8.5, isRouteMode: false, isHighlighted: true }),
    true,
  )
  assert.equal(shouldShowHomeSpotLabel({ zoom: 6.5, isRouteMode: true, isRouteSpot: true }), true)
})

test('explicit regions take precedence over legacy administrative codes', () => {
  assert.equal(getSpotRegionValue({ region: 'pamirs', adcode: '653131' }), 'pamirs')
  assert.ok(getNanjiangRegionSpots(spots, 'pamirs').some((spot) => spot.id === 4))
})
