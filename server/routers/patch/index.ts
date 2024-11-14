import { router } from '~/lib/trpc'
import {
  getPatchById,
  getPatchIntroduction,
  togglePatchFavorite,
  updatePatchBanner
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
import {
  getPullRequest,
  mergePullRequest,
  declinePullRequest
} from './pull-request'
import { getPatchContributor } from './contributor'

export const patchRouter = router({
  getPatchById,
  getPatchIntroduction,
  togglePatchFavorite,
  updatePatchBanner,

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

  getPullRequest,
  mergePullRequest,
  declinePullRequest,

  getPatchContributor
})
