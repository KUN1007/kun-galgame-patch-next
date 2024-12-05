import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { commentSchema } from '~/validations/comment'
import type { PatchComment } from '~/types/api/comment'

export const getComment = async (input: z.infer<typeof commentSchema>) => {
  const { sortField, sortOrder, page, limit } = input

  const offset = (page - 1) * limit

  const orderByField =
    sortField === 'like'
      ? { like_by: { _count: sortOrder } }
      : { [sortField]: sortOrder }

  const [commentsData, total] = await Promise.all([
    await prisma.patch_comment.findMany({
      take: limit,
      skip: offset,
      orderBy: orderByField,
      include: {
        patch: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            like_by: true
          }
        }
      }
    }),
    await prisma.patch_resource.count()
  ])

  const comments: PatchComment[] = commentsData.map((comment) => ({
    id: comment.id,
    user: comment.user,
    content: comment.content,
    patchName: comment.patch.name,
    patchId: comment.patch_id,
    like: comment._count.like_by,
    created: comment.created
  }))

  return { comments, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, commentSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getComment(input)
  return NextResponse.json(response)
}
