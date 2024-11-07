import { z } from 'zod'
import { router, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/server/utils/markdownToHtml'
import type {
  Language,
  Patch,
  PatchResource,
  PatchComment,
  PatchHistory
} from '~/types/api/patch'

export const patchRouter = router({
  getPatchById: publicProcedure
    .input(
      z.object({
        id: z.number()
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = input

      const patch = await prisma.patch.findUnique({
        where: { id },
        include: {
          user: true,
          _count: {
            select: {
              favorite_by: true,
              contribute_by: true,
              resource: true,
              comment: true
            }
          }
        }
      })

      if (!patch) {
        return '未找到对应补丁'
      }

      await prisma.patch.update({
        where: { id: patch.id },
        data: { view: { increment: 1 } }
      })

      const response: Patch = {
        id: patch.id,
        name: patch.name,
        vndb_id: patch.vndb_id,
        banner: patch.banner,
        introduction: await markdownToHtml(patch.introduction),
        status: patch.status,
        view: patch.view,
        sell_time: patch.sell_time,
        type: patch.type,
        alias: patch.alias,
        language: patch.language as Language,
        created: String(patch.created),
        updated: String(patch.updated),
        user: {
          id: patch.user.id,
          name: patch.user.name,
          avatar: patch.user.avatar
        },
        _count: patch._count
      }

      return response
    }),

  getPatchResources: publicProcedure
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
    }),

  getPatchComments: publicProcedure
    .input(
      z.object({
        patchId: z.number()
      })
    )
    .query(async ({ ctx, input }) => {
      const { patchId } = input

      const data = await prisma.patch_comment.findMany({
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

      const comments: PatchComment[] = data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        likedBy: comment.like_by.map((likeRelation) => ({
          id: likeRelation.user.id,
          name: likeRelation.user.name,
          avatar: likeRelation.user.avatar
        })),
        parentId: comment.parent_id,
        userId: comment.user_id,
        patchId: comment.patch_id,
        created: String(comment.created),
        updated: String(comment.updated),
        user: {
          id: comment.user.id,
          name: comment.user.name,
          avatar: comment.user.avatar
        }
      }))

      return comments
    }),

  getPatchHistories: publicProcedure
    .input(
      z.object({
        patchId: z.number()
      })
    )
    .query(async ({ ctx, input }) => {
      const { patchId } = input

      const data = await prisma.patch_history.findMany({
        where: { patch_id: patchId },
        include: {
          user: true
        }
      })

      const histories: PatchHistory[] = data.map((history) => ({
        id: history.id,
        action: history.action,
        type: history.type,
        content: history.content,
        userId: history.user_id,
        patchId: history.patch_id,
        created: String(history.created),
        updated: String(history.updated),
        user: {
          id: history.user.id,
          name: history.user.name,
          avatar: history.user.avatar
        }
      }))

      return histories
    })
})
