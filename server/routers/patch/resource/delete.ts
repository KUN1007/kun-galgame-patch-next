import { z } from 'zod'
import { privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'

export const deleteResource = privateProcedure
  .input(
    z.object({
      resourceId: z
        .number({ message: '资源 ID 必须为数字' })
        .min(1)
        .max(9999999)
    })
  )
  .mutation(async ({ ctx, input }) => {
    const comment = await prisma.patch_resource.findUnique({
      where: {
        id: input.resourceId,
        user_id: ctx.uid
      }
    })

    if (!comment) {
      return '未找到对应的资源'
    }

    await prisma.patch_resource.delete({
      where: { id: input.resourceId }
    })
  })
