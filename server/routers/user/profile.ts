import { publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import type {
  UserResource,
  UserContribute,
  UserComment
} from '~/types/api/user'

export const getUserPatchResource = publicProcedure
  .input(getUserInfoSchema)
  .query(async ({ ctx, input }) => {
    const { uid, page, limit } = input
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      await prisma.patch_resource.findMany({
        where: { user_id: uid },
        include: {
          patch: true
        },
        orderBy: { created: 'desc' },
        skip: offset,
        take: limit
      }),
      await prisma.patch_resource.count({
        where: { user_id: uid }
      })
    ])

    const resources: UserResource[] = data.map((res) => ({
      id: res.id,
      patchId: res.patch.id,
      patchName: res.patch.name,
      patchBanner: res.patch.banner,
      size: res.size,
      type: res.type,
      language: res.language,
      platform: res.platform,
      created: String(res.created)
    }))

    return { resources, total }
  })

export const getUserGalgame = publicProcedure
  .input(getUserInfoSchema)
  .query(async ({ ctx, input }) => {
    const { uid, page, limit } = input
    const offset = (page - 1) * limit

    const [galgames, total] = await Promise.all([
      await prisma.patch.findMany({
        where: { user_id: uid },
        select: {
          id: true,
          name: true,
          banner: true,
          view: true,
          type: true,
          language: true,
          platform: true,
          created: true,
          _count: {
            select: {
              favorite_by: true,
              contribute_by: true,
              resource: true,
              comment: true
            }
          }
        },
        orderBy: { created: 'desc' },
        take: limit,
        skip: offset
      }),
      await prisma.patch.count({
        where: { user_id: uid }
      })
    ])

    return { galgames, total }
  })

export const getUserContribute = publicProcedure
  .input(getUserInfoSchema)
  .query(async ({ ctx, input }) => {
    const { uid, page, limit } = input
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      await prisma.user_patch_contribute_relation.findMany({
        where: { user_id: uid },
        include: {
          patch: {
            select: {
              name: true
            }
          }
        },
        orderBy: { created: 'desc' },
        take: limit,
        skip: offset
      }),
      await prisma.user_patch_contribute_relation.count({
        where: { user_id: uid }
      })
    ])

    const contributes: UserContribute[] = data.map((gal) => ({
      id: gal.id,
      patchId: gal.patch_id,
      patchName: gal.patch.name,
      created: String(gal.created)
    }))

    return { contributes, total }
  })

export const getUserComment = publicProcedure
  .input(getUserInfoSchema)
  .query(async ({ ctx, input }) => {
    const { uid, page, limit } = input
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      await prisma.patch_comment.findMany({
        where: { user_id: uid },
        include: {
          user: true,
          patch: true,
          parent: {
            include: {
              user: true
            }
          },
          like_by: {
            include: {
              user: true
            }
          }
        },
        orderBy: { created: 'desc' },
        take: limit,
        skip: offset
      }),
      await prisma.patch_comment.count({
        where: { user_id: uid }
      })
    ])

    const comments: UserComment[] = data.map((comment) => ({
      id: comment.id,
      content: comment.content,
      like: comment.like_by.length,
      userId: comment.user_id,
      patchId: comment.patch_id,
      patchName: comment.patch.name,
      created: String(comment.created),
      quotedUserUid: comment.parent?.user.id,
      quotedUsername: comment.parent?.user.name
    }))

    return { comments, total }
  })
