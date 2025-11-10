import path from 'path'
import { readdir } from 'fs/promises'
import { processOnePatchFile } from './vn-sync/index'

export async function syncPatchesToS3(dir = 'migration/sync-ts/patch') {
  const files = await readdir(dir)
  const results: Array<{ file: string; ok: boolean; error?: string }> = []
  for (const name of files) {
    const filePath = path.posix.join(dir, name)
    try {
      const res = await processOnePatchFile(filePath)
      if (typeof res === 'string') {
        results.push({ file: name, ok: false, error: res })
      } else {
        results.push({ file: name, ok: true })
      }
    } catch (e: any) {
      results.push({ file: name, ok: false, error: e?.message || String(e) })
    }
  }
  return results
}
