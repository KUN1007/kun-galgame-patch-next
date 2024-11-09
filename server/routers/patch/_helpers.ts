import type { PatchComment } from '~/types/api/patch'

export const nestComments = (flatComments: PatchComment[]): PatchComment[] => {
  const commentMap: { [key: number]: PatchComment } = {}

  flatComments.forEach((comment) => {
    comment.reply = []
    commentMap[comment.id] = comment
  })

  const nestedComments: PatchComment[] = []

  flatComments.forEach((comment) => {
    if (comment.parentId) {
      const parentComment = commentMap[comment.parentId]
      if (parentComment) {
        parentComment.reply.push(comment)
      }
    } else {
      nestedComments.push(comment)
    }
  })

  return nestedComments
}
