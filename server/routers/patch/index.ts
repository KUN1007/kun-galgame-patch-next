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
  getPatchComment,
  toggleCommentLike,
  deleteComment,
  updateComment
} from './comment'
import { getPatchHistory } from './history'
import { getPullRequest } from './pull-request'

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

  getPatchComment,

  toggleCommentLike,

  deleteComment,

  updateComment,

  getPatchHistory,

  getPullRequest
})
