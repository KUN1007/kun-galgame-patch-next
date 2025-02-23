import { convert } from 'html-to-text'
import type { PatchComment } from '~/types/api/patch'

export const nestComments = (flatComments: PatchComment[]): PatchComment[] => {
  const commentMap: { [key: number]: PatchComment } = {}

  flatComments.forEach((comment) => {
    comment.reply = []
    commentMap[comment.id] = { ...comment, quotedContent: null }
  })

  const nestedComments: PatchComment[] = []

  flatComments.forEach((comment) => {
    if (comment.parentId) {
      const parentComment = commentMap[comment.parentId]
      if (parentComment) {
        parentComment.reply.push(comment)
        comment.quotedContent = convert(
          commentMap[comment.parentId].content
        ).slice(0, 107)
        comment.quotedUsername = commentMap[comment.parentId].user.name
      }
    } else {
      nestedComments.push(comment)
    }
  })

  return nestedComments
}
