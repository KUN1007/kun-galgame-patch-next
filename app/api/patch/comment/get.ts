import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import { convert } from 'html-to-text'
import { getPatchCommentSchema } from '~/validations/patch'
import type { PatchComment } from '~/types/api/patch'

export const getPatchComment = async (
  input: z.infer<typeof getPatchCommentSchema>,
  uid: number
) => {
  const { patchId, page, limit } = input
  const skip = (page - 1) * limit

  const [total, data] = await Promise.all([
    prisma.patch_comment.count({ where: { patch_id: patchId } }),
    prisma.patch_comment.findMany({
      where: { patch_id: patchId },
      include: {
        user: true,
        like_by: {
          where: {
            user_id: uid
          }
        },
        _count: {
          select: { like_by: true }
        }
      },
      orderBy: { created: 'desc' },
      skip,
      take: limit
    })
  ])

  const flatComments: PatchComment[] = await Promise.all(
    data.map(async (comment) => ({
      id: comment.id,
      content: await markdownToHtml(comment.content),
      isLike: comment.like_by.length > 0,
      likeCount: comment._count.like_by,
      parentId: comment.parent_id,
      userId: comment.user_id,
      patchId: comment.patch_id,
      created: String(comment.created),
      updated: String(comment.updated),
      reply: [],
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar: comment.user.avatar
      }
    }))
  )

  const parentIds = Array.from(
    new Set(
      flatComments
        .map((c) => c.parentId)
        .filter((id): id is number => typeof id === 'number')
    )
  )

  if (parentIds.length > 0) {
    const parents = await prisma.patch_comment.findMany({
      where: { id: { in: parentIds } },
      include: { user: true }
    })

    const parentMap = new Map<number, { username: string; content: string }>()
    for (const p of parents) {
      const html = await markdownToHtml(p.content)
      parentMap.set(p.id, {
        username: p.user.name,
        content: convert(html).slice(0, 107)
      })
    }

    for (const c of flatComments) {
      if (c.parentId && parentMap.has(c.parentId)) {
        const p = parentMap.get(c.parentId)!
        c.quotedUsername = p.username
        c.quotedContent = p.content
      }
    }
  }

  return { comments: flatComments, total }
}
