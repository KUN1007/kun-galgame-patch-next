import { router } from '~/lib/trpc'
import { getPatchById } from './patch'
import { getPatchResources } from './resource'
import { publishPatchComment, getPatchComments, toggleLike } from './comment'
import { getPatchHistories } from './history'

export const patchRouter = router({
  getPatchById,

  getPatchResources,

  publishPatchComment,

  getPatchComments,

  toggleLike,

  getPatchHistories
})
