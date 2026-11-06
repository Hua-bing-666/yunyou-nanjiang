import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto'
import { spots } from '../src/data/spots.js'
import { recommendedRoutes } from '../src/data/routes.js'
import { researchArticles } from './research.js'
import { ServiceError } from './errors.js'

export const digest = (value) => createHash('sha256').update(value).digest('hex')
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
export function verifyPassword(password, hash) {
  const [salt, key] = hash.split(':')
  const actual = scryptSync(password, salt, 64)
  return timingSafeEqual(actual, Buffer.from(key, 'hex'))
}

export function openStore(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS content (kind TEXT NOT NULL, id INTEGER NOT NULL, body TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, PRIMARY KEY(kind,id));
    CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admins (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, username TEXT NOT NULL REFERENCES admins(username), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS visitors (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS itineraries (id INTEGER PRIMARY KEY, visitor_id TEXT NOT NULL REFERENCES visitors(id) ON DELETE CASCADE, route_id INTEGER NOT NULL, start_date TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(visitor_id,route_id));
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_usage (day TEXT PRIMARY KEY, calls INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS visitor_updated ON visitors(updated_at);
    CREATE INDEX IF NOT EXISTS itinerary_visitor ON itineraries(visitor_id);`)
  if (!db.prepare('SELECT 1 FROM migrations WHERE version=1').get()) {
    db.exec('BEGIN IMMEDIATE')
    try {
      const insert = db.prepare('INSERT INTO content(kind,id,body,updated_at) VALUES(?,?,?,?)')
      for (const [kind, items] of [
        ['spots', spots],
        ['routes', recommendedRoutes],
        ['articles', researchArticles],
      ])
        for (const item of items)
          insert.run(
            kind,
            item.id,
            JSON.stringify({ ...item, published: true }),
            new Date().toISOString(),
          )
      db.prepare('INSERT INTO migrations(version) VALUES(1)').run()
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
  let key
  if (filename === ':memory:') key = randomBytes(32)
  else {
    const keyFile = path.join(path.dirname(filename), 'settings.key')
    if (!existsSync(keyFile)) writeFileSync(keyFile, randomBytes(32), { mode: 0o600, flag: 'wx' })
    key = readFileSync(keyFile)
    if (key.length !== 32) throw new Error('数据库加密密钥文件无效')
  }
  function seal(value) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    return [
      iv.toString('hex'),
      cipher.getAuthTag().toString('hex'),
      encrypted.toString('hex'),
    ].join(':')
  }
  function unseal(value) {
    const [iv, tag, encrypted] = value.split(':')
    const cipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'))
    cipher.setAuthTag(Buffer.from(tag, 'hex'))
    return Buffer.concat([cipher.update(Buffer.from(encrypted, 'hex')), cipher.final()]).toString(
      'utf8',
    )
  }
  const list = (kind) =>
    db
      .prepare('SELECT * FROM content WHERE kind=? ORDER BY id')
      .all(kind)
      .map((row) => ({ ...JSON.parse(row.body), version: row.version, updatedAt: row.updated_at }))
  const getSetting = (name, fallback = null) => {
    const row = db.prepare('SELECT value FROM settings WHERE name=?').get(name)
    return row ? JSON.parse(row.value) : fallback
  }
  const setSetting = (name, value) =>
    db
      .prepare(
        'INSERT INTO settings(name,value) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value',
      )
      .run(name, JSON.stringify(value))
  const audit = (actor, action, target) =>
    db
      .prepare('INSERT INTO audit(actor,action,target,created_at) VALUES(?,?,?,?)')
      .run(actor, action, String(target), new Date().toISOString())
  function catalog() {
    const publicItems = (kind) => list(kind).filter((item) => item.published)
    const activeSpots = publicItems('spots')
    const ids = new Set(activeSpots.map((item) => item.id))
    return {
      spots: activeSpots,
      routes: publicItems('routes').filter((route) => route.spotIds.every((id) => ids.has(id))),
      articles: publicItems('articles').filter((article) => article.status === 'source-reviewed'),
    }
  }
  function saveContent(kind, body, version, actor) {
    const old = body.id
      ? db.prepare('SELECT version FROM content WHERE kind=? AND id=?').get(kind, body.id)
      : null
    if (old && old.version !== version) throw new ServiceError(409, '内容已被更新，请刷新后再保存')
    const id =
      body.id ||
      Number(db.prepare('SELECT COALESCE(MAX(id),0)+1 id FROM content WHERE kind=?').get(kind).id)
    const next = { ...body, id }
    delete next.version
    delete next.updatedAt
    db.prepare(
      'INSERT INTO content(kind,id,body,version,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET body=excluded.body,version=content.version+1,updated_at=excluded.updated_at',
    ).run(kind, id, JSON.stringify(next), 1, new Date().toISOString())
    audit(actor, old ? 'update' : 'create', `${kind}/${id}`)
    return list(kind).find((item) => item.id === id)
  }
  function removeContent(kind, id, actor) {
    if (kind === 'spots' && list('routes').some((route) => route.spotIds.includes(id)))
      throw new ServiceError(409, '该景点仍被路线引用，请先修改路线或改为下架')
    if (kind === 'routes' && db.prepare('SELECT 1 FROM itineraries WHERE route_id=?').get(id))
      throw new ServiceError(409, '已有游客保存该路线，请使用下架保留记录')
    const result = db.prepare('DELETE FROM content WHERE kind=? AND id=?').run(kind, id)
    if (!result.changes) throw new ServiceError(404, '记录不存在')
    audit(actor, 'delete', `${kind}/${id}`)
  }
  function bootstrap({ username = 'admin', password, outputFile } = {}) {
    if (db.prepare('SELECT 1 FROM admins LIMIT 1').get()) return false
    const generated = password || randomBytes(18).toString('base64url')
    if (generated.length < 12) throw new Error('管理员密码至少12位')
    if (!password && !outputFile) return false
    if (!password)
      writeFileSync(
        outputFile,
        `用户名：${username}\n初始密码：${generated}\n登录后请修改密码；妥善保管并删除此文件。\n`,
        { mode: 0o600, flag: 'wx' },
      )
    db.prepare('INSERT INTO admins VALUES(?,?)').run(username, hashPassword(generated))
    return true
  }
  function spendAI(limit) {
    const day = new Date().toISOString().slice(0, 10)
    db.prepare('INSERT OR IGNORE INTO ai_usage(day,calls) VALUES(?,0)').run(day)
    return !!db.prepare('UPDATE ai_usage SET calls=calls+1 WHERE day=? AND calls<?').run(day, limit)
      .changes
  }
  return {
    db,
    list,
    catalog,
    saveContent,
    removeContent,
    getSetting,
    setSetting,
    audit,
    seal,
    unseal,
    bootstrap,
    spendAI,
    close: () => db.close(),
    newVisitorId: randomUUID,
  }
}
