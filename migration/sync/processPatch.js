import { prisma } from './dbClient.js'
import { ensureDir, path } from './utils.js'
import { loadVndbTagMap } from './tagMap.js'
import {
  resolveVndbId,
  fetchVndbDetailAndSyncNames,
  syncVndbTags,
  syncVndbDescription,
  syncVndbCover,
  syncVndbScreenshots,
  syncVndbReleasesAndCompanies,
  initCharMapFromVndb,
  findBangumiSubjectId,
  handleBangumiSubjectAndTags,
  addBangumiCharactersToCharMap,
  addBangumiPersonsAndCompanies,
  persistCharMap
} from './processPatchHelpers.js'

export async function processPatch(patch) {
  const owner = await prisma.user.findFirst({ select: { id: true } })
  const ownerId = owner?.id ?? 1
  const vndbId = await resolveVndbId(patch)

  const baseDir = path.join('migration', 'temp', `patch-${patch.id}`)
  await ensureDir(baseDir)

  const vnDetail = await fetchVndbDetailAndSyncNames(vndbId, patch.id)
  const tagMap = await loadVndbTagMap()

  await syncVndbTags(vnDetail, ownerId, patch.id, tagMap)
  await syncVndbDescription(vnDetail, patch.id)
  await syncVndbCover(vnDetail, baseDir, patch.id)
  await syncVndbScreenshots(vnDetail, baseDir, patch.id)
  await syncVndbReleasesAndCompanies(vndbId, vnDetail, ownerId, patch.id)

  const charMap = initCharMapFromVndb(vnDetail)
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
  await persistCharMap(charMap, baseDir, patch.id)
}
