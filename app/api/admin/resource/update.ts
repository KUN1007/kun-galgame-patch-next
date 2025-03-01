import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceUpdateSchema } from '~/validations/patch'
import {
  uploadPatchResource,
  deletePatchResource
} from '~/app/api/patch/resource/_helper'

export const updatePatchResource = async (
  input: z.infer<typeof patchResourceUpdateSchema>,
  uid: number
) => {
  const admin = await prisma.user.findUnique({ where: { id: uid } })
  if (!admin) {
    return '未找到该管理员'
  }

  const { resourceId, patchId, content, modelName, ...resourceData } = input
  const resource = await prisma.patch_resource.findUnique({
    where: { id: resourceId }
  })
  if (!resource) {
    return '未找到该资源'
  }

  let newContent: string
  if (resource.storage === 'user' || resource.content === content) {
    newContent = content
  } else {
    await deletePatchResource(
      resource.content,
      resource.patch_id,
      resource.hash
    )
    const result = await uploadPatchResource(patchId, resourceData.hash)
    if (typeof result === 'string') {
      return result
    }
    newContent = result.downloadLink
  }

  return await prisma.$transaction(async (prisma) => {
    await prisma.patch_resource.update({
      where: { id: resourceId },
      data: {
        content: newContent,
        model_name: modelName,
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

    await prisma.admin_log.create({
      data: {
        type: 'update',
        user_id: uid,
        content: `管理员 ${admin.name} 更新了一个补丁资源信息\n\n原补丁资源信息:\n${JSON.stringify(resource)}}`
      }
    })

    return {}
  })
}
