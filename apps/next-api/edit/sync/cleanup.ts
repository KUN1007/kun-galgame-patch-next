import { prisma } from '~/prisma/index'

// Remove patch-scoped side effects before re-syncing with a different VNDB id.
// This does NOT remove global person/character records or global voice links.
export const cleanupPatchSideEffects = async (patchId: number) => {
  // Clear links
  await prisma.patch_link
    .deleteMany({ where: { patch_id: patchId } })
    .catch(() => {})
  // Clear cover and screenshots
  await prisma.patch_cover
    .deleteMany({ where: { patch_id: patchId } })
    .catch(() => {})
  await prisma.patch_screenshot
    .deleteMany({ where: { patch_id: patchId } })
    .catch(() => {})
  // Clear releases
  await prisma.patch_release
    .deleteMany({ where: { patch_id: patchId } })
    .catch(() => {})
  // Clear company relations and decrement counts
  try {
    const rels = await prisma.patch_company_relation.findMany({
      where: { patch_id: patchId }
    })
    const companyIds = rels.map((r) => r.company_id)
    await prisma.patch_company_relation.deleteMany({
      where: { patch_id: patchId }
    })
    for (const cid of companyIds) {
      await prisma.patch_company
        .update({ where: { id: cid }, data: { count: { decrement: 1 } } })
        .catch(() => {})
    }
  } catch (e) {}
  // Clear tag relations and decrement counts
  try {
    const rels = await prisma.patch_tag_relation.findMany({
      where: { patch_id: patchId }
    })
    const tagIds = rels.map((r) => r.tag_id)
    await prisma.patch_tag_relation.deleteMany({ where: { patch_id: patchId } })
    for (const tid of tagIds) {
      await prisma.patch_tag
        .update({ where: { id: tid }, data: { count: { decrement: 1 } } })
        .catch(() => {})
    }
  } catch (e) {}
  // Clear person/character relations (but keep the global records)
  await prisma.patch_person_relation
    .deleteMany({ where: { patch_id: patchId } })
    .catch(() => {})
  await prisma.patch_char_relation
    .deleteMany({ where: { patch_id: patchId } })
    .catch(() => {})
}
