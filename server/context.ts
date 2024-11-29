import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export type Context = Awaited<ReturnType<typeof createContext>>

export const createContext = (opts?: FetchCreateContextFnOptions) => {
  return {
    headers: opts && Object.fromEntries(opts.req.headers)
  }
}

import { useKUNGalgameTask } from './cron'

useKUNGalgameTask()
