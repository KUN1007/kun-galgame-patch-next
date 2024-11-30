import { router } from '~/lib/trpc'
import { getPatchById, togglePatchFavorite, updatePatchBanner } from './patch'
import {
  getPatchIntroduction,
  handleAddPatchTag,
  handleRemovePatchTag
} from './introduction'
import { createPatchResource } from './resource/create'
import { getPatchResource } from './resource/get'
import { updatePatchResource } from './resource/update'
import { toggleResourceLike } from './resource/toggleLike'
import { deleteResource } from './resource/delete'
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
  togglePatchFavorite,
  updatePatchBanner,

  getPatchIntroduction,
  handleAddPatchTag,
  handleRemovePatchTag,

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
