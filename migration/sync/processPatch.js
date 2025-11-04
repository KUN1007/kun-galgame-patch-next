import { prisma } from './dbClient.js'
import { path } from './utils.js'
import { loadVndbTagMap } from './tagMap.js'
import {
  // Resolve VNDB id, fetch detail and push down data into local DB
  resolveVndbId,
  fetchVndbDetailAndSyncNames,
  syncVndbTags,
  syncVndbDescription,
  syncVndbCover,
  syncVndbScreenshots,
  syncVndbReleasesAndCompanies,
  initCharMapFromVndb,
  augmentVndbDetails,
  findBangumiSubjectId,
  handleBangumiSubjectAndTags,
  addBangumiCharactersToCharMap,
  addBangumiPersonsAndCompanies,
  persistCharMap,
  linkVoices
} from './processPatchHelpers.js'

/**
 * Orchestrate syncing a single patch (VN entry) from VNDB and Bangumi.
 * Pipeline:
 * 1) Identify VNDB id (from patch or by name search)
 * 2) Fetch VN detail; sync names and media (cover/screenshots)
 * 3) Pull VNDB tags + producers/releases; upsert companies/relations
 * 4) Build merged character/person maps from VNDB (augmented) + Bangumi
 * 5) Upsert tag/company from Bangumi subject; augment character/person data
 * 6) Persist characters/persons; link voices (char<->person) via VA
 */
export async function processPatch(patch) {
  const owner = await prisma.user.findFirst({ select: { id: true } })
  const ownerId = owner?.id ?? 1
  const vndbId = await resolveVndbId(patch)

  const baseDir = path.join('migration', 'temp', `patch-${patch.id}`)
  // No-op: we no longer write images to disk

  const vnDetail = await fetchVndbDetailAndSyncNames(vndbId, patch.id)
  const tagMap = await loadVndbTagMap()

  await syncVndbTags(vnDetail, ownerId, patch.id, tagMap)
  await syncVndbDescription(vnDetail, patch.id)
  await syncVndbCover(vnDetail, baseDir, patch.id)
  await syncVndbScreenshots(vnDetail, baseDir, patch.id)
  await syncVndbReleasesAndCompanies(vndbId, vnDetail, ownerId, patch.id)

  // Initialize character/person map from VNDB staff/VA lists
  const charMap = initCharMapFromVndb(vnDetail)
  await augmentVndbDetails(vnDetail, vndbId, charMap)
  const subjectId = await findBangumiSubjectId(
    patch.name,
    vnDetail,
    patch.bid || null
  )
  if (!subjectId) {
    console.warn(
      'Bangumi subject fetch failed:',
      'bangumi subject not found by name or bid'
    )
  } else {
    await handleBangumiSubjectAndTags(
      subjectId,
      vnDetail,
      baseDir,
      patch.id,
      ownerId
    )
    await addBangumiCharactersToCharMap(subjectId, charMap)
    await addBangumiPersonsAndCompanies(subjectId, baseDir, patch.id, charMap)
  }
  // Write characters/persons to DB (upsert + alias tables)
  await persistCharMap(charMap, baseDir, patch.id)
  // Create voice relations: char <-> person
  await linkVoices(vnDetail, patch.id)
  // Fallback: if introduction_zh_cn is still empty after sync,
  // backfill with legacy patch.introduction to avoid blank page.
  try {
    const p = await prisma.patch.findUnique({
      where: { id: patch.id },
      select: { introduction_zh_cn: true, introduction: true }
    })
    if (p && !p.introduction_zh_cn && p.introduction) {
      await prisma.patch.update({
        where: { id: patch.id },
        data: { introduction_zh_cn: p.introduction }
      })
    }
  } catch {}
}

/*
可优化的地方：
- 针对多 patch 并行处理：引入并发池并与上游速率限制协调；
- 将 pipeline 的每步包装为可重试任务，支持断点续跑与幂等；
- 打通结构化日志，保留数据对齐决策（匹配/忽略）的可追踪性。
*/
