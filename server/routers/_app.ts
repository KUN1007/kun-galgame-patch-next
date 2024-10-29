import { router } from '~/lib/trpc'
import { loginRouter } from './login/index'
import { editRouter } from './edit/index'

export const appRouter = router({
  login: loginRouter,
  edit: editRouter
})

export type AppRouter = typeof appRouter
