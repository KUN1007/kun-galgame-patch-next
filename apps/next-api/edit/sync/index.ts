import { prisma } from '~/prisma/index'
import { processPatch } from '~/migration/sync-ts/processPatch'

export async function syncPatchFromApis(
  patchId: number,
  vndbId: string | null
) {
  try {
    await prisma.patch
      .update({ where: { id: patchId }, data: { vndb_id: vndbId } })
      .catch(() => {})

    const p = await prisma.patch.findUnique({
      where: { id: patchId }
    })
    if (!p) return

    await processPatch({
      id: p.id,
      name_en_us: p.name_en_us,
      name_ja_jp: p.name_ja_jp,
      name_zh_cn: p.name_zh_cn,
      bid: p.bid ?? null,
      vndb_id: p.vndb_id ?? null
    })
  } catch (e) {}
}
