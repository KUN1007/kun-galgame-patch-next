import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { prisma } from '~/prisma/index'

export type Context = Awaited<ReturnType<typeof createContext>>

export const createContext = (opts?: FetchCreateContextFnOptions) => {
  return {
    prisma,
    headers: opts && Object.fromEntries(opts.req.headers)
  }
}
