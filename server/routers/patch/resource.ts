import { z } from 'zod'
import { privateProcedure, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { patchResourceCreateSchema } from '~/validations/patch'
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
        user: true,
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
      time: resource.time,
      status: resource.status,
      userId: resource.user_id,
      patchId: resource.patch_id,
      created: String(resource.created),
      updated: String(resource.updated),
      code: resource.code,
      user: {
        id: resource.user.id,
        name: resource.user.name,
        avatar: resource.user.avatar
      }
    }))

    return resources
  })

export const createPatchResource = privateProcedure
  .input(patchResourceCreateSchema)
  .mutation(async ({ ctx, input }) => {
    const { patchId, ...resourceData } = input

    const newResource = await prisma.patch_resource.create({
      data: {
        patch_id: patchId,
        user_id: ctx.uid,
        ...resourceData
      },
      include: {
        user: true
      }
    })

    return {
      id: newResource.id,
      patchId: newResource.patch_id,
      userId: newResource.user_id,
      type: newResource.type,
      language: newResource.language,
      platform: newResource.platform,
      size: newResource.size,
      code: newResource.code,
      password: newResource.password,
      note: newResource.note,
      links: newResource.link,
      created: String(newResource.created),
      updated: String(newResource.updated),
      user: {
        id: newResource.user.id,
        name: newResource.user.name,
        avatar: newResource.user.avatar
      }
    }
  })
