import { z } from 'zod'
import { deleteFileFromS3 } from '~/lib/s3/deleteFileFromS3'
import { prisma } from '~/prisma/index'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const deletePatchById = async (
  input: z.infer<typeof patchIdSchema>,
  uid: number,
  userRole: number
) => {
  const { patchId } = input

  const patch = await prisma.patch.findUnique({
    where: { id: patchId }
  })
  if (!patch) {
    return '未找到该游戏'
  }
  if (uid !== patch.user_id && userRole < 4) {
    return '您没有权限删除该游戏, 该游戏仅限游戏发布者或超级管理员可删除'
  }

  const patchResources = await prisma.patch_resource.findMany({
    where: { patch_id: patchId },
    include: {
      user: {
        select: { id: true }
      }
    }
  })
  const resourceUserIds = patchResources.map((res) => res.user.id)
  const hasOtherUserResource = resourceUserIds.some((id) => id !== uid)
  if (hasOtherUserResource && userRole < 4) {
    return '这个 Galgame 下有其它用户发布的 Galgame 补丁资源, 请与这些用户协商后联系超级管理员删除'
  }

  return await prisma.$transaction(async (prisma) => {
    if (patchResources.length > 0) {
      await Promise.all(
        patchResources.map(async (resource) => {
          if (resource.storage === 's3') {
            const fileName = resource.content.split('/').pop()
            const s3Key = `patch/${resource.patch_id}/${resource.hash}/${fileName}`
            await deleteFileFromS3(s3Key)
          }

          await prisma.patch_resource.delete({
            where: { id: resource.id }
          })
        })
      )
    }

    await prisma.patch.delete({
      where: { id: patchId }
    })

    return {}
  })
}
