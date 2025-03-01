import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceCreateSchema } from '~/validations/patch'
import { uploadPatchResource } from './_helper'
import type { PatchResource } from '~/types/api/patch'

export const createPatchResource = async (
  input: z.infer<typeof patchResourceCreateSchema>,
  uid: number
) => {
  const {
    patchId,
    type,
    language,
    platform,
    content,
    storage,
    modelName,
    ...resourceData
  } = input

  const currentPatch = await prisma.patch.findUnique({
    where: { id: patchId },
    select: {
      type: true,
      language: true,
      platform: true
    }
  })

  let res: string
  if (storage === 'user') {
    res = content
  } else {
    const result = await uploadPatchResource(patchId, resourceData.hash)
    if (typeof result === 'string') {
      return result
    }
    res = result.downloadLink
  }

  return await prisma.$transaction(
    async (prisma) => {
      const newResource = await prisma.patch_resource.create({
        data: {
          patch_id: patchId,
          user_id: uid,
          type,
          language,
          platform,
          content: res,
          storage,
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

      await prisma.user.update({
        where: { id: uid },
        data: { moemoepoint: { increment: 3 } }
      })

      if (currentPatch) {
        const updatedTypes = [...new Set(currentPatch.type.concat(type))]
        const updatedLanguages = [
          ...new Set(currentPatch.language.concat(language))
        ]
        const updatedPlatforms = [
          ...new Set(currentPatch.platform.concat(platform))
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
