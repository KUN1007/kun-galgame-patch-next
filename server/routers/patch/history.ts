import { publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/server/utils/markdownToHtml'
import { getPatchHistorySchema } from '~/validations/patch'
import type { PatchHistory } from '~/types/api/patch'

export const getPatchHistory = publicProcedure
  .input(getPatchHistorySchema)
  .query(async ({ ctx, input }) => {
    const { patchId, page, limit } = input
    const offset = (page - 1) * limit

    const data = await prisma.patch_history.findMany({
      where: { patch_id: patchId },
      include: {
        user: true
      },
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    })

    const histories: PatchHistory[] = await Promise.all(
      data.map(async (history) => ({
        id: history.id,
        action: history.action,
        type: history.type,
        content: await markdownToHtml(history.content),
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
    )

    const total = await prisma.patch_history.count({
      where: { patch_id: patchId }
    })

    return { histories, total }
  })
