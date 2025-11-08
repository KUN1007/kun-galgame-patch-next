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
      where: { id: patchId },
      select: { id: true, name: true, bid: true, vndb_id: true }
    })
    if (!p) return

    await processPatch({
      id: p.id,
      name: p.name,
      bid: p.bid ?? null,
      vndb_id: p.vndb_id ?? null
    })
  } catch (e) {
    console.error('syncPatchFromApis failed:', e)
  }
}
