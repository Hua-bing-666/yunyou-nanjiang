import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildDeepSeekRequest,
  createServer,
  createChatHandler,
  extractDeepSeekReply,
} from '../server/deepseekProxy.js'

test('builds DeepSeek chat completion request with default model and system context', () => {
  const request = buildDeepSeekRequest({
    message: '推荐路线',
    history: [{ role: 'assistant', content: '你好' }],
    context: '云游南疆景点数据',
  })

  assert.equal(request.model, 'deepseek-v4-flash')
  assert.equal(request.stream, false)
  assert.deepEqual(request.thinking, { type: 'disabled' })
  assert.equal(request.messages.at(-1).role, 'user')
  assert.equal(request.messages.at(-1).content, '推荐路线')
  assert.match(request.messages[0].content, /云游南疆景点数据/)
})

test('extracts reply from DeepSeek response', () => {
  const reply = extractDeepSeekReply({
    choices: [{ message: { content: '可以先去喀什古城。' } }],
  })

  assert.equal(reply, '可以先去喀什古城。')
})

test('rejects empty DeepSeek response content', () => {
  assert.throws(() => extractDeepSeekReply({ choices: [{ message: { content: '' } }] }), /空回复/)
})

test('chat handler calls DeepSeek endpoint and returns normalized reply', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return new Response(JSON.stringify({
      choices: [{ message: { content: '这是 DeepSeek 回复。' } }],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const handler = createChatHandler({
    apiKey: 'test-key',
    fetchImpl,
    baseUrl: 'https://api.deepseek.com',
  })

  const response = await handler({
    message: '喀什怎么玩？',
    context: '云游南疆',
    history: [],
  })

  assert.deepEqual(response, { reply: '这是 DeepSeek 回复。' })
  assert.equal(calls[0].url, 'https://api.deepseek.com/chat/completions')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-key')
  const body = JSON.parse(calls[0].options.body)
  assert.equal(body.model, 'deepseek-v4-flash')
})

test('http server exposes POST /api/chat with normalized json response', async () => {
  const server = createServer({
    chatHandler: async body => ({ reply: `收到：${body.message}` }),
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '测试' }),
    })
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.deepEqual(payload, { reply: '收到：测试' })
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})
