import { privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { patchResourceUpdateSchema } from '~/validations/patch'
import type { PatchResource } from '~/types/api/patch'

export const updatePatchResource = privateProcedure
  .input(patchResourceUpdateSchema)
  .mutation(async ({ ctx, input }) => {
    const { resourceId, patchId, link, ...resourceData } = input

    return await prisma.$transaction(async (prisma) => {
      const newResource = await prisma.patch_resource.update({
        where: { id: resourceId, user_id: ctx.uid },
        data: {
          ...resourceData
        },
        include: {
          link: {
            select: {
              id: true,
              type: true,
              hash: true,
              content: true
            }
          },
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
        size: newResource.size,
        type: newResource.type,
        language: newResource.language,
        note: newResource.note,
        link: newResource.link,
        password: newResource.password,
        platform: newResource.platform,
        likedBy: [],
        status: newResource.status,
        userId: newResource.user_id,
        patchId: newResource.patch_id,
        code: newResource.code,
        created: String(newResource.created),
        updated: String(newResource.updated),
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
