import { readdir } from 'fs/promises'
import path from 'path'
import { parsePatchFileName } from '../parse'

async function main() {
  const dir = 'migration/sync-ts/patch'
  const names = await readdir(dir)
  for (const n of names) {
    const p = path.posix.join(dir, n)
    const parsed = parsePatchFileName(p)
    console.log('# Parsed:', n)
    console.log(parsed)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

