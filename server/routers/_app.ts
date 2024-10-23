import { createCallerFactory, createTRPCRouter } from './trpc'
import { loginRouter } from './login/index'

export const appRouter = createTRPCRouter({
  login: loginRouter
})

export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
