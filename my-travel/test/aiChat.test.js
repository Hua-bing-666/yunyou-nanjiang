import assert from 'node:assert/strict'
import { test } from 'node:test'

import { AI_SERVICE_UNAVAILABLE_MESSAGE, sendChatMessage } from '../src/services/aiChat.js'
import { buildTrustedContext as buildNanjiangContext } from '../server/knowledge.js'
import { shouldOpenChatAfterPointerUp } from '../src/utils/assistantInteraction.js'

test('builds compact Nanjiang context from spots and routes', () => {
  const context = buildNanjiangContext()

  assert.match(context, /喀什古城/)
  assert.match(context, /门票/)
  assert.match(context, /南疆人文经典线/)
  assert.ok(context.length < 9000)
})

test('sends message and bounded history without client context', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return new Response(JSON.stringify({ reply: '喀什古城免费开放。' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const reply = await sendChatMessage({
    message: '喀什古城门票多少？',
    history: [{ role: 'assistant', content: '你好' }],
    fetchImpl,
  })

  assert.equal(reply, '喀什古城免费开放。')
  assert.equal(calls[0].url, '/api/chat')
  assert.equal(calls[0].options.method, 'POST')
  const body = JSON.parse(calls[0].options.body)
  assert.equal(body.message, '喀什古城门票多少？')
  assert.equal(body.history.length, 1)
  assert.equal(body.context, undefined)
})

test('throws clear unavailable error when chat proxy fails', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: 'missing key' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })

  await assert.rejects(
    () => sendChatMessage({ message: '你好', fetchImpl }),
    new RegExp(AI_SERVICE_UNAVAILABLE_MESSAGE),
  )
})

test('does not open chat after a drag gesture', () => {
  assert.equal(shouldOpenChatAfterPointerUp(10, 10, 12, 13), true)
  assert.equal(shouldOpenChatAfterPointerUp(10, 10, 40, 12), false)
})
