import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createApplication } from '../server/application.js'
import { openStore } from '../server/database.js'
import { readStored, writeStored, readText } from '../src/utils/storage.js'

async function fixture(t, options = {}) {
  const app = createApplication({
    filename: ':memory:',
    adminPassword: 'management-test-password',
    rateLimit: 10000,
    ...options,
  })
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => app.server.close(resolve)))
  const base = `http://127.0.0.1:${app.server.address().port}`
  const request = async (url, { cookie, method = 'GET', body, headers = {} } = {}) => {
    const response = await fetch(base + url, {
      method,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const value = await response.json().catch(() => ({}))
    return { response, value, cookie: response.headers.get('set-cookie')?.split(';')[0] }
  }
  const login = async () => {
    const result = await request('/api/admin/login', {
      method: 'POST',
      body: { username: 'admin', password: 'management-test-password' },
    })
    assert.equal(result.response.status, 200)
    return result.cookie
  }
  return { ...app, request, login, base }
}

test('database migrates once, preserves changes and rejects stale edits', () => {
  const filename = path.join(mkdtempSync(path.join(tmpdir(), 'yunyou-db-test-')), 'test.sqlite')
  const one = openStore(filename)
  assert.equal(one.catalog().spots.length, 12)
  assert.equal(one.catalog().articles.length, 8)
  const article = one.list('articles')[0]
  one.saveContent('articles', { ...article, title: '修订标题' }, article.version, 'test')
  assert.throws(() => one.saveContent('articles', article, article.version, 'test'), /已被更新/)
  one.close()
  const two = openStore(filename)
  assert.equal(two.list('articles')[0].title, '修订标题')
  two.close()
})

test('public catalog supports gzip, ETag and excludes unpublished data', async (t) => {
  const app = await fixture(t)
  const result = await app.request('/api/catalog')
  assert.equal(result.response.status, 200)
  assert.equal(result.value.articles.length, 8)
  assert.equal(result.response.headers.get('content-encoding'), 'gzip')
  const etag = result.response.headers.get('etag')
  const notChanged = await app.request('/api/catalog', { headers: { 'if-none-match': etag } })
  assert.equal(notChanged.response.status, 304)
  const cookie = await app.login()
  const article = app.store.list('articles')[0]
  const saved = await app.request(`/api/admin/articles/${article.id}`, {
    cookie,
    method: 'PUT',
    body: { ...article, published: false },
  })
  assert.equal(saved.response.status, 200)
  const changed = await app.request('/api/catalog', { headers: { 'if-none-match': etag } })
  assert.equal(changed.response.status, 200)
  assert.equal(changed.value.articles.length, 7)
  assert.equal((await app.request('/api/admin/overview')).response.status, 401)
})

test('administrator session, foreign-origin checks and password rotation are enforced', async (t) => {
  const app = await fixture(t)
  assert.equal(
    (
      await app.request('/api/admin/login', {
        method: 'POST',
        body: { username: 'admin', password: 'wrong' },
      })
    ).response.status,
    401,
  )
  const cookie = await app.login()
  assert.ok(cookie.startsWith('yunyou_admin='))
  assert.equal((await app.request('/api/admin/session', { cookie })).value.username, 'admin')
  assert.equal(
    (
      await app.request('/api/admin/overview', {
        cookie,
        headers: { origin: 'https://foreign.invalid' },
      })
    ).response.status,
    403,
  )
  const password = await app.request('/api/admin/password', {
    cookie,
    method: 'PUT',
    body: { currentPassword: 'management-test-password', password: 'new-management-test-password' },
  })
  assert.equal(password.response.status, 200)
  assert.equal((await app.request('/api/admin/session', { cookie })).response.status, 401)
  assert.equal(
    (
      await app.request('/api/admin/login', {
        method: 'POST',
        body: { username: 'admin', password: 'new-management-test-password' },
      })
    ).response.status,
    200,
  )
})

test('content validation, references and optimistic concurrency protect edits', async (t) => {
  const app = await fixture(t)
  const cookie = await app.login()
  const spot = app.store.list('spots')[0]
  assert.equal(
    (
      await app.request('/api/admin/spots/1', {
        cookie,
        method: 'PUT',
        body: { ...spot, lng: null },
      })
    ).response.status,
    400,
  )
  const updated = await app.request('/api/admin/spots/1', {
    cookie,
    method: 'PUT',
    body: { ...spot, name: '喀什古城（核对版）' },
  })
  assert.equal(updated.response.status, 200)
  assert.equal(
    (await app.request('/api/admin/spots/1', { cookie, method: 'PUT', body: spot })).response
      .status,
    409,
  )
  assert.equal(
    (await app.request('/api/admin/spots/1', { cookie, method: 'DELETE' })).response.status,
    409,
  )
  const article = app.store.list('articles')[0]
  assert.equal(
    (
      await app.request('/api/admin/articles/1', {
        cookie,
        method: 'PUT',
        body: { ...article, sources: [{ title: '不可信协议', url: 'javascript:alert(1)' }] },
      })
    ).response.status,
    400,
  )
  const catalog = (await app.request('/api/catalog')).value
  assert.equal(catalog.spots[0].name, '喀什古城（核对版）')
})

test('visitor consent, isolation, private maintenance notes and erasure work together', async (t) => {
  const app = await fixture(t)
  const admin = await app.login()
  const noConsent = await app.request('/api/visitor', {
    method: 'POST',
    body: { nickname: '游客' },
  })
  assert.equal(noConsent.response.status, 400)
  const a = await app.request('/api/visitor', {
    method: 'POST',
    body: { nickname: '游客甲', city: '成都', interests: ['手工艺'], consent: true },
  })
  const b = await app.request('/api/visitor', {
    method: 'POST',
    body: { nickname: '游客乙', consent: true },
  })
  assert.ok(a.cookie)
  assert.ok(!JSON.stringify(a.value).includes('token_hash'))
  const itinerary = await app.request('/api/visitor/itineraries', {
    cookie: a.cookie,
    method: 'POST',
    body: { routeId: 1, startDate: '2026-12-01' },
  })
  assert.equal(itinerary.value.itineraries.length, 1)
  assert.equal(
    (
      await app.request('/api/visitor/itineraries', {
        cookie: a.cookie,
        method: 'POST',
        body: { routeId: 999 },
      })
    ).response.status,
    400,
  )
  assert.equal(
    (await app.request('/api/visitor', { cookie: b.cookie })).value.itineraries.length,
    0,
  )
  await app.request(`/api/visitor/itineraries/${itinerary.value.itineraries[0].id}`, {
    cookie: b.cookie,
    method: 'DELETE',
  })
  assert.equal(
    (await app.request('/api/visitor', { cookie: a.cookie })).value.itineraries.length,
    1,
  )
  await app.request(`/api/admin/visitors/${a.value.profile.id}`, {
    cookie: admin,
    method: 'PUT',
    body: { adminNote: '内部维护说明' },
  })
  assert.ok(
    !JSON.stringify((await app.request('/api/visitor', { cookie: a.cookie })).value).includes(
      '内部维护说明',
    ),
  )
  const adminList = await app.request('/api/admin/visitors', { cookie: admin })
  assert.equal(adminList.value.total, 2)
  assert.ok(JSON.stringify(adminList.value).includes('内部维护说明'))
  await app.request('/api/visitor', { cookie: a.cookie, method: 'DELETE' })
  assert.equal(app.store.db.prepare('SELECT COUNT(*) n FROM itineraries').get().n, 0)
  assert.equal((await app.request('/api/visitor', { cookie: a.cookie })).value.profile, null)
})

test('AI secrets are encrypted, published database context is used and budget survives settings changes', async (t) => {
  let upstreamRequest
  const app = await fixture(t, {
    fetchImpl: async (url, options) => {
      upstreamRequest = JSON.parse(options.body)
      return new Response(
        JSON.stringify({ choices: [{ message: { content: '依据资料的回复' } }] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    },
  })
  const cookie = await app.login()
  const article = app.store.list('articles')[0]
  app.store.saveContent(
    'articles',
    { ...article, content: '新增的经核对内容ABC' },
    article.version,
    'test',
  )
  const update = await app.request('/api/admin/ai', {
    cookie,
    method: 'PUT',
    body: { mode: 'ai', model: 'test-model', dailyLimit: 1, apiKey: 'secret-test-api-key' },
  })
  assert.equal(update.value.hasKey, true)
  assert.ok(!JSON.stringify(update.value).includes('secret-test-api-key'))
  assert.ok(
    !app.store.db
      .prepare('SELECT value FROM settings WHERE name=?')
      .get('ai')
      .value.includes('secret-test-api-key'),
  )
  const result = await app.request('/api/chat', {
    method: 'POST',
    body: { message: '介绍铜器手工艺' },
  })
  assert.equal(result.value.mode, 'ai')
  assert.equal(upstreamRequest.model, 'test-model')
  assert.match(upstreamRequest.messages[0].content, /新增的经核对内容ABC/)
  await app.request('/api/admin/ai', {
    cookie,
    method: 'PUT',
    body: { mode: 'ai', model: 'changed-model', dailyLimit: 1 },
  })
  assert.equal(
    (await app.request('/api/chat', { method: 'POST', body: { message: '介绍铜器手工艺' } }))
      .response.status,
    429,
  )
  await app.request('/api/admin/ai', {
    cookie,
    method: 'PUT',
    body: { mode: 'local', model: 'changed-model', dailyLimit: 1 },
  })
  assert.equal(
    (await app.request('/api/chat', { method: 'POST', body: { message: '铜器' } })).value.mode,
    'local',
  )
})

test('a throwing localStorage getter no longer escapes the fallback', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Disabled', 'SecurityError')
    },
  })
  try {
    assert.deepEqual(readStored('test', []), [])
    assert.equal(writeStored('test', []), false)
    assert.equal(readText('test'), '')
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else delete globalThis.localStorage
  }
})
