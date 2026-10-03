import { spots } from '../src/data/spots.js'
import { recommendedRoutes } from '../src/data/routes.js'
import { ServiceError, upstreamJson } from './errors.js'
import { routeMapIssue } from '../src/utils/mapAvailability.js'

export function createAMapHandlers({
  apiKey = process.env.AMAP_WEBSERVICE_KEY,
  fetchImpl = globalThis.fetch,
  timeoutMs = 12000,
} = {}) {
  const cache = new Map()
  async function request(endpoint, params) {
    if (!apiKey) throw new ServiceError(503, '地图服务暂不可用，可继续浏览与保存行程')
    const url = new URL(`https://restapi.amap.com/v3/${endpoint}`)
    for (const [key, value] of Object.entries({ ...params, key: apiKey }))
      url.searchParams.set(key, value)
    const result = await upstreamJson(url, {}, fetchImpl, timeoutMs)
    if (result.status !== '1') throw new ServiceError(502, '地图服务暂不可用，请稍后重试')
    return result
  }
  return {
    async weather(adcode) {
      if (!/^\d{6}$/.test(adcode) || !spots.some((spot) => spot.adcode === adcode))
        throw new ServiceError(400, '无效地区')
      const key = `weather:${adcode}`
      const old = cache.get(key)
      if (old && old.expires > Date.now()) return old.value
      const result = await request('weather/weatherInfo', { city: adcode, extensions: 'base' })
      const live = result.lives?.[0]
      if (!live || !Number.isFinite(Number(live.temperature)))
        throw new ServiceError(502, '天气暂不可用')
      const value = {
        temperature: String(live.temperature),
        weather: String(live.weather || ''),
        reportTime: String(live.reporttime || ''),
        source: '高德天气',
      }
      cache.set(key, { value, expires: Date.now() + 10 * 60000 })
      return value
    },
    async route(routeId) {
      const route = recommendedRoutes.find((item) => item.id === Number(routeId))
      if (!route) throw new ServiceError(400, '无效路线')
      const issue = routeMapIssue(route, spots)
      if (issue) throw new ServiceError(422, issue)
      const key = `route:${route.id}`
      const old = cache.get(key)
      if (old && old.expires > Date.now()) return old.value
      const waypoints = route.spotIds.map((id) => spots.find((spot) => spot.id === id))
      const segments = []
      const path = []
      for (let index = 1; index < waypoints.length; index++) {
        const origin = waypoints[index - 1]
        const destination = waypoints[index]
        const result = await request('direction/driving', {
          origin: `${origin.lng},${origin.lat}`,
          destination: `${destination.lng},${destination.lat}`,
          extensions: 'base',
        })
        const leg = result.route?.paths?.[0]
        if (
          !leg ||
          !Number.isFinite(Number(leg.distance)) ||
          !Number.isFinite(Number(leg.duration))
        )
          throw new ServiceError(502, '道路规划暂不可用')
        const geometry = (leg.steps || []).flatMap((step) =>
          String(step.polyline || '')
            .split(';')
            .filter(Boolean)
            .map((point) => point.split(',').map(Number)),
        )
        if (
          geometry.length < 2 ||
          geometry.some(
            (point) =>
              point.length !== 2 ||
              point.some((value) => !Number.isFinite(value)) ||
              Math.abs(point[0]) > 180 ||
              Math.abs(point[1]) > 90,
          )
        )
          throw new ServiceError(502, '道路规划暂不可用')
        path.push(...geometry)
        segments.push({
          from: origin.name,
          to: destination.name,
          distance: Number(leg.distance),
          duration: Number(leg.duration),
        })
      }
      const value = {
        path,
        segments,
        source: '高德道路规划',
        fetchedAt: new Date().toISOString(),
        notice: '道路结果基于原项目参考点位，点位、通行与行程可执行性仍待核验',
      }
      cache.set(key, { value, expires: Date.now() + 30 * 60000 })
      return value
    },
  }
}
