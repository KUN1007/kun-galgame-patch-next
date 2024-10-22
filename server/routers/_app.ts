import { router } from '~/lib/trpc'
import { loginRouter } from './login/index'

export const appRouter = router({
  login: loginRouter
})

export type AppRouter = typeof appRouter
