import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { patchCommentSchema } from '~/validations/patch'
import type { PatchComment } from '~/types/api/patch'

export const publishPatchComment = privateProcedure
  .input(patchCommentSchema)
  .mutation(async ({ ctx, input }) => {
    const data = await prisma.patch_comment.create({
      data: {
        content: input.content,
        user_id: ctx.uid,
        patch_id: input.patchId,
        parent_id: input.parentId
      }
    })

    const newComment: Omit<PatchComment, 'user'> = {
      id: data.id,
      content: data.content,
      likedBy: [],
      parentId: data.parent_id,
      userId: data.user_id,
      patchId: data.patch_id,
      created: String(data.created),
      updated: String(data.updated)
    }

    return newComment
  })

export const getPatchComments = publicProcedure
  .input(
    z.object({
      patchId: z.number(),
      cursor: z.number().optional()
      // limit: z.number().default(10)
    })
  )
  .query(async ({ ctx, input }) => {
    const { patchId, cursor } = input
    // @extendable
    const limit = 10

    const data = await prisma.patch_comment.findMany({
      where: {
        patch_id: patchId,
        ...(cursor ? { id: { lt: cursor } } : {})
      },
      take: limit + 1,
      orderBy: {
        id: 'desc'
      },
      include: {
        user: true,
        like_by: {
          include: {
            user: true
          }
        },
        parent: {
          include: {
            user: true
          }
        }
      }
    })

    const totalComments = await prisma.patch_comment.count({
      where: {
        patch_id: patchId
      }
    })

    let hasMore = false
    if (data.length > limit) {
      hasMore = true
      data.pop()
    }

    const comments: PatchComment[] = data.map((comment) => ({
      id: comment.id,
      content: comment.content,
      likedBy: comment.like_by.map((likeRelation) => ({
        id: likeRelation.user.id,
        name: likeRelation.user.name,
        avatar: likeRelation.user.avatar
      })),
      parentId: comment.parent_id,
      parent: comment.parent,
      userId: comment.user_id,
      patchId: comment.patch_id,
      created: String(comment.created),
      updated: String(comment.updated),
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar: comment.user.avatar
      },
      quotedContent: comment.parent?.content,
      quotedUsername: comment.parent?.user.name
    }))

    return {
      comments,
      hasMore,
      nextCursor: hasMore ? data[data.length - 1].id : undefined,
      total: totalComments
    }
  })

export const toggleLike = privateProcedure
  .input(
    z.object({
      commentId: z.number({ message: '评论 ID 必须为数字' }).min(1).max(9999999)
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { commentId } = input

    const comment = await prisma.patch_comment.findUnique({
      where: { id: commentId }
    })
    if (!comment) {
      return '未找到评论'
    }
    if (comment.user_id === ctx.uid) {
      return '您不能给自己点赞'
    }

    const existingLike =
      await prisma.user_patch_comment_like_relation.findUnique({
        where: {
          user_id_comment_id: {
            user_id: ctx.uid,
            comment_id: commentId
          }
        }
      })

    if (existingLike) {
      await prisma.user_patch_comment_like_relation.delete({
        where: {
          user_id_comment_id: {
            user_id: ctx.uid,
            comment_id: commentId
          }
        }
      })
    } else {
      await prisma.user_patch_comment_like_relation.create({
        data: {
          user_id: ctx.uid,
          comment_id: commentId
        }
      })
    }

    await prisma.user.update({
      where: { id: comment.user_id },
      data: { moemoepoint: { increment: existingLike ? -1 : 1 } }
    })

    return !existingLike
  })
