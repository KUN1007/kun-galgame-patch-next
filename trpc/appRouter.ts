import { router } from './trpc'
import { loginRouter } from '~/server/routers/login/index'

export const appRouter = router({
  login: loginRouter
})

export type AppRouter = typeof appRouter
