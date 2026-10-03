import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const child = spawn(process.execPath, ['server/index.js'], { cwd: fileURLToPath(new URL('../my-travel/', import.meta.url)), stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } })
child.on('error', () => process.exit(1))
child.on('exit', code => process.exit(code || 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
