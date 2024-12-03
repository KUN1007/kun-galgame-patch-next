import { z } from 'zod'
import { deleteFileFromS3 } from '~/lib/s3'
import { prisma } from '~/prisma/index'

const resourceIdSchema = z.object({
  resourceId: z.coerce
    .number({ message: '资源 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export const deleteResource = async (
  input: z.infer<typeof resourceIdSchema>,
  uid: number
) => {
  const admin = await prisma.user.findUnique({ where: { id: uid } })
  if (!admin) {
    return '未找到该管理员'
  }
  const patchResource = await prisma.patch_resource.findUnique({
    where: { id: input.resourceId },
    include: {
      patch: {
        select: {
          name: true
        }
      }
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

  return prisma.$transaction(async (prisma) => {
    await prisma.patch_resource.delete({
      where: { id: input.resourceId }
    })

    await prisma.admin_log.create({
      data: {
        type: 'delete',
        user_id: uid,
        content: `管理员 ${admin.name} 删除了一个补丁资源\n\nGalgame 名:\n${patchResource.patch.name}\n\n补丁资源信息:\n${JSON.stringify(patchResource)}`
      }
    })

    return {}
  })
}
