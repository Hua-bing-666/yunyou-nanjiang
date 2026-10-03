import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const cwd = fileURLToPath(new URL('../my-travel/', import.meta.url))
const children = [spawn(process.execPath, ['server/index.js'], { cwd, stdio: 'inherit' }), spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { cwd, stdio: 'inherit' })]
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill()
  setTimeout(() => process.exit(code), 500)
}
for (const child of children) { child.on('error', () => stop(1)); child.on('exit', code => { if (!stopping) stop(code || 0) }) }
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
