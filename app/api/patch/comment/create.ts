import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchCommentCreateSchema } from '~/validations/patch'
import { createDedupMessage } from '~/app/api/utils/message'
import type { PatchComment } from '~/types/api/patch'

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

    if (parentComment!.user_id !== uid) {
      await createDedupMessage({
        type: 'comment',
        content: `评论了您的评论! -> ${parentComment!.content.slice(0, 107)}`,
        sender_id: uid,
        recipient_id: parentComment!.user_id,
        link: `/patch/${input.patchId}/comment`
      })
    }
  }

  const newComment: Omit<PatchComment, 'user'> = {
    id: data.id,
    content: data.content,
    isLike: false,
    likeCount: 0,
    parentId: data.parent_id,
    userId: data.user_id,
    patchId: data.patch_id,
    reply: [],
    created: String(data.created),
    updated: String(data.updated)
  }

  return newComment
}
