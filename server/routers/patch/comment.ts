import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { patchCommentSchema } from '~/validations/patch'
import { formatComments } from './_helpers'
import type { PatchComment } from '~/types/api/patch'

export const publishPatchComment = privateProcedure
  .input(patchCommentSchema)
  .mutation(async ({ ctx, input }) => {
    await prisma.patch_comment.create({
      data: {
        content: input.content,
        user_id: ctx.uid,
        patch_id: input.patchId,
        parent_id: input.parentId
      }
    })
  })

export const getPatchComments = publicProcedure
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

    const flatComments: PatchComment[] = data.map((comment) => ({
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

    const nestedComments = formatComments(flatComments)

    return nestedComments
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
      return { message: '取消点赞成功', liked: false }
    } else {
      await prisma.user_patch_comment_like_relation.create({
        data: {
          user_id: ctx.uid,
          comment_id: commentId
        }
      })
      return { message: '点赞成功', liked: true }
    }
  })
