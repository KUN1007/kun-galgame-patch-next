import { z } from 'zod'
import { publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import type { PatchHistory } from '~/types/api/patch'

export const getPatchHistories = publicProcedure
  .input(
    z.object({
      patchId: z.number()
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input

    const data = await prisma.patch_history.findMany({
      where: { patch_id: patchId },
      include: {
        user: true
      }
    })

    const histories: PatchHistory[] = data.map((history) => ({
      id: history.id,
      action: history.action,
      type: history.type,
      content: history.content,
      userId: history.user_id,
      patchId: history.patch_id,
      created: String(history.created),
      updated: String(history.updated),
      user: {
        id: history.user.id,
        name: history.user.name,
        avatar: history.user.avatar
      }
    }))

    return histories
  })
