import { router } from '~/lib/trpc'
import { loginRouter } from './login/index'
import { editRouter } from './edit/index'
import { patchRouter } from './patch/index'

export const appRouter = router({
  login: loginRouter,
  edit: editRouter,
  patch: patchRouter
})

export type AppRouter = typeof appRouter
