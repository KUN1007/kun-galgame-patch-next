import { prisma } from '../db/prisma'
import { vndbGetVnById } from '../api/vndb'
import { parsePatchFileName, type ParsedPatchFileName } from './parse'
import { uploadBannerForPatchWebp, uploadPatchFileToS3 } from './upload'
import { generateFileHash } from '../../../app/api/upload/calculateFileStreamHash'
import { loadNoteTemplate, renderNoteFromTemplate } from './note'
import sharp from 'sharp'

export async function pickSfwScreenshotUrl(vn: any): Promise<string | null> {
  if (!vn?.screenshots?.length) return null
  const clean = vn.screenshots.filter(
    (s: any) => (s.sexual ?? 0) === 0 && (s.violence ?? 0) === 0
  )
  if (!clean.length) return null
  // prefer highest vote count
  clean.sort((a: any, b: any) => (b.votecount ?? 0) - (a.votecount ?? 0))
  return clean[0].url || null
}

function deriveJaTitle(vn: any): string {
  try {
    const titles = Array.isArray(vn?.titles) ? vn.titles : []
    const jaItem = titles.find(
      (t: any) => String(t?.lang || '').split('-')[0] === 'ja'
    )
    if (jaItem?.title) return String(jaItem.title)
    const olang = String(vn?.olang || '').toLowerCase()
    if (olang === 'ja' && vn?.alttitle) return String(vn.alttitle)
  } catch {}
  return ''
}

export async function createPatchIfMissing(parsed: ParsedPatchFileName) {
  const existing = await prisma.patch.findFirst({
    where: { vndb_id: parsed.vndbId },
    select: { id: true }
  })
  if (existing) return existing.id

  const vn = await vndbGetVnById(parsed.vndbId)
  const nameEn = (vn as any)?.title || ''
  const nameJa = parsed.gameName || deriveJaTitle(vn)
  const releasedRaw = String((vn as any)?.released || '').trim()
  const released = releasedRaw ? formatDateYMD(releasedRaw) : 'unknown'

  const patch = await prisma.patch.create({
    data: {
      name: '',
      name_en_us: nameEn || '',
      name_ja_jp: nameJa || '',
      vndb_id: parsed.vndbId,
      user_id: 1,
      banner: '',
      released,
      content_limit: 'sfw',
      type: [],
      language: [],
      engine: [],
      platform: []
    }
  })

  // Upload banner if possible
  try {
    const screenshotUrl = await pickSfwScreenshotUrl(vn)
    if (screenshotUrl) {
      const res = await fetch(screenshotUrl)
      const arrayBuffer = await res.arrayBuffer()
      const uploadRes = await uploadBannerForPatchWebp(patch.id, arrayBuffer)
      if (typeof uploadRes !== 'string') {
        await prisma.patch.update({
          where: { id: patch.id },
          data: { banner: uploadRes.link }
        })
      }
    }
  } catch {}

  return patch.id
}

export function formatSizeString(bytes: number): string {
  const GB = 1024 * 1024 * 1024
  const MB = 1024 * 1024
  if (bytes >= GB) return `${(bytes / GB).toFixed(3)}GB`
  return `${(bytes / MB).toFixed(3)}MB`
}

export async function createPatchResourceForFile(
  patchId: number,
  parsed: ParsedPatchFileName
) {
  const hash = await generateFileHash(parsed.filePath)
  const uploaded = await uploadPatchFileToS3(patchId, hash, parsed.filePath)
  if (typeof uploaded === 'string') return uploaded

  const size = (await (await import('fs/promises')).stat(parsed.filePath)).size
  const sizeStr = formatSizeString(size)
  const noteTpl = await loadNoteTemplate()
  const note = renderNoteFromTemplate(noteTpl, {
    company: parsed.company,
    gameName: parsed.gameName,
    groupName: parsed.groupName,
    language: parsed.language,
    publishDate: formatDateYMD(parsed.publishDate),
    startDate: formatDateYMD(parsed.startDate),
    vndbId: parsed.vndbId,
    platform: parsed.platform,
    fileName: parsed.fileName
  })

  const resource = await prisma.patch_resource.create({
    data: {
      patch_id: patchId,
      user_id: 9147,
      storage: 's3',
      name: '',
      model_name: '',
      localization_group_name: parsed.groupName,
      size: sizeStr,
      code: '',
      password: '',
      note,
      hash,
      content: uploaded.url,
      type: ['manual'],
      language: [parsed.language],
      platform: [parsed.platform]
    }
  })

  // union update to patch fields
  const p = await prisma.patch.findUnique({
    where: { id: patchId },
    select: { type: true, language: true, platform: true }
  })
  if (p) {
    const types = Array.from(new Set([...(p.type || []), 'manual']))
    const langs = Array.from(new Set([...(p.language || []), parsed.language]))
    const plats = Array.from(new Set([...(p.platform || []), parsed.platform]))
    await prisma.patch.update({
      where: { id: patchId },
      data: {
        resource_update_time: new Date(),
        type: { set: types },
        language: { set: langs },
        platform: { set: plats }
      }
    })
  }

  return resource
}

export async function processOnePatchFile(filePath: string) {
  const parsed = parsePatchFileName(filePath)
  if (!parsed) return `Unrecognized filename format: ${filePath}`
  const patchId = await createPatchIfMissing(parsed)
  return await createPatchResourceForFile(patchId, parsed)
}

export function formatDateYMD(s: string) {
  const t = String(s || '').replace(/[^0-9]/g, '')
  if (t.length === 8) {
    return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`
  }
  if (t.length === 6) {
    return `${t.slice(0, 4)}-${t.slice(4, 6)}`
  }
  if (t.length === 4) return t
  return s
}
