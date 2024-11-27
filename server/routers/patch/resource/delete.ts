import { z } from 'zod'
import { privateProcedure } from '~/lib/trpc'
import { deleteFileFromS3 } from '~/lib/s3'
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
    const patchResource = await prisma.patch_resource.findUnique({
      where: {
        id: input.resourceId,
        user_id: ctx.uid
      }
    })
    if (!patchResource) {
      return '未找到对应的资源'
    }

    if (patchResource.storage === 's3') {
      const fileName = patchResource.content.split('/').pop()
      const s3Key = `patch/${patchResource.patch_id}/${patchResource.hash}/${fileName}`
      await deleteFileFromS3(s3Key)
    }

    await prisma.patch_resource.delete({
      where: { id: input.resourceId }
    })
  })
