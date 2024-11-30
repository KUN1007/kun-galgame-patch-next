import { NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminComment } from '~/types/api/admin'

export const getComment = async () => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    await prisma.patch_comment.findMany({
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
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
    await prisma.patch.count()
  ])

  const comments: AdminComment[] = data.map((comment) => ({
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

export async function GET(req: Request) {}
