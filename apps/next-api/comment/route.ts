import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { commentSchema } from '~/validations/comment'
import { markdownToText } from '~/utils/markdownToText'
import type { PatchComment } from '~/types/api/comment'

export const getComment = async (input: z.infer<typeof commentSchema>) => {
  const { sortField, sortOrder, page, limit } = input

  const offset = (page - 1) * limit

  const orderByField =
    sortField === 'like'
      ? { like_by: { _count: sortOrder } }
      : { [sortField]: sortOrder }

  const [commentsData, total] = await Promise.all([
    prisma.patch_comment.findMany({
      take: limit,
      skip: offset,
      orderBy: orderByField,
      include: {
        patch: {
          select: {
            name_en_us: true,
            name_ja_jp: true,
            name_zh_cn: true
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
    prisma.patch_comment.count()
  ])

  const comments: PatchComment[] = commentsData.map((comment) => ({
    id: comment.id,
    user: comment.user,
    content: markdownToText(comment.content).slice(0, 233),
    patchName: {
      'en-us': comment.patch.name_en_us,
      'ja-jp': comment.patch.name_ja_jp,
      'zh-cn': comment.patch.name_zh_cn
    },
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
