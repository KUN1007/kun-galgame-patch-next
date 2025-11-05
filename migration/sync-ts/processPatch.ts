import { prisma } from './db/prisma'
import {
  lowercaseVndbIdSafely,
  upsertTagByName,
  upsertCompanyByName
} from './db/helpers'
import {
  resolveVndbId,
  fetchVndbDetailAndSyncNames,
  syncVndbCover,
  syncVndbDescription,
  syncVndbReleasesAndCompanies,
  syncVndbScreenshots,
  syncVndbTags
} from './mapping/patch'
import { initCharMapFromVndb, augmentVndbDetails } from './mapping/vndb'
import {
  handleBangumiSubjectAndTags,
  addBangumiCharactersToCharMap,
  addBangumiPersonsAndCompanies
} from './mapping/bangumi'
import { persistCharMap, linkVoices } from './mapping/persist'
import { sleep } from './utils/sleep'

export async function processPatch(patch: {
  id: number
  name: string
  bid?: number | null
  vndb_id?: string | null
}) {
  const owner = await prisma.user.findFirst({ select: { id: true } })
  const ownerId = owner?.id ?? 1
  const vndbId = await resolveVndbId(patch)
  const vnDetail = await fetchVndbDetailAndSyncNames(vndbId, patch.id)

  await syncVndbTags(vnDetail, ownerId, patch.id)
  await syncVndbDescription(vnDetail, patch.id)
  await syncVndbCover(vnDetail, patch.id)
  await syncVndbScreenshots(vnDetail, patch.id)
  await syncVndbReleasesAndCompanies(
    vndbId as string,
    vnDetail,
    ownerId,
    patch.id
  )

  // Build merged map
  const charMap = initCharMapFromVndb(vnDetail)
  await augmentVndbDetails(vnDetail, vndbId as string, charMap)

  // Find bangumi subject id
  const subjectId = await findBangumiSubjectId(
    patch.name,
    vnDetail,
    patch.bid || null
  )
  if (subjectId) {
    await handleBangumiSubjectAndTags(
      subjectId,
      vnDetail,
      patch.id,
      ownerId,
      prisma,
      upsertTagByName
    )
    await addBangumiCharactersToCharMap(subjectId, charMap)
    await addBangumiPersonsAndCompanies(
      subjectId,
      patch.id,
      charMap,
      prisma,
      upsertCompanyByName,
      ownerId
    )
  } else {
    console.warn('Bangumi subject not found by name or bid')
  }

  await persistCharMap(charMap, patch.id)
  await linkVoices(vnDetail, patch.id)

  // Fallback: fill zh_cn introduction from legacy introduction
  try {
    const p = await prisma.patch.findUnique({
      where: { id: patch.id },
      select: {
        introduction_zh_cn: true,
        introduction: true,
        introduction_en_us: true
      }
    })
    // Normalize function: remove last line if it starts with '[' and trim
    const normalizeIntro = (txt?: string | null) => {
      if (!txt) return ''
      const lines = String(txt).split(/\n+/)
      if (lines.length) {
        const last = (lines[lines.length - 1] || '').trim()
        if (last.startsWith('[')) lines.pop()
      }
      return lines.join('\n').trim()
    }
    if (p && !p.introduction_zh_cn && p.introduction) {
      const legacy = normalizeIntro(p.introduction)
      const en = normalizeIntro(p.introduction_en_us || '')
      // Skip writing zh_cn if legacy equals en_us after normalization
      if (legacy && legacy !== en) {
        await prisma.patch
          .update({
            where: { id: patch.id },
            data: { introduction_zh_cn: p.introduction }
          })
          .catch(() => {})
      }
    }
  } catch {}
  await sleep(250)
}

// Name-based subject id pick (same heuristic as JS version)
import { bgmPost } from './api/bangumi'
function normalizeTitle(str: string) {
  if (!str) return ''
  return str
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s_`'"!@#$%^&*()\[\]{}|\\;:,.<>/?]+/g, '')
}
function pickBestBangumiSubject(
  { query, jaTitle }: { query: string; jaTitle: string | null },
  list: any[]
) {
  if (!Array.isArray(list) || !list.length) return null
  let best: any = null
  let bestScore = -Infinity
  const nQuery = normalizeTitle(query)
  const nJa = normalizeTitle(jaTitle || '')
  for (const c of list) {
    const name = c?.name || ''
    const nameCn = c?.name_cn || ''
    const nName = normalizeTitle(name)
    const nNameCn = normalizeTitle(nameCn)
    let s = 0
    if (nJa && nName === nJa) s += 120
    if (nJa && nNameCn === nJa) s += 120
    if (nName === nQuery) s += 100
    if (nNameCn === nQuery) s += 100
    if (nJa && (nName.includes(nJa) || nJa.includes(nName))) s += 70
    if (nJa && (nNameCn.includes(nJa) || nJa.includes(nNameCn))) s += 70
    if (nName.includes(nQuery) || nQuery.includes(nName)) s += 60
    if (nNameCn.includes(nQuery) || nQuery.includes(nNameCn)) s += 60
    if (nJa && nName.startsWith(nJa)) s += 20
    if (nJa && nNameCn.startsWith(nJa)) s += 20
    if (nName.startsWith(nQuery) || nNameCn.startsWith(nQuery)) s += 10
    if (c?.type === 4) s += 20
    if (s > bestScore) {
      best = c
      bestScore = s
    }
  }
  return best
}

export async function findBangumiSubjectId(
  patchName: string,
  vnDetail: any,
  bid?: number | null
): Promise<number | null> {
  let subjectId: number | null = null
  let jaTitle: string | null = null
  try {
    if (vnDetail?.titles?.length) {
      const mainJa = vnDetail.titles.find(
        (t: any) => t.lang === 'ja' && (t.main || t.official)
      )
      jaTitle =
        mainJa?.title ||
        vnDetail.titles.find((t: any) => t.lang === 'ja')?.title ||
        null
    }
    if (jaTitle) {
      const searchJa: any = await bgmPost('/v0/search/subjects', {
        keyword: jaTitle,
        sort: 'match'
      })
      const listJa = searchJa?.data || searchJa?.list || []
      const bestJa = pickBestBangumiSubject(
        { query: patchName, jaTitle },
        listJa
      )
      if (bestJa?.id) subjectId = bestJa.id
    }
    if (!subjectId) {
      const searchNm: any = await bgmPost('/v0/search/subjects', {
        keyword: patchName,
        sort: 'match'
      })
      const listNm = searchNm?.data || searchNm?.list || []
      const bestNm = pickBestBangumiSubject(
        { query: patchName, jaTitle },
        listNm
      )
      if (bestNm?.id) subjectId = bestNm.id
    }
    if (!subjectId && bid) subjectId = bid
  } catch {}
  return subjectId
}
