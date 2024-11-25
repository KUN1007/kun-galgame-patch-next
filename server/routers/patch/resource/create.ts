import { privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { patchResourceCreateSchema } from '~/validations/patch'
import type { PatchResource } from '~/types/api/patch'

export const createPatchResource = privateProcedure
  .input(patchResourceCreateSchema)
  .mutation(async ({ ctx, input }) => {
    const { patchId, type, language, platform, link, ...resourceData } = input

    return await prisma.$transaction(async (prisma) => {
      await prisma.patch_resource_link.createMany({
        data: link.map(({ type, hash, content }) => ({
          patch_id: patchId,
          patch_resource_id: newResource.id,
          type,
          hash,
          content
        }))
      })

      const [newResource, currentPatch] = await Promise.all([
        prisma.patch_resource.create({
          data: {
            patch_id: patchId,
            user_id: ctx.uid,
            type,
            language,
            platform,
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
        }),
        prisma.patch.findUnique({
          where: { id: patchId },
          select: {
            type: true,
            language: true,
            platform: true
          }
        })
      ])

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
        size: newResource.size,
        type: newResource.type,
        link: newResource.link,
        language: newResource.language,
        note: newResource.note,
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
