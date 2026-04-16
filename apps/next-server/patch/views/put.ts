import { prisma } from '~/prisma/index'

export const updatePatchViews = async (patchId: number) => {
  await prisma.patch.update({
    where: { id: patchId },
    data: { view: { increment: 1 } }
  })
}
