import { z } from 'zod'
import { publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import type { PatchResource } from '~/types/api/patch'

export const getPatchResource = publicProcedure
  .input(
    z.object({
      patchId: z.coerce.number()
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId } = input

    const data = await prisma.patch_resource.findMany({
      where: { patch_id: patchId },
      include: {
        user: {
          include: {
            _count: {
              select: { patch_resource: true }
            }
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
      storage: resource.storage,
      size: resource.size,
      type: resource.type,
      language: resource.language,
      note: resource.note,
      hash: resource.hash,
      content: resource.content,
      code: resource.code,
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
      user: {
        id: resource.user.id,
        name: resource.user.name,
        avatar: resource.user.avatar,
        patchCount: resource.user._count.patch_resource
      }
    }))

    return resources
  })
