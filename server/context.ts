import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export type Context = Awaited<ReturnType<typeof createContext>>

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export const createContext = (opts?: FetchCreateContextFnOptions) => {
  // for API-response caching see https://trpc.io/docs/v11/caching

  return {
    headers: opts && Object.fromEntries(opts.req.headers)
  }
}
