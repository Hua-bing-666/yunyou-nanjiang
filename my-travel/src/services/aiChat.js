export const AI_SERVICE_UNAVAILABLE_MESSAGE = 'AI 服务暂不可用，请稍后再试'

export async function requestChat({ message, history = [], fetchImpl = globalThis.fetch, signal }) {
  const response = await fetchImpl('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: signal || AbortSignal.timeout(30000),
    body: JSON.stringify({
      message,
      history: history
        .filter(
          (item) => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string',
        )
        .slice(-8)
        .map((item) => ({ role: item.role, content: item.content.slice(0, 1200) })),
    }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || typeof payload.reply !== 'string' || !payload.reply.trim())
    throw new Error(
      response.status === 429
        ? '请求频繁或今日额度已用完，请稍后再试'
        : AI_SERVICE_UNAVAILABLE_MESSAGE,
    )
  return payload
}

export async function sendChatMessage(options) {
  return (await requestChat(options)).reply
}
