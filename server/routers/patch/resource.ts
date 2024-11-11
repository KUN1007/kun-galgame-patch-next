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
    const { patchId, ...resourceData } = input

    const data = await prisma.patch_resource.create({
      data: {
        patch_id: patchId,
        user_id: ctx.uid,
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

    const newResource: PatchResource = {
      id: data.id,
      size: data.size,
      type: data.type,
      language: data.language,
      note: data.note,
      link: data.link,
      password: data.password,
      platform: data.platform,
      likedBy: [],
      status: data.status,
      userId: data.user_id,
      patchId: data.patch_id,
      created: String(data.created),
      updated: String(data.updated),
      code: data.code,
      user: {
        id: data.user.id,
        name: data.user.name,
        avatar: data.user.avatar,
        patchCount: data.user.patch_resource.length
      }
    }

    return newResource
  })
