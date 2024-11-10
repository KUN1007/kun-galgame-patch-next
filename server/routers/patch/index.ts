import { router } from '~/lib/trpc'
import { getPatchById } from './patch'
import { getPatchResources } from './resource'
import {
  publishPatchComment,
  getPatchComments,
  toggleCommentLike,
  deleteComment
} from './comment'
import { getPatchHistories } from './history'

export const patchRouter = router({
  getPatchById,

  getPatchResources,

  publishPatchComment,

  getPatchComments,

  toggleCommentLike,

  deleteComment,

  getPatchHistories
})
