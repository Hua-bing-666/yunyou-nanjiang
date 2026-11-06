import { createApplication } from '../server/application.js'
import path from 'node:path'
const { server } = createApplication({
  filename: ':memory:',
  forceLocal: true,
  adminPassword: 'acceptance-admin-pass-2026',
  staticDir: path.resolve('dist'),
  rateLimit: 10000,
})
server.listen(4173, '127.0.0.1')
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)))
