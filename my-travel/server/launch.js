// Load server configuration before starting Node's environment-aware proxy support.
import { config } from 'dotenv'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
config({ path: [path.join(root, '.env.local'), path.join(root, '.env')], quiet: true })
const proxy =
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  process.env.https_proxy ||
  process.env.http_proxy
const child = spawn(process.execPath, [...(proxy ? ['--use-env-proxy'] : []), 'server/index.js'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NO_PROXY: process.env.NO_PROXY || 'localhost,127.0.0.1,::1' },
})
child.on('error', () => process.exit(1))
child.on('exit', (code) => process.exit(code || 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
