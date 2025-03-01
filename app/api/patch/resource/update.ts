import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceUpdateSchema } from '~/validations/patch'
import { uploadPatchResource, deletePatchResource } from './_helper'
import type { PatchResource } from '~/types/api/patch'

export const updatePatchResource = async (
  input: z.infer<typeof patchResourceUpdateSchema>,
  uid: number
) => {
  const { resourceId, patchId, content, modelName, ...resourceData } = input
  const resource = await prisma.patch_resource.findUnique({
    where: { id: resourceId }
  })
  if (!resource) {
    return '未找到该资源'
  }
  if (resource.user_id !== uid) {
    return '您没有权限更改该补丁资源'
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

  return await prisma.$transaction(
    async (prisma) => {
      const newResource = await prisma.patch_resource.update({
        where: { id: resourceId, user_id: uid },
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

      const currentPatch = await prisma.patch.findUnique({
        where: { id: patchId },
        select: {
          type: true,
          language: true,
          platform: true
        }
      })
      if (currentPatch) {
        const updatedTypes = [
          ...new Set(currentPatch.type.concat(resourceData.type))
        ]
        const updatedLanguages = [
          ...new Set(currentPatch.language.concat(resourceData.language))
        ]
        const updatedPlatforms = [
          ...new Set(currentPatch.platform.concat(resourceData.platform))
        ]

        await prisma.patch.update({
          where: { id: patchId },
          data: {
            type: { set: updatedTypes },
            language: { set: updatedLanguages },
            platform: { set: updatedPlatforms }
          }
        })
      }

      const resource: PatchResource = {
        id: newResource.id,
        storage: newResource.storage,
        name: newResource.name,
        modelName: newResource.model_name,
        size: newResource.size,
        type: newResource.type,
        language: newResource.language,
        note: newResource.note,
        hash: newResource.hash,
        content: newResource.content,
        code: newResource.code,
        password: newResource.password,
        platform: newResource.platform,
        likeCount: 0,
        isLike: false,
        status: newResource.status,
        userId: newResource.user_id,
        patchId: newResource.patch_id,
        created: String(newResource.created),
        user: {
          id: newResource.user.id,
          name: newResource.user.name,
          avatar: newResource.user.avatar,
          patchCount: newResource.user._count.patch_resource
        }
      }

      return resource
    },
    { timeout: 60000 }
  )
}
