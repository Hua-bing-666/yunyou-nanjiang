import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spots } from '../src/data/spots.js'
import { recommendedRoutes } from '../src/data/routes.js'
import { hasMapPoint, waypointMapIssue, routeMapIssue } from '../src/utils/mapAvailability.js'
import { buildRoutePath } from '../src/utils/routeDisplay.js'
import { itineraryText } from '../src/utils/itinerary.js'
import { createAMapHandlers } from '../server/amap.js'
import { buildTrustedContext, localGuideReply, referenceSources } from '../server/knowledge.js'
import { createChatHandler, createServer } from '../server/deepseekProxy.js'

test('map availability rejects missing, invalid and suspended points without dropping stops', () => {
  const valid = { name: 'A', coordinateStatus: 'reference', lng: 75, lat: 39 }
  for (const value of [
    null,
    { ...valid, lng: NaN },
    { ...valid, lat: null },
    { ...valid, lng: 181 },
    { ...valid, coordinateStatus: 'suspended' },
  ]) {
    assert.equal(hasMapPoint(value), false)
    assert.match(waypointMapIssue([valid, value, valid]), /暂不提供地图连线/)
  }
  assert.equal(waypointMapIssue([valid, { ...valid, coordinateStatus: 'verified' }]), '')
})

test('suspended route has no partial line or provider geometry and exported draft explains why', () => {
  const route = recommendedRoutes.find((item) => item.id === 2)
  const waypoints = route.spotIds.map((id) => spots.find((spot) => spot.id === id))
  assert.match(routeMapIssue(route, spots), /白沙湖.*慕士塔格峰/)
  assert.deepEqual(
    buildRoutePath(waypoints, [
      [75, 39],
      [76, 40],
    ]),
    [],
  )
  const text = itineraryText(route)
  assert.match(text, /地图状态.*暂不提供地图连线/)
  assert.ok(text.includes('白沙湖') && text.includes('慕士塔格峰') && text.includes('石头城'))
})

test('suspended route is rejected before spending any provider quota', async () => {
  let calls = 0
  const handlers = createAMapHandlers({
    apiKey: 'test',
    fetchImpl: async () => {
      calls++
      throw Error('should not call provider')
    },
  })
  await assert.rejects(
    () => handlers.route('2'),
    (error) => error.status === 422 && /点位待核验/.test(error.message),
  )
  assert.equal(calls, 0)
})

test('route HTTP API preserves the blocked status and a useful explanation', async () => {
  const server = createServer({
    chatHandler: createChatHandler({ apiKey: '' }),
    amapHandlers: createAMapHandlers({ apiKey: '' }),
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/route?id=2`)
    assert.equal(response.status, 422)
    assert.match((await response.json()).error, /暂不提供地图连线/)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('assistant finds old names and distinguishes two Hotan destinations instead of matching a city prefix', () => {
  const old = localGuideReply('轮台胡杨林有什么特色？')
  assert.match(old.reply, /塔里木胡杨林公园/)
  assert.ok(old.sources.some((source) => new URL(source.url).hostname === 'www.xjlt.gov.cn'))
  const tuancheng = referenceSources('和田团城的建筑')
  const village = referenceSources('和田团结新村是什么？')
  assert.equal(tuancheng.length, 1)
  assert.equal(village.length, 2)
  assert.ok(village.every((source) => !tuancheng.some((item) => item.url === source.url)))
  const context = buildTrustedContext()
  for (const spot of spots) assert.ok(context.includes(spot.name), `Missing ${spot.name} context`)
})
