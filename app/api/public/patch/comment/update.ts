import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchCommentUpdateSchema } from '~/validations/patch'

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
