import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openStore } from '../server/database.js'
import { createApplication } from '../server/application.js'
import { localGuideReply } from '../server/knowledge.js'
import { culturalExperiences, culturalEvents } from '../server/experiences.js'

test('culture data has concrete places, participation, provenance and separate county travel', () => {
  assert.equal(culturalExperiences.length, 9)
  for (const item of culturalExperiences) {
    assert.ok(item.address && item.addressLevel && item.participation)
    assert.ok(item.confirm.length)
    assert.ok(
      item.sources.every(
        (source) => source.url.startsWith('https://') && source.publishedAt && source.fields.length,
      ),
    )
    assert.match(item.durationBasis, /编辑建议/)
    assert.equal(item.serviceStatus, '需确认当日安排')
  }
  const county = culturalExperiences.find((item) => item.scope === 'county')
  assert.match(county.address, /英吉沙县芒辛镇恰克日库依村/)
  assert.match(county.participation, /往返交通/)
  assert.ok(culturalEvents.every((item) => item.status.startsWith('past')))
  assert.match(culturalExperiences.find((item) => item.id === 3).address, /天山西路28号/)
})
test('second migration adds culture data without replacing existing editorial revisions', () => {
  const filename = path.join(mkdtempSync(path.join(tmpdir(), 'yunyou-culture-')), 'db.sqlite')
  const one = openStore(filename)
  const article = one.list('articles')[0]
  one.saveContent('articles', { ...article, title: '保留人工修订' }, article.version, 'test')
  one.db.exec(
    "DELETE FROM content WHERE kind='experiences'; DELETE FROM migrations WHERE version=2;",
  )
  one.close()
  const two = openStore(filename)
  assert.equal(two.catalog().experiences.length, 9)
  assert.equal(two.list('articles')[0].title, '保留人工修订')
  two.close()
  const three = openStore(filename)
  assert.equal(three.catalog().experiences.length, 9)
  three.close()
})
test('assistant answers about a named venue with its address and participation context', () => {
  const store = openStore()
  const tea = localGuideReply('百年老茶馆在哪里', store.catalog())
  assert.match(tea.reply, /吾斯塘博依路/)
  assert.ok(tea.sources.length)
  const craft = localGuideReply('哪里可以做土陶手作', store.catalog())
  assert.match(craft.reply, /土陶/)
  assert.match(craft.reply, /出发前确认/)
  store.close()
})
test('authenticated culture edits reach the public catalog and publishing rules apply', async (t) => {
  const app = createApplication({
    filename: ':memory:',
    forceLocal: true,
    rateLimit: 10000,
    adminPassword: 'culture-management-password',
  })
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => app.server.close(resolve)))
  const base = `http://127.0.0.1:${app.server.address().port}`
  const login = await fetch(base + '/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'culture-management-password' }),
  })
  const cookie = login.headers.get('set-cookie').split(';')[0]
  const entry = app.store.list('experiences')[0]
  const update = await fetch(base + '/api/admin/experiences/1', {
    method: 'PUT',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ ...entry, name: '高台民居文化漫游', published: false }),
  })
  assert.equal(update.status, 200)
  const catalog = await (await fetch(base + '/api/catalog')).json()
  assert.equal(catalog.experiences.length, 8)
  const invalid = await fetch(base + '/api/admin/experiences', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ ...entry, id: undefined, sources: [] }),
  })
  assert.equal(invalid.status, 400)
  const missingProvenance = await fetch(base + '/api/admin/experiences', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({
      ...entry,
      id: undefined,
      sources: entry.sources.map((source) => ({ ...source, fields: [] })),
    }),
  })
  assert.equal(missingProvenance.status, 400)
  assert.equal((await fetch(base + '/api/admin/experiences')).status, 401)
})
