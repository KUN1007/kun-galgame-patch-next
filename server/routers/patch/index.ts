import { router } from '~/lib/trpc'
import { getPatchById } from './patch'
import { createPatchResource, getPatchResource } from './resource'
import {
  publishPatchComment,
  getPatchComments,
  toggleCommentLike,
  deleteComment,
  updateComment
} from './comment'
import { getPatchHistories } from './history'

export const patchRouter = router({
  getPatchById,

  createPatchResource,

  getPatchResource,

  publishPatchComment,

  getPatchComments,

  toggleCommentLike,

  deleteComment,

  updateComment,

  getPatchHistories
})
