import path from 'path'
import { readdir, mkdir, copyFile, writeFile } from 'fs/promises'
import { vndbGetVnById } from './api/vndb'
import { parsePatchFileName } from './vn-sync/parse'
import sharp from 'sharp'

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true })
}

function pickSfwScreenshotUrlLocal(vn: any): string | null {
  const shots = Array.isArray(vn?.screenshots) ? vn.screenshots : []
  const clean = shots.filter(
    (s: any) => (s.sexual ?? 0) === 0 && (s.violence ?? 0) === 0
  )
  if (!clean.length) return null
  clean.sort((a: any, b: any) => (b.votecount ?? 0) - (a.votecount ?? 0))
  return clean[0]?.url || null
}

export async function syncPatchesToS3Dry(
  srcDir = 'migration/sync-ts/patch',
  dstPatchDir = 'migration/sync-ts/vn-sync/uploads/patch',
  dstBannerDir = 'migration/sync-ts/vn-sync/uploads/banner'
) {
  await ensureDir(dstPatchDir)
  await ensureDir(dstBannerDir)
  const files = await readdir(srcDir)
  const results: Array<{ file: string; ok: boolean; error?: string }> = []
  for (const name of files) {
    const filePath = path.posix.join(srcDir, name)
    try {
      const parsed = parsePatchFileName(filePath)
      if (!parsed) {
        results.push({ file: name, ok: false, error: 'Unrecognized filename' })
        continue
      }
      // Copy patch file for inspection
      const dstPatchPath = path.posix.join(dstPatchDir, name)
      await copyFile(filePath, dstPatchPath)

      // Fetch VN and write banner webp files
      const vn = await vndbGetVnById(parsed.vndbId)
      const shotUrl = pickSfwScreenshotUrlLocal(vn)
      if (shotUrl) {
        const res = await fetch(shotUrl)
        const ab = await res.arrayBuffer()
        const banner = await sharp(ab)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 70 })
          .toBuffer()
        const mini = await sharp(ab)
          .resize(460, 259, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 70 })
          .toBuffer()
        const base = `${parsed.vndbId}`
        await writeFile(
          path.posix.join(dstBannerDir, `${base}-banner.webp`),
          banner
        )
        await writeFile(
          path.posix.join(dstBannerDir, `${base}-banner-mini.webp`),
          mini
        )
      }

      results.push({ file: name, ok: true })
    } catch (e: any) {
      results.push({ file: name, ok: false, error: e?.message || String(e) })
    }
  }
  return results
}
