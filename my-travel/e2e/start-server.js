import { createServer, createChatHandler } from '../server/deepseekProxy.js'
import path from 'node:path'
const server = createServer({
  staticDir: path.resolve('dist'),
  chatHandler: createChatHandler({ apiKey: '' }),
  rateLimit: 10000,
})
server.listen(4173, '127.0.0.1')
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)))
