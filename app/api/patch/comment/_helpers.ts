import { convert } from 'html-to-text'
import type { PatchComment } from '~/types/api/patch'

export const formatComments = (
  flatComments: PatchComment[]
): PatchComment[] => {
  const commentMap: { [key: number]: PatchComment } = {}

  flatComments.forEach((comment) => {
    commentMap[comment.id] = { ...comment, quotedContent: null }
  })

  flatComments.forEach((comment) => {
    if (comment.parentId && commentMap[comment.parentId]) {
      comment.quotedContent = convert(
        commentMap[comment.parentId].content
      ).slice(0, 107)
      comment.quotedUsername = commentMap[comment.parentId].user.name
    }
  })

  return flatComments
}
