import { router } from '~/lib/trpc'
import { authRouter } from './auth/index'
import { editRouter } from './edit/index'
import { patchRouter } from './patch/index'

export const appRouter = router({
  auth: authRouter,
  edit: editRouter,
  patch: patchRouter
})

export type AppRouter = typeof appRouter
