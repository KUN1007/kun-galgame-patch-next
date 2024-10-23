import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { prisma } from '~/prisma/index'

export type Context = Awaited<ReturnType<typeof createContext>>

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export const createContext = (opts?: FetchCreateContextFnOptions) => {
  // for API-response caching see https://trpc.io/docs/v11/caching

  return {
    prisma,
    headers: opts && Object.fromEntries(opts.req.headers)
  }
}
