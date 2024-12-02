import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { formatComments } from './_helpers'
import type { PatchComment } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
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
