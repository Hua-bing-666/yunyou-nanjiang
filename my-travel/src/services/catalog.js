import { reactive } from 'vue'
import { readStored, writeStored } from '../utils/storage.js'

export const spots = reactive([])
export const recommendedRoutes = reactive([])
export const articles = reactive([])
export const experiences = reactive([])
export const cultureEvents = reactive([])
export const catalogState = reactive({ loading: true, error: '', cached: false })
const valid = (value) =>
  value &&
  Array.isArray(value.spots) &&
  Array.isArray(value.routes) &&
  Array.isArray(value.experiences) &&
  Array.isArray(value.articles)
function apply(value) {
  spots.splice(0, spots.length, ...value.spots)
  recommendedRoutes.splice(0, recommendedRoutes.length, ...value.routes)
  articles.splice(0, articles.length, ...value.articles)
  experiences.splice(0, experiences.length, ...(value.experiences || []))
  cultureEvents.splice(0, cultureEvents.length, ...(value.events || []))
}
export async function loadCatalog() {
  catalogState.loading = true
  catalogState.error = ''
  const cached = readStored('yunyou_public_catalog', null, (entry) => valid(entry?.data))
  try {
    const response = await fetch('/api/catalog', {
      signal: AbortSignal.timeout(8000),
      headers: cached?.etag ? { 'If-None-Match': cached.etag } : {},
    })
    const value = response.status === 304 ? cached.data : await response.json()
    if ((!response.ok && response.status !== 304) || !valid(value))
      throw new Error('catalog unavailable')
    apply(value)
    catalogState.cached = false
    writeStored('yunyou_public_catalog', {
      etag: response.headers.get('etag') || cached?.etag,
      data: value,
    })
  } catch {
    if (cached) {
      apply(cached.data)
      catalogState.cached = true
    } else catalogState.error = '暂时无法取得目的地资料，请检查网络后重试。'
  } finally {
    catalogState.loading = false
  }
}
