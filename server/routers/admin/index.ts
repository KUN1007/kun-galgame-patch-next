import { router } from '~/lib/trpc'
import { getAdminStats } from './stats'
import { getUserInfo } from './user'
import { getGalgame } from './galgame'
import { getPatchResource } from './resource'
import { getComment } from './comment'

export const adminRouter = router({
  getAdminStats,

  getUserInfo,

  getGalgame,

  getPatchResource,

  getComment
})
