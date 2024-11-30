import { z } from 'zod'
import { publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'

export const getPatchContributor = publicProcedure
  .input(
    z.object({
      patchId: z.coerce.number()
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input

    const data = await prisma.user_patch_contribute_relation.findMany({
      where: { patch_id: patchId },
      include: {
        user: true
      },
      orderBy: { created: 'desc' }
    })

    const contributors: KunUser[] = data.map((c) => ({
      id: c.user.id,
      name: c.user.name,
      avatar: c.user.avatar
    }))

    return contributors
  })
