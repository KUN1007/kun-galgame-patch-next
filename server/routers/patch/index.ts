import { router } from '~/lib/trpc'
import { getPatchById } from './patch'
import {
  createPatchResource,
  getPatchResource,
  updatePatchResource,
  toggleResourceLike
} from './resource'
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

  updatePatchResource,

  toggleResourceLike,

  publishPatchComment,

  getPatchComments,

  toggleCommentLike,

  deleteComment,

  updateComment,

  getPatchHistories
})
