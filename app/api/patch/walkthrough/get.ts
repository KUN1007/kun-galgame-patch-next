import { z } from 'zod'
import { prisma } from '~/prisma/index'
import type { PatchWalkthrough } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const getWalkthrough = async (input: z.infer<typeof patchIdSchema>) => {
  const { patchId } = input

  const data = await prisma.patch_walkthrough.findMany({
    where: { patch_id: patchId },
    include: {
      user: {
        include: {
          _count: {
            select: { patch_walkthrough: true }
          }
        }
      }
    }
  })

  const walkthroughs: PatchWalkthrough[] = data.map((wt) => ({
    id: wt.id,
    name: wt.name,
    content: wt.content,
    created: wt.created,
    updated: wt.updated,
    user: wt.user,
    _count: {
      patch_walkthrough: wt.user._count.patch_walkthrough
    }
  }))

  return walkthroughs
}
