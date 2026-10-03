import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, createChatHandler, DEFAULT_PROXY_PORT } from './deepseekProxy.js'

const appRoot = fileURLToPath(new URL('..', import.meta.url))
config({ path: [path.join(appRoot, '.env.local'), path.join(appRoot, '.env')], quiet: true })
const port = Number(process.env.PORT || process.env.DEEPSEEK_PROXY_PORT || DEFAULT_PROXY_PORT)
const dailyLimit = Number(process.env.AI_DAILY_LIMIT || 200)
if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535 ||
  !Number.isInteger(dailyLimit) ||
  dailyLimit < 0 ||
  dailyLimit > 10000
)
  throw new Error('PORT 或 AI_DAILY_LIMIT 无效')
const server = createServer({
  chatHandler: createChatHandler({
    apiKey: process.env.AI_MODE === 'local' ? '' : process.env.DEEPSEEK_API_KEY,
    dailyLimit,
  }),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .filter(Boolean),
  staticDir: process.env.NODE_ENV === 'production' ? path.join(appRoot, 'dist') : undefined,
})
const host = process.env.HOST || '127.0.0.1'
server.listen(port, host, () => console.log(`云游南疆服务已启动：http://${host}:${port}`))
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)))
