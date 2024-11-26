import { privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { patchResourceUpdateSchema } from '~/validations/patch'
import type { PatchResource } from '~/types/api/patch'

export const updatePatchResource = privateProcedure
  .input(patchResourceUpdateSchema)
  .mutation(async ({ ctx, input }) => {
    const { resourceId, patchId, ...resourceData } = input

    return await prisma.$transaction(async (prisma) => {
      const newResource = await prisma.patch_resource.update({
        where: { id: resourceId, user_id: ctx.uid },
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
        size: newResource.size,
        type: newResource.type,
        language: newResource.language,
        note: newResource.note,
        hash: newResource.hash,
        content: newResource.content,
        code: newResource.code,
        password: newResource.password,
        platform: newResource.platform,
        likedBy: [],
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
    })
  })
