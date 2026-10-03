import http from 'node:http'

export const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash'
export const DEFAULT_PROXY_PORT = 3001

export function buildDeepSeekRequest({
  message,
  history = [],
  context = '',
  model = DEFAULT_DEEPSEEK_MODEL,
}) {
  const safeHistory = Array.isArray(history)
    ? history
      .filter(item => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string')
      .slice(-8)
      .map(item => ({ role: item.role, content: item.content.slice(0, 1200) }))
    : []

  return {
    model,
    stream: false,
    thinking: { type: 'disabled' },
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: [
          '你是“云游南疆”文旅智能导览平台的 AI 小助手。',
          '请优先根据平台提供的南疆景点、路线、门票、开放时间和文旅故事回答。',
          '回答要简洁、准确、适合游客阅读。涉及平台数据之外的信息时，请说明可能需要以官方实时信息为准。',
          context ? `平台上下文：\n${context}` : '',
        ].filter(Boolean).join('\n'),
      },
      ...safeHistory,
      {
        role: 'user',
        content: String(message || '').trim(),
      },
    ],
  }
}

export function extractDeepSeekReply(payload) {
  const reply = payload?.choices?.[0]?.message?.content?.trim()
  if (!reply) {
    throw new Error('DeepSeek 返回空回复')
  }
  return reply
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  })
  res.end(JSON.stringify(payload))
}

export function createChatHandler({
  apiKey = process.env.DEEPSEEK_API_KEY,
  model = process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
  baseUrl = process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function handleChat(body) {
    if (!apiKey) {
      throw new Error('缺少 DEEPSEEK_API_KEY')
    }
    if (!body?.message || typeof body.message !== 'string') {
      throw new Error('缺少有效 message')
    }

    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildDeepSeekRequest({
        message: body.message,
        history: body.history,
        context: body.context,
        model,
      })),
    })

    const responseText = await response.text()
    let payload
    try {
      payload = responseText ? JSON.parse(responseText) : {}
    } catch (error) {
      throw new Error('DeepSeek 返回了无法解析的响应')
    }

    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || `DeepSeek 请求失败 (${response.status})`
      throw new Error(message)
    }

    return { reply: extractDeepSeekReply(payload) }
  }
}

export function createServer({
  chatHandler = createChatHandler(),
} = {}) {
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      writeJson(res, 204, {})
      return
    }

    if (req.method !== 'POST' || req.url !== '/api/chat') {
      writeJson(res, 404, { error: 'Not Found' })
      return
    }

    try {
      const body = await readJsonBody(req)
      const payload = await chatHandler(body)
      writeJson(res, 200, payload)
    } catch (error) {
      writeJson(res, 500, { error: error.message || 'AI 服务暂不可用' })
    }
  })
}
