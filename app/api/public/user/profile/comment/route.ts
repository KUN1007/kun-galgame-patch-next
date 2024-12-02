import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import type { UserComment } from '~/types/api/user'

export const getUserComment = async (
  input: z.infer<typeof getUserInfoSchema>
) => {
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
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getUserInfoSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getUserComment(input)
  return NextResponse.json(response)
}
