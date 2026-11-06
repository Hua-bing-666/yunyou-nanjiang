import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openStore } from './database.js'
import { createManagement } from './management.js'
import {
  createServer,
  createChatHandler,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_DEEPSEEK_BASE_URL,
} from './deepseekProxy.js'
import { createAMapHandlers } from './amap.js'

export const appRoot = fileURLToPath(new URL('..', import.meta.url))
export function createApplication({
  filename = process.env.DATABASE_PATH || path.join(appRoot, 'data', 'yunyou.sqlite'),
  staticDir,
  adminPassword,
  bootstrap = false,
  forceLocal = false,
  rateLimit = 30,
  fetchImpl = globalThis.fetch,
} = {}) {
  const store = openStore(filename)
  if (adminPassword || bootstrap)
    store.bootstrap({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: adminPassword || process.env.ADMIN_PASSWORD,
      outputFile:
        filename === ':memory:'
          ? undefined
          : path.join(path.dirname(filename), 'admin-bootstrap.txt'),
    })
  const baseUrl = process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL
  function configuration() {
    const saved = store.getSetting('ai', {})
    return {
      model: saved.model || process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
      dailyLimit: saved.dailyLimit ?? Number(process.env.AI_DAILY_LIMIT || 200),
      mode: forceLocal || process.env.AI_MODE === 'local' ? 'local' : saved.mode || 'ai',
      apiKey: saved.key
        ? store.unseal(saved.key)
        : saved.keyDisabled
          ? ''
          : process.env.DEEPSEEK_API_KEY || '',
      baseUrl,
      revision: saved.revision || 0,
    }
  }
  function aiStatus() {
    const config = configuration()
    return {
      model: config.model,
      mode: config.mode,
      hasKey: !!config.apiKey,
      baseUrl,
      dailyLimit: config.dailyLimit,
      usedToday:
        store.db
          .prepare('SELECT calls FROM ai_usage WHERE day=?')
          .get(new Date().toISOString().slice(0, 10))?.calls || 0,
      forcedLocal: forceLocal || process.env.AI_MODE === 'local',
    }
  }
  let cachedHandler, revision
  async function chat(body) {
    const config = configuration()
    if (!cachedHandler || revision !== config.revision) {
      revision = config.revision
      cachedHandler = createChatHandler({
        apiKey: config.mode === 'local' ? '' : config.apiKey,
        model: config.model,
        baseUrl,
        dailyLimit: config.dailyLimit,
        getCatalog: () => store.catalog(),
        spendBudget: (limit) => store.spendAI(limit),
        fetchImpl,
      })
    }
    return cachedHandler(body)
  }
  const management = createManagement({
    store,
    aiStatus,
    aiQuery: chat,
    aiTest: async () => {
      const result = await chat({ message: '请简要介绍喀什古城的铜器手工艺', history: [] })
      store.audit('admin', 'test-ai', result.mode)
      return result
    },
  })
  const server = createServer({
    staticDir,
    rateLimit,
    chatHandler: chat,
    amapHandlers: createAMapHandlers({ getCatalog: () => store.catalog() }),
    management,
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
      .split(',')
      .filter(Boolean),
  })
  server.on('close', () => store.close())
  return { server, store, aiStatus }
}
