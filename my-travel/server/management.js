import { randomBytes } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { digest, verifyPassword, hashPassword } from './database.js'
import { ServiceError } from './errors.js'
import { validateContent, validateProfile, text, validDate } from './validation.js'

const unauthorized = () => {
  throw new ServiceError(401, '请先登录管理后台')
}
const cookies = (req) =>
  Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((value) => value.trim().split('=')),
  )
function setCookie(req, res, name, value, maxAge) {
  // HTTPS proxy deployments set COOKIE_SECURE=1; local HTTP remains usable.
  res.setHeader(
    'set-cookie',
    `${name}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${req.socket.encrypted || process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`,
  )
}
const visitorRow = (row) =>
  row
    ? { id: row.id, ...JSON.parse(row.body), createdAt: row.created_at, updatedAt: row.updated_at }
    : null
export function createManagement({ store, aiStatus, aiTest, aiQuery } = {}) {
  function admin(req) {
    const token = cookies(req).yunyou_admin
    if (!token) unauthorized()
    const row = store.db
      .prepare('SELECT username,expires FROM sessions WHERE token_hash=?')
      .get(digest(token))
    if (!row || row.expires < Date.now()) unauthorized()
    return row.username
  }
  function visitor(req) {
    const token = cookies(req).yunyou_visitor
    return token
      ? store.db.prepare('SELECT * FROM visitors WHERE token_hash=?').get(digest(token))
      : null
  }
  const itineraries = (id) =>
    store.db
      .prepare(
        'SELECT id,route_id routeId,start_date startDate,created_at createdAt FROM itineraries WHERE visitor_id=? ORDER BY id DESC',
      )
      .all(id)
  return async function handle(req, res, url, { readJson, writeJson }) {
    const route = url.pathname
    if (
      !['/api/catalog', '/api/visitor'].includes(route) &&
      !route.startsWith('/api/visitor/') &&
      !route.startsWith('/api/admin/')
    )
      return false
    const respond = (payload, status = 200) => {
      writeJson(res, status, payload)
      return true
    }
    if (route === '/api/catalog' && req.method === 'GET') {
      const body = JSON.stringify(store.catalog())
      const etag = `"${digest(body)}"`
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { etag, 'cache-control': 'private, no-cache' })
        res.end()
        return true
      }
      const gzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '')
      const output = gzip ? gzipSync(body) : Buffer.from(body)
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'content-length': output.length,
        etag,
        vary: 'Accept-Encoding',
        'cache-control': 'private, no-cache',
        ...(gzip ? { 'content-encoding': 'gzip' } : {}),
      })
      res.end(output)
      return true
    }
    if (route === '/api/admin/login' && req.method === 'POST') {
      const body = await readJson()
      const username = text(body.username, 100)
      const password = text(body.password, 256)
      const row = store.db
        .prepare('SELECT password_hash FROM admins WHERE username=?')
        .get(username)
      // The same expensive hash calculation for unknown users limits enumeration by timing.
      const dummy = 'f'.repeat(32) + ':' + '0'.repeat(128)
      if (!verifyPassword(password, row?.password_hash || dummy) || !row)
        throw new ServiceError(401, '用户名或密码不正确')
      const token = randomBytes(32).toString('hex')
      const ttl = 8 * 3600
      store.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now())
      store.db
        .prepare('INSERT INTO sessions VALUES(?,?,?)')
        .run(digest(token), username, Date.now() + ttl * 1000)
      store.audit(username, 'login', 'admin')
      setCookie(req, res, 'yunyou_admin', token, ttl)
      return respond({ username })
    }
    if (route.startsWith('/api/admin/')) {
      const actor = admin(req)
      if (route === '/api/admin/session' && req.method === 'GET')
        return respond({ username: actor })
      if (route === '/api/admin/logout' && req.method === 'POST') {
        store.db
          .prepare('DELETE FROM sessions WHERE token_hash=?')
          .run(digest(cookies(req).yunyou_admin))
        setCookie(req, res, 'yunyou_admin', '', 0)
        return respond({ ok: true })
      }
      if (route === '/api/admin/password' && req.method === 'PUT') {
        const body = await readJson()
        const password = text(body.password, 256)
        const row = store.db.prepare('SELECT password_hash FROM admins WHERE username=?').get(actor)
        if (!verifyPassword(text(body.currentPassword, 256), row.password_hash))
          throw new ServiceError(400, '当前密码不正确')
        if (password.length < 12) throw new ServiceError(400, '新密码至少12位')
        store.db
          .prepare('UPDATE admins SET password_hash=? WHERE username=?')
          .run(hashPassword(password), actor)
        store.db.prepare('DELETE FROM sessions WHERE username=?').run(actor)
        store.audit(actor, 'change-password', 'admin')
        setCookie(req, res, 'yunyou_admin', '', 0)
        return respond({ ok: true })
      }
      if (route === '/api/admin/overview' && req.method === 'GET')
        return respond({
          spots: store.list('spots').length,
          routes: store.list('routes').length,
          articles: store.list('articles').length,
          experiences: store.list('experiences').length,
          visitors: store.db.prepare('SELECT COUNT(*) n FROM visitors').get().n,
          itineraries: store.db.prepare('SELECT COUNT(*) n FROM itineraries').get().n,
          ai: aiStatus(),
          audit: store.db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 15').all(),
        })
      const content = route.match(/^\/api\/admin\/(spots|routes|articles|experiences)(?:\/(\d+))?$/)
      if (content) {
        const [, kind, id] = content
        if (req.method === 'GET') return respond({ items: store.list(kind) })
        if (['POST', 'PUT'].includes(req.method)) {
          const input = await readJson()
          if (req.method === 'PUT' && !id) throw new ServiceError(400, '缺少记录编号')
          if (id && !store.list(kind).some((item) => item.id === Number(id)))
            throw new ServiceError(404, '记录不存在')
          const value = validateContent(
            kind,
            { ...input, ...(id ? { id: Number(id) } : { id: undefined }) },
            store,
          )
          return respond(
            store.saveContent(kind, value, input.version, actor),
            req.method === 'POST' ? 201 : 200,
          )
        }
        if (req.method === 'DELETE' && id) {
          store.removeContent(kind, Number(id), actor)
          return respond({ ok: true })
        }
      }
      if (route === '/api/admin/visitors' && req.method === 'GET') {
        const q = (url.searchParams.get('q') || '').slice(0, 80)
        const page = Math.max(
          1,
          Math.min(10000, Math.trunc(Number(url.searchParams.get('page'))) || 1),
        )
        const count = store.db
          .prepare('SELECT COUNT(*) n FROM visitors WHERE body LIKE ?')
          .get(`%${q}%`).n
        const items = store.db
          .prepare(
            'SELECT * FROM visitors WHERE body LIKE ? ORDER BY updated_at DESC LIMIT 25 OFFSET ?',
          )
          .all(`%${q}%`, (page - 1) * 25)
          .map((row) => ({ ...visitorRow(row), itineraries: itineraries(row.id) }))
        return respond({ items, total: count, page, pageSize: 25 })
      }
      const matchVisitor = route.match(/^\/api\/admin\/visitors\/([\w-]+)$/)
      if (matchVisitor) {
        const id = matchVisitor[1]
        const row = store.db.prepare('SELECT * FROM visitors WHERE id=?').get(id)
        if (!row) throw new ServiceError(404, '游客记录不存在')
        if (req.method === 'DELETE') {
          store.db.prepare('DELETE FROM visitors WHERE id=?').run(id)
          store.audit(actor, 'delete-visitor', id)
          return respond({ ok: true })
        }
        if (req.method === 'PUT') {
          const input = await readJson()
          const body = { ...JSON.parse(row.body), adminNote: text(input.adminNote || '', 1000) }
          store.db
            .prepare('UPDATE visitors SET body=?,updated_at=? WHERE id=?')
            .run(JSON.stringify(body), new Date().toISOString(), id)
          store.audit(actor, 'update-visitor', id)
          return respond({ ok: true })
        }
      }
      if (route === '/api/admin/ai' && req.method === 'GET') return respond(aiStatus())
      if (route === '/api/admin/ai' && req.method === 'PUT') {
        const body = await readJson()
        const model = text(body.model, 120)
        const dailyLimit = Number(body.dailyLimit)
        if (
          !['local', 'ai'].includes(body.mode) ||
          !model ||
          !Number.isInteger(dailyLimit) ||
          dailyLimit < 0 ||
          dailyLimit > 10000
        )
          throw new ServiceError(400, 'AI模式、模型或额度无效')
        const next = {
          mode: body.mode,
          model,
          dailyLimit,
          revision: (store.getSetting('ai', {}).revision || 0) + 1,
          keyDisabled: body.clearKey === true,
        }
        if (typeof body.apiKey === 'string' && body.apiKey.trim())
          next.key = store.seal(text(body.apiKey, 512))
        else if (!body.clearKey) next.key = store.getSetting('ai', {}).key
        store.setSetting('ai', next)
        store.audit(actor, 'update-ai', 'settings')
        return respond(aiStatus())
      }
      if (route === '/api/admin/ai/test' && req.method === 'POST') return respond(await aiTest())
      if (route === '/api/admin/ai/query' && req.method === 'POST')
        return respond(await aiQuery(await readJson()))
      throw new ServiceError(404, '未找到管理接口')
    }
    let row = visitor(req)
    if (route === '/api/visitor' && req.method === 'GET') {
      const profile = visitorRow(row)
      if (profile) delete profile.adminNote
      return respond({ profile, itineraries: row ? itineraries(row.id) : [] })
    }
    if (route === '/api/visitor' && req.method === 'POST') {
      const profile = validateProfile(await readJson())
      const now = new Date().toISOString()
      if (!row) {
        const id = store.newVisitorId()
        const token = randomBytes(32).toString('hex')
        store.db
          .prepare('INSERT INTO visitors VALUES(?,?,?,?,?)')
          .run(id, digest(token), JSON.stringify(profile), now, now)
        setCookie(req, res, 'yunyou_visitor', token, 30 * 86400)
        row = store.db.prepare('SELECT * FROM visitors WHERE id=?').get(id)
      } else {
        const previous = JSON.parse(row.body)
        store.db
          .prepare('UPDATE visitors SET body=?,updated_at=? WHERE id=?')
          .run(JSON.stringify({ ...profile, adminNote: previous.adminNote || '' }), now, row.id)
        row = store.db.prepare('SELECT * FROM visitors WHERE id=?').get(row.id)
      }
      const result = visitorRow(row)
      delete result.adminNote
      return respond({ profile: result, itineraries: itineraries(row.id) })
    }
    if (!row) throw new ServiceError(401, '请先自愿保存一份游客资料')
    if (route === '/api/visitor' && req.method === 'DELETE') {
      store.db.prepare('DELETE FROM visitors WHERE id=?').run(row.id)
      setCookie(req, res, 'yunyou_visitor', '', 0)
      return respond({ ok: true })
    }
    if (route === '/api/visitor/itineraries' && req.method === 'POST') {
      const body = await readJson()
      const routeId = Number(body.routeId)
      const startDate = body.startDate || ''
      if (
        !store.catalog().routes.some((item) => item.id === routeId) ||
        (startDate && !validDate(startDate))
      )
        throw new ServiceError(400, '路线或日期无效')
      store.db
        .prepare(
          'INSERT INTO itineraries(visitor_id,route_id,start_date,created_at) VALUES(?,?,?,?) ON CONFLICT(visitor_id,route_id) DO UPDATE SET start_date=excluded.start_date',
        )
        .run(row.id, routeId, startDate, new Date().toISOString())
      return respond({ itineraries: itineraries(row.id) })
    }
    const remove = route.match(/^\/api\/visitor\/itineraries\/(\d+)$/)
    if (remove && req.method === 'DELETE') {
      store.db
        .prepare('DELETE FROM itineraries WHERE id=? AND visitor_id=?')
        .run(Number(remove[1]), row.id)
      return respond({ itineraries: itineraries(row.id) })
    }
    throw new ServiceError(404, '未找到接口')
  }
}
