import { prisma } from '../db/prisma'
import {
  vndbFindVnByName,
  vndbGetReleasesByVn,
  vndbGetVnById
} from '../api/vndb'
import { upsertCompanyByName, upsertTagByName } from '../db/helpers'
import { TAG_MAP } from '../../../lib/tagMap'

export async function resolveVndbId(patch: {
  id: number
  name: string
  vndb_id?: string | null
}) {
  let vndbId = patch.vndb_id || null
  if (!vndbId) {
    try {
      const vn = await vndbFindVnByName(patch.name)
      if (vn?.id) vndbId = vn.id
    } catch {}
  }
  try {
    await prisma.patch.update({
      where: { id: patch.id },
      data: { vndb_id: vndbId }
    })
  } catch {}
  return vndbId
}

export async function fetchVndbDetailAndSyncNames(
  vndbId: string | null,
  patchId: number
) {
  if (!vndbId) return null
  try {
    const vnDetail = await vndbGetVnById(vndbId)
    if (vnDetail) {
      const nameEn = vnDetail.title || ''
      let nameJa = ''
      if (Array.isArray(vnDetail.titles)) {
        const mainJa = vnDetail.titles.find(
          (t) => t.lang === 'ja' && (t.main || t.official)
        )
        nameJa =
          mainJa?.title ||
          vnDetail.titles.find((t) => t.lang === 'ja')?.title ||
          ''
      }
      await prisma.patch
        .update({
          where: { id: patchId },
          data: { name_en_us: nameEn, name_ja_jp: nameJa }
        })
        .catch(() => {})
    }
    return vnDetail
  } catch (e: any) {
    console.warn(`VNDB vn fetch failed for ${vndbId}:`, e?.message || e)
    return null
  }
}

export async function syncVndbDescription(vnDetail: any, patchId: number) {
  if (!vnDetail?.description) return
  // Trim trailing VNDB bracketed line like "[from vndb]"
  let text = String(vnDetail.description || '')
  const lines = text.split(/\n+/)
  if (lines.length) {
    const last = (lines[lines.length - 1] || '').trim()
    if (last.startsWith('[')) lines.pop()
  }
  const processed = lines.join('\n').trim()
  await prisma.patch
    .update({
      where: { id: patchId },
      data: { introduction_en_us: processed }
    })
    .catch(() => {})
}

export async function syncVndbCover(vnDetail: any, patchId: number) {
  if (!vnDetail?.image?.url) return
  const c = vnDetail.image
  await prisma.patch_cover
    .upsert({
      where: { patch_id: patchId },
      update: {
        image_id: c.id ? String(c.id) : '',
        url: c.url || '',
        width: Array.isArray(c.dims) ? c.dims[0] : 0,
        height: Array.isArray(c.dims) ? c.dims[1] : 0,
        sexual: typeof c.sexual === 'number' ? c.sexual : 0,
        violence: typeof c.violence === 'number' ? c.violence : 0,
        votecount: typeof c.votecount === 'number' ? c.votecount : 0,
        thumbnail_url: c.thumbnail || '',
        thumb_width: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[0] : 0,
        thumb_height: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[1] : 0
      },
      create: {
        patch_id: patchId,
        image_id: c.id ? String(c.id) : '',
        url: c.url || '',
        width: Array.isArray(c.dims) ? c.dims[0] : 0,
        height: Array.isArray(c.dims) ? c.dims[1] : 0,
        sexual: typeof c.sexual === 'number' ? c.sexual : 0,
        violence: typeof c.violence === 'number' ? c.violence : 0,
        votecount: typeof c.votecount === 'number' ? c.votecount : 0,
        thumbnail_url: c.thumbnail || '',
        thumb_width: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[0] : 0,
        thumb_height: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[1] : 0
      }
    })
    .catch((e) => console.warn('cover upsert failed:', e?.message || e))
}

export async function syncVndbScreenshots(vnDetail: any, patchId: number) {
  if (!Array.isArray(vnDetail?.screenshots) || !vnDetail.screenshots.length)
    return
  for (let i = 0; i < vnDetail.screenshots.length; i++) {
    const s = vnDetail.screenshots[i]
    await prisma.patch_screenshot
      .create({
        data: {
          patch_id: patchId,
          image_id: s.id ? String(s.id) : '',
          url: s.url || '',
          width: Array.isArray(s.dims) ? s.dims[0] : 0,
          height: Array.isArray(s.dims) ? s.dims[1] : 0,
          sexual: typeof s.sexual === 'number' ? s.sexual : 0,
          violence: typeof s.violence === 'number' ? s.violence : 0,
          votecount: typeof s.votecount === 'number' ? s.votecount : 0,
          thumbnail_url: s.thumbnail || '',
          thumb_width: Array.isArray(s.thumbnail_dims)
            ? s.thumbnail_dims[0]
            : 0,
          thumb_height: Array.isArray(s.thumbnail_dims)
            ? s.thumbnail_dims[1]
            : 0,
          order_no: i + 1
        }
      })
      .catch((e) => console.warn('screenshot create failed:', e?.message || e))
  }
}

export async function syncVndbTags(
  vnDetail: any,
  ownerId: number,
  patchId: number
) {
  if (!Array.isArray(vnDetail?.tags) || !vnDetail.tags.length) return
  for (const t of vnDetail.tags) {
    const en = t.name || ''
    const zh = TAG_MAP && en && TAG_MAP[en] ? TAG_MAP[en] : en
    let category = 'content'
    if (t.category === 'cont') category = 'content'
    else if (t.category === 'ero') category = 'sexual'
    else if (t.category === 'tech') category = 'technical'
    const tid = await upsertTagByName(zh, '', ownerId, 'vndb', en, category)
    if (!tid) continue
    await prisma.patch_tag
      .update({
        where: { id: tid },
        data: { introduction_en_us: t.description || '' }
      })
      .catch(() => {})
    await prisma.patch_tag_relation
      .create({
        data: {
          patch_id: patchId,
          tag_id: tid,
          spoiler_level: Number.isInteger(t.spoiler) ? t.spoiler : 0
        }
      })
      .then(() =>
        prisma.patch_tag
          .update({ where: { id: tid }, data: { count: { increment: 1 } } })
          .catch(() => {})
      )
      .catch(() => {})
  }
}

export async function syncVndbReleasesAndCompanies(
  vndbId: string,
  vnDetail: any,
  ownerId: number,
  patchId: number
) {
  if (!vndbId) return
  try {
    const releases = await vndbGetReleasesByVn(vndbId)
    const companyIds = new Set<number>()
    for (let i = 0; i < releases.length; i++) {
      const r = releases[i]
      try {
        if (Array.isArray(r.producers)) {
          for (const p of r.producers) {
            const compId = await upsertCompanyByName(
              p.name || p.original || '',
              p.lang || null,
              p.aliases || [],
              (p.extlinks || []).map((el) => el.url).filter(Boolean),
              ownerId,
              p.description || ''
            )
            if (compId) companyIds.add(compId)
          }
        }
        let rid = r.id ? String(r.id) : ''
        if (!rid) rid = `v-${vndbId}-${i + 1}`
        await prisma.patch_release
          .upsert({
            where: { rid },
            update: {
              patch_id: patchId,
              title: r.title ?? '',
              released: r.released || '',
              platforms: Array.isArray(r.platforms) ? r.platforms : [],
              languages: Array.isArray(r.languages)
                ? r.languages.map((x: any) => x.lang || x).filter(Boolean)
                : [],
              minage: typeof r.minage === 'number' ? r.minage : 0
            },
            create: {
              patch_id: patchId,
              rid,
              title: r.title ?? '',
              released: r.released || '',
              platforms: Array.isArray(r.platforms) ? r.platforms : [],
              languages: Array.isArray(r.languages)
                ? r.languages.map((x: any) => x.lang || x).filter(Boolean)
                : [],
              minage: typeof r.minage === 'number' ? r.minage : 0
            }
          })
          .catch((e) => console.warn('release upsert failed:', e?.message || e))
      } catch (e: any) {
        console.warn('release upsert failed:', e?.message || e)
      }
    }
    if (Array.isArray(vnDetail?.developers)) {
      for (const d of vnDetail.developers) {
        const compId = await upsertCompanyByName(
          d.name || d.original || '',
          d.lang || null,
          d.aliases || [],
          (d.extlinks || []).map((el: any) => el.url).filter(Boolean),
          ownerId,
          d.description || ''
        )
        if (compId) companyIds.add(compId)
      }
    }
    for (const compId of companyIds) {
      await prisma.patch_company_relation
        .create({ data: { patch_id: patchId, company_id: compId } })
        .catch(() => {})
      await prisma.patch_company
        .update({ where: { id: compId }, data: { count: { increment: 1 } } })
        .catch(() => {})
    }
  } catch (e: any) {
    console.warn('VNDB releases fetch failed:', e?.message || e)
  }
}
