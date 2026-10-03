import { spots } from '../data.js'
import { recommendedRoutes } from '../data/routes.js'

export const AI_SERVICE_UNAVAILABLE_MESSAGE = 'AI 服务暂不可用，请稍后再试'

export function buildNanjiangContext() {
  const spotLines = spots.map(spot => [
    `${spot.name}：${spot.shortDesc || spot.description || ''}`,
    `地址：${spot.address || '暂无'}`,
    `门票：${spot.ticket || '暂无'}`,
    `开放时间：${spot.opening || '暂无'}`,
    `故事：${(spot.story || '').slice(0, 120)}`,
  ].join('；'))

  const routeLines = recommendedRoutes.map(route => (
    `${route.name}：${route.spotNames.join(' → ')}；建议 ${route.days} 天；推荐指数 ${route.stars}`
  ))

  return [
    '云游南疆平台本地资料如下。',
    '景点：',
    ...spotLines,
    '推荐路线：',
    ...routeLines,
  ].join('\n').slice(0, 8500)
}

export async function sendChatMessage({
  message,
  history = [],
  fetchImpl = globalThis.fetch,
}) {
  const response = await fetchImpl('/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history: history
        .filter(item => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string')
        .slice(-8),
      context: buildNanjiangContext(),
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.reply) {
    throw new Error(AI_SERVICE_UNAVAILABLE_MESSAGE)
  }

  return payload.reply
}
