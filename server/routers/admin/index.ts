import { router } from '~/lib/trpc'
import { getAdminStats } from './stats'
import { getUserInfo } from './user'
import { getCreator, approveCreator, declineCreator } from './creator'
import { getGalgame } from './galgame'
import { getPatchResource } from './resource'
import { getComment } from './comment'

export const adminRouter = router({
  getAdminStats,

  getUserInfo,

  getCreator,

  getGalgame,
  approveCreator,
  declineCreator,

  getPatchResource,

  getComment
})
