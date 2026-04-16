import path from 'path'
import { readdir } from 'fs/promises'
import { prisma } from './db/prisma'
import { parsePatchFileName } from './vn-sync/parse'
import {
  createPatchIfMissing,
  createPatchResourceForFile
} from './vn-sync/index'

export async function syncPatchesToS3(dir = 'migration/sync-ts/patch') {
  const files = await readdir(dir)
  const results: Array<{ file: string; ok: boolean; error?: string }> = []
  for (const name of files) {
    const filePath = path.posix.join(dir, name)
    try {
      const parsed = parsePatchFileName(filePath)
      if (!parsed) {
        results.push({ file: name, ok: false, error: 'Unrecognized filename' })
        continue
      }

      const patchId = await createPatchIfMissing(parsed)
      const resource = await createPatchResourceForFile(patchId, parsed)

      const patch = await prisma.patch.findUnique({
        where: { id: patchId },
        select: { name_ja_jp: true, banner: true }
      })

      const jaName = patch?.name_ja_jp || ''
      const banner = patch?.banner || ''
      const bannerMini = banner
        ? banner.replace(/\/banner\.(avif|webp)$/i, '/banner-mini.$1')
        : ''
      const fileUrl = (resource as any)?.content || ''

      // Print requested details
      console.log(`Patch: ${jaName}`)
      if (banner) console.log(`banner: ${banner}`)
      if (bannerMini) console.log(`banner-mini: ${bannerMini}`)
      if (fileUrl) console.log(`file: ${fileUrl}`)

      results.push({ file: name, ok: true })
    } catch (e: any) {
      results.push({ file: name, ok: false, error: e?.message || String(e) })
    }
  }
  return results
}
