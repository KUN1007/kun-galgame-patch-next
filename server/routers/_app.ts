import { router } from '~/lib/trpc'
import { authRouter } from './auth/index'
import { editRouter } from './edit/index'
import { patchRouter } from './patch/index'
import { userRouter } from './user/index'
import { forgotRouter } from './forgot/index'
import { galgameRouter } from './galgame/index'
import { searchRouter } from './search/index'
import { tagRouter } from './tag/index'
import { messageRouter } from './message/index'
import { applyRouter } from './apply/index'

export const appRouter = router({
  auth: authRouter,
  edit: editRouter,
  patch: patchRouter,
  user: userRouter,
  forgot: forgotRouter,
  galgame: galgameRouter,
  search: searchRouter,
  tag: tagRouter,
  message: messageRouter,
  app: applyRouter
})

export type AppRouter = typeof appRouter
