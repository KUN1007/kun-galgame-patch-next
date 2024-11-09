import { z } from 'zod'
import { publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/server/utils/markdownToHtml'
import type { Language, Patch } from '~/types/api/patch'

export const getPatchById = publicProcedure
  .input(
    z.object({
      id: z.number()
    })
  )
  .query(async ({ ctx, input }) => {
    const { id } = input

    const patch = await prisma.patch.findUnique({
      where: { id },
      include: {
        user: true,
        _count: {
          select: {
            favorite_by: true,
            contribute_by: true,
            resource: true,
            comment: true
          }
        }
      }
    })

    if (!patch) {
      return '未找到对应补丁'
    }

    await prisma.patch.update({
      where: { id: patch.id },
      data: { view: { increment: 1 } }
    })

    const response: Patch = {
      id: patch.id,
      name: patch.name,
      vndb_id: patch.vndb_id,
      banner: patch.banner,
      introduction: await markdownToHtml(patch.introduction),
      status: patch.status,
      view: patch.view,
      sell_time: patch.sell_time,
      type: patch.type,
      alias: patch.alias,
      language: patch.language as Language,
      created: String(patch.created),
      updated: String(patch.updated),
      user: {
        id: patch.user.id,
        name: patch.user.name,
        avatar: patch.user.avatar
      },
      _count: patch._count
    }

    return response
  })
