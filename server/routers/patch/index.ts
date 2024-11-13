import { router } from '~/lib/trpc'
import {
  getPatchById,
  getPatchIntroduction,
  togglePatchFavorite
} from './patch'
import {
  createPatchResource,
  getPatchResource,
  updatePatchResource,
  toggleResourceLike,
  deleteResource
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

  getPatchIntroduction,

  togglePatchFavorite,

  createPatchResource,

  getPatchResource,

  updatePatchResource,

  toggleResourceLike,

  deleteResource,

  publishPatchComment,

  getPatchComments,

  toggleCommentLike,

  deleteComment,

  updateComment,

  getPatchHistories
})
