import { z } from 'zod'
import { privateProcedure, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import {
  patchResourceCreateSchema,
  patchResourceUpdateSchema
} from '~/validations/patch'
import type { PatchResource } from '~/types/api/patch'

export const getPatchResource = publicProcedure
  .input(
    z.object({
      patchId: z.number()
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input

    const data = await prisma.patch_resource.findMany({
      where: { patch_id: patchId },
      include: {
        user: {
          include: {
            patch_resource: true
          }
        },
        like_by: {
          include: {
            user: true
          }
        }
      }
    })

    const resources: PatchResource[] = data.map((resource) => ({
      id: resource.id,
      size: resource.size,
      type: resource.type,
      language: resource.language,
      note: resource.note,
      link: resource.link,
      password: resource.password,
      platform: resource.platform,
      likedBy: resource.like_by.map((likeRelation) => ({
        id: likeRelation.user.id,
        name: likeRelation.user.name,
        avatar: likeRelation.user.avatar
      })),
      status: resource.status,
      userId: resource.user_id,
      patchId: resource.patch_id,
      created: String(resource.created),
      updated: String(resource.updated),
      code: resource.code,
      user: {
        id: resource.user.id,
        name: resource.user.name,
        avatar: resource.user.avatar,
        patchCount: resource.user.patch_resource.length
      }
    }))

    return resources
  })

export const createPatchResource = privateProcedure
  .input(patchResourceCreateSchema)
  .mutation(async ({ ctx, input }) => {
    const { patchId, type, language, platform, ...resourceData } = input

    return await prisma.$transaction(async (prisma) => {
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
            user: {
              include: {
                patch_resource: true
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
          patchCount: newResource.user.patch_resource.length
        }
      }

      return resource
    })
  })

export const updatePatchResource = privateProcedure
  .input(patchResourceUpdateSchema)
  .mutation(async ({ ctx, input }) => {
    const { resourceId, patchId, ...resourceData } = input

    const newResource = await prisma.patch_resource.update({
      where: { id: resourceId, user_id: ctx.uid },
      data: {
        ...resourceData
      },
      include: {
        user: {
          include: {
            patch_resource: true
          }
        }
      }
    })

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
        patchCount: newResource.user.patch_resource.length
      }
    }

    return resource
  })
