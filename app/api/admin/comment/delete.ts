import { z } from 'zod'
import { prisma } from '~/prisma/index'

const commentIdSchema = z.object({
  commentId: z.coerce
    .number({ message: '评论 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

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

export const deleteComment = async (input: z.infer<typeof commentIdSchema>) => {
  return await prisma.$transaction(async (prisma) => {
    const comment = await prisma.patch_comment.findUnique({
      where: { id: input.commentId }
    })
    if (!comment) {
      return '未找到对应的评论'
    }

    await deleteCommentWithReplies(input.commentId)
    return {}
  })
}
