import { backup } from 'node:sqlite'
import { config } from 'dotenv'
import { mkdirSync, copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openStore } from './database.js'

const root = fileURLToPath(new URL('..', import.meta.url))
config({ path: [path.join(root, '.env.local'), path.join(root, '.env')], quiet: true })
const filename = path.resolve(process.env.DATABASE_PATH || path.join(root, 'data', 'yunyou.sqlite'))
const output = path.join(
  path.dirname(filename),
  'backups',
  new Date().toISOString().replaceAll(':', '-'),
)
mkdirSync(output, { recursive: true, mode: 0o700 })
const store = openStore(filename)
try {
  await backup(store.db, path.join(output, 'yunyou.sqlite'))
  copyFileSync(path.join(path.dirname(filename), 'settings.key'), path.join(output, 'settings.key'))
  console.log(`数据库与加密密钥已备份：${output}`)
} finally {
  store.close()
}
