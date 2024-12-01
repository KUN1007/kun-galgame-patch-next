import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import {
  kunParseGetQuery,
  kunParsePostBody,
  kunParsePutBody,
  kunParseDeleteQuery
} from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { formatComments } from './_helpers'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import {
  patchCommentCreateSchema,
  patchCommentUpdateSchema
} from '~/validations/patch'
import { createDedupMessage } from '~/app/api/utils/message'
import type { PatchComment } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

const commentIdSchema = z.object({
  commentId: z.number({ message: '评论 ID 必须为数字' }).min(1).max(9999999)
})

export const getPatchComment = async (input: z.infer<typeof patchIdSchema>) => {
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
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchComment(input)
  return NextResponse.json(response)
}

export const createPatchComment = async (
  input: z.infer<typeof patchCommentCreateSchema>,
  uid: number
) => {
  const data = await prisma.patch_comment.create({
    data: {
      content: input.content,
      user_id: uid,
      patch_id: input.patchId,
      parent_id: input.parentId
    }
  })

  if (input.parentId) {
    const parentComment = await prisma.patch_comment.findUnique({
      where: { id: input.parentId }
    })
    if (!parentComment) {
      return
    }

    await createDedupMessage({
      type: 'like',
      content: `点赞了您的评论! -> ${parentComment.content.slice(0, 107)}`,
      sender_id: uid,
      recipient_id: parentComment.user_id
    })
  }

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
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, patchCommentCreateSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await createPatchComment(input, payload.uid)
  return NextResponse.json(response)
}

export const updateComment = async (
  input: z.infer<typeof patchCommentUpdateSchema>,
  uid: number
) => {
  const { commentId, content } = input

  await prisma.patch_comment.update({
    where: { id: commentId, user_id: uid },
    data: {
      content,
      edit: Date.now().toString()
    },
    include: {
      user: true,
      like_by: {
        include: {
          user: true
        }
      }
    }
  })
  return {}
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, patchCommentUpdateSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await updateComment(input, payload.uid)
  return NextResponse.json(response)
}

const deleteCommentWithReplies = async (commentId: number) => {
  const childComments = await prisma.patch_comment.findMany({
    where: { parent_id: commentId }
  })

  for (const child of childComments) {
    await deleteCommentWithReplies(child.id)
  }

  await prisma.patch_comment.delete({
    where: { id: commentId }
  })
}

export const deleteComment = async (
  input: z.infer<typeof commentIdSchema>,
  uid: number
) => {
  return await prisma.$transaction(async (prisma) => {
    const comment = await prisma.patch_comment.findUnique({
      where: {
        id: input.commentId,
        user_id: uid
      }
    })
    if (!comment) {
      return '未找到对应的评论'
    }

    await deleteCommentWithReplies(input.commentId)
    return {}
  })
}

export const DELETE = async (req: NextRequest) => {
  const input = kunParseDeleteQuery(req, commentIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await deleteComment(input, payload.uid)
  return NextResponse.json(response)
}
