import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceUpdateSchema } from '~/validations/patch'

export const updatePatchResource = async (
  input: z.infer<typeof patchResourceUpdateSchema>
) => {
  const { resourceId, patchId, content, ...resourceData } = input
  const resource = await prisma.patch_resource.findUnique({
    where: { id: resourceId }
  })
  if (!resource) {
    return '未找到该资源'
  }

  return await prisma.$transaction(async (prisma) => {
    await prisma.patch_resource.update({
      where: { id: resourceId },
      data: {
        ...resourceData
      },
      include: {
        user: {
          include: {
            _count: {
              select: { patch_resource: true }
            }
          }
        }
      }
    })

    return {}
  })
}
