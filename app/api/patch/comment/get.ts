import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { formatComments } from './_helpers'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import type { PatchComment } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const getPatchComment = async (
  input: z.infer<typeof patchIdSchema>,
  uid: number
) => {
  const { patchId } = input

  const data = await prisma.patch_comment.findMany({
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
    }
  })

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
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar: comment.user.avatar
      }
    }))
  )

  const nestedComments = formatComments(flatComments)

  return nestedComments
}
