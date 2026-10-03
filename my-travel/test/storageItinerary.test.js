import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readStored, writeStored, validIds } from '../src/utils/storage.js'
import {
  itineraryText,
  sharePath,
  validateSavedRoute,
  validTravelDate,
} from '../src/utils/itinerary.js'
import { spots } from '../src/data.js'
import { recommendedRoutes } from '../src/data/routes.js'
import { existsSync } from 'node:fs'

test('storage recovers corrupt or wrongly typed data and reports write failures', () => {
  assert.deepEqual(readStored('favorites', [], validIds, { getItem: () => '{broken' }), [])
  assert.deepEqual(readStored('favorites', [], validIds, { getItem: () => '{"x":1}' }), [])
  assert.deepEqual(readStored('favorites', [], validIds, { getItem: () => '[1,2]' }), [1, 2])
  assert.deepEqual(
    readStored('favorites', [], validIds, {
      getItem: () => {
        throw Error()
      },
    }),
    [],
  )
  assert.equal(
    writeStored('x', [], {
      setItem: () => {
        throw Error()
      },
    }),
    false,
  )
})

test('share schema rejects unknown routes and impossible dates', () => {
  assert.equal(validTravelDate('2026-02-30'), false)
  assert.equal(validTravelDate('2028-02-29'), true)
  assert.equal(validateSavedRoute({ routeId: 999, startDate: '' }), false)
  assert.equal(validateSavedRoute({ routeId: 1, startDate: 'x' }), false)
  assert.equal(sharePath(1, '2026-10-20'), '/routes?route=1&date=2026-10-20')
  assert.equal(sharePath(1, 'bad'), '/routes?route=1')
  assert.throws(() => sharePath(999), /无效/)
})

test('downloaded itinerary preserves order and labels unresolved travel information', () => {
  const text = itineraryText(recommendedRoutes[0], '2026-10-20')
  assert.match(text, /2026-10-20/)
  assert.match(text, /方案草稿/)
  assert.ok(text.indexOf('克孜尔') < text.indexOf('喀什古城'))
  assert.match(text, /路线示意/)
})

test('all published records have explicit review and coordinate status and existing images', () => {
  const ids = new Set(spots.map((spot) => spot.id))
  assert.equal(ids.size, spots.length)
  for (const spot of spots) {
    assert.ok(['source-reviewed', 'draft'].includes(spot.status))
    assert.equal(spot.coordinateStatus, 'reference')
    assert.equal(spot.imageLicense, 'pending')
    assert.match(spot.ticket, /核验/)
    assert.ok(existsSync(new URL(`../public${spot.image}`, import.meta.url)))
    if (spot.status === 'source-reviewed') {
      assert.ok(validTravelDate(spot.reviewedAt))
      assert.ok(spot.sources.length)
      assert.ok(spot.sources.every((source) => new URL(source.url).protocol === 'https:'))
    }
  }
  for (const route of recommendedRoutes) {
    assert.ok(route.spotIds.every((id) => ids.has(id)))
    assert.equal(route.days, route.schedule.length)
    assert.deepEqual(
      route.schedule.flatMap((day) => day.spotIds),
      route.spotIds,
    )
    assert.equal(route.status, 'draft')
    assert.equal(route.routeGeometry, undefined)
  }
})
